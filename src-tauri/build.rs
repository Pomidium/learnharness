fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&["expand_window", "set_zoom"]),
    )).expect("failed to build Tauri application");
}
