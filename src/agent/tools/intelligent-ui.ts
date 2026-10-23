import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Value } from "typebox/value";
import { intelligentUiSchema } from "../../core/intelligent-ui.ts";
import { serverExecute } from "../tool-execute.ts";

/** Direct tool: the generated object itself lives in the transcript as tool
 * arguments. It needs no extra model, background job, external scripts or
 * privileged host bridge. The normal persisted tool-result path renders it. */
export const intelligentUiTool: AgentTool<typeof intelligentUiSchema> = {
	name: "intelligent_ui",
	label: "intelligent_ui",
	description:
		"Present an interactive visual explanation using safe, structured components: a step-by-step reveal, a side-by-side comparison, and/or selectable numeric bars. " +
		"Use selectively when a learner would benefit from exploring a sequence, contrast, or data; ordinary prose remains the default. " +
		"Unlike demo, this is immediate and declarative: no HTML, JavaScript, SVG, URLs, or external execution. " +
		"Make every panel factually grounded, with labeled values and an explicit insight; do not use for precise geometry (visual), simulations (demo), or simple relationships (inline mermaid).",
	parameters: intelligentUiSchema,
	execute: serverExecute("intelligent_ui", intelligentUiSchema, (input) => {
		if (!Value.Check(intelligentUiSchema, input)) throw new Error("Invalid visual explanation input");
		return `Presented visual explanation "${input.title}" with ${input.panels.length} panel${input.panels.length === 1 ? "" : "s"}. Refer to its controls and the insight as you teach.`;
	}),
};
