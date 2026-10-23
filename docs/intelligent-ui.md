# Intelligent UI in Omnilearn

The teacher has an optional `intelligent_ui` tool for visual explanations. Ordinary prose is still the default. The tool can compose a step-by-step reveal, side-by-side comparison, or selectable numeric bars (at most three panels). The teacher supplies the complete explanation as bounded, typed data; the UI renders those values as local React components with keyboard-operable controls. It does not execute model-written HTML, JavaScript, or remote code, and it does not call an extra model or change the existing lesson record format.

## Why this path

[thesysdev/open-intelligent-ui](https://github.com/thesysdev/open-intelligent-ui) supplies the pattern: the model arranges a limited, registered vocabulary of components and the application retains ownership of rendering. Omnilearn adopts that boundary, not its Next chat shell, hosted Gateway, or `HtmlView`; no upstream code is copied. [CopilotKit/OpenIntelligentUI](https://github.com/CopilotKit/OpenIntelligentUI) takes a different route through generated executable UI, Websandbox, and a Python/LangGraph/CopilotKit runtime. That is powerful for arbitrary tools, but it would duplicate this app's agent/session architecture and its existing sandboxed `demo` tool.

## Boundaries

- `src/core/intelligent-ui.ts` owns the browser-safe schema and its size limits. A tool call and a persisted record must both satisfy it.
- `src/agent/tools/intelligent-ui.ts` owns the single direct tool. `src/agent/tools.ts` registers it for teachers, not probers; the Agent settings page can switch it off independently.
- `components/artifacts/intelligent-ui-card.tsx` renders its arguments only after a successful tool result and independently validates the stored input. `components/artifacts/index.ts` is the artifact registry; the chat rendering code stays untouched.
- `src/agent/prompts/teacher/50-demos.md` differentiates prose, this tool, inline Mermaid, the existing precise-SVG `visual`, and the existing sandboxed-code `demo`. They remain separate choices, not automatic replacements.

## Composition

- **Alone:** the tool presents a bounded visual explanation in the existing transcript. It works without a job runner or any other artifact tool.
- **Pairs:** with `demo`, `visual`, and Mermaid, the teacher picks the smallest useful medium. Each owns its own rendering and execution boundary; none automatically invokes another.
- **Enforcement:** the schema limits content size and allowed components, and the renderer validates again. No URL, HTML, script, or filesystem capability is granted. Existing question/phase and tool-enablement restrictions still apply.
- **Signal:** each artifact says “Visual explanation”; the existing cards retain their own labels. No new global mode or footer signal is introduced.
- **Restore:** the tool arguments and result live in the normal persisted session; remounting renders them from that record with local selection reset to the first item. It depends on no extension load order or global state.
