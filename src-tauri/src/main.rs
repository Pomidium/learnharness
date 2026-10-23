use std::{io::{Read, Write}, net::{TcpListener, TcpStream}, path::PathBuf, process::{Child, Command, Stdio}, sync::Mutex, thread, time::Duration};
use tauri::{ipc::CapabilityBuilder, webview::NewWindowResponse, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

fn open_external(url: &tauri::Url) {
    if matches!(url.scheme(), "http" | "https" | "mailto") {
        let _ = Command::new("/usr/bin/open").arg(url.as_str()).spawn();
    }
}


#[tauri::command]
fn expand_window(window: WebviewWindow) -> Result<(), String> {
    let size = window.inner_size().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    if (size.width as f64) / scale < 928.0 {
        window.set_size(tauri::Size::Logical(tauri::LogicalSize::new(928.0, (size.height as f64) / scale))).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_zoom(window: WebviewWindow, factor: f64) -> Result<f64, String> {
    if !factor.is_finite() || !(0.5..=2.0).contains(&factor) { return Err("invalid zoom factor".into()); }
    window.set_zoom(factor).map_err(|e| e.to_string())?;
    Ok(factor)
}


struct Server(Mutex<Child>);
impl Drop for Server {
    fn drop(&mut self) {
        if let Ok(mut child) = self.0.lock() { let _ = child.kill(); let _ = child.wait(); }
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    tauri::Builder::default().invoke_handler(tauri::generate_handler![expand_window, set_zoom]).setup(|app| {
        let resources = app.path().resource_dir()?;
        let server = resources.join("server");
        let entry = server.join("server.js");
        let node = std::env::current_exe()?.with_file_name("node");
        if !entry.is_file() || !node.is_file() {
            return Err("Omnilearn server or bundled Node is missing".into());
        }
        let data: PathBuf = app.path().app_data_dir()?;
        std::fs::create_dir_all(&data)?;
        let port_listener = TcpListener::bind("127.0.0.1:0")?;
        let port = port_listener.local_addr()?.port();
        drop(port_listener);
        let mut child = Command::new(node).arg(entry).current_dir(server)
            .env_remove("ELECTRON_RUN_AS_NODE")
            .env("NODE_ENV", "production").env("OMNILEARN_TAURI", "1").env("PORT", port.to_string())
            .env("HOSTNAME", "127.0.0.1")
            .env("LH_DATA_DIR", data.join("data"))
            .env("LH_AUTH_FILE", data.join("auth.json"))
            .stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).spawn()?;
        let mut ready = false;
        for _ in 0..150 {
            if child.try_wait()?.is_some() { break; }
            if let Ok(mut socket) = TcpStream::connect(("127.0.0.1", port)) {
                let _ = socket.set_read_timeout(Some(Duration::from_millis(500)));
                if socket.write_all(b"GET / HTTP/1.0\r\nHost: 127.0.0.1\r\n\r\n").is_ok() {
                    let mut response = [0u8; 16];
                    if socket.read(&mut response).unwrap_or(0) >= 5 && &response[..5] == b"HTTP/" { ready = true; break; }
                }
            }
            thread::sleep(Duration::from_millis(200));
        }
        if !ready { let _ = child.kill(); let _ = child.wait(); return Err("Omnilearn server did not become ready".into()); }
        app.manage(Server(Mutex::new(child)));
        let origin = format!("http://127.0.0.1:{port}");
        app.add_capability(CapabilityBuilder::new("omnilearn-loopback")
            .local(false).remote(origin.clone()).window("main")
            .permission("allow-expand-window").permission("allow-set-zoom"))?;
        WebviewWindowBuilder::new(app, "main", WebviewUrl::External(origin.parse()?))
            .on_navigation({
                let origin = origin.clone();
                move |target| {
                    let own = target.scheme() == "http" && target.host_str() == Some("127.0.0.1")
                        && target.port() == origin.rsplit(':').next().and_then(|p| p.parse::<u16>().ok());
                    if !own { open_external(target); }
                    own
                }
            })
            .on_new_window(|target, _features| {
                open_external(&target);
                NewWindowResponse::Deny
            })
            .initialization_script(include_str!("../host-bridge.js"))
            .title("Omnilearn").inner_size(1100.0, 760.0).min_inner_size(640.0, 480.0).build()?;
        Ok(())
    }).run(tauri::generate_context!())?;
    Ok(())
}

fn main() { if let Err(error) = run() { eprintln!("Omnilearn: {error}"); } }
