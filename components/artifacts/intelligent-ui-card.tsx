"use client";

import { useState } from "react";
import { Value } from "typebox/value";
import { intelligentUiSchema, type IntelligentUiInput, type ArtifactPartProps } from "@/src/core";

type Panel = IntelligentUiInput["panels"][number];

/** The untrusted transcript is checked again at the rendering boundary.
 * Only known React components render; model output never becomes code/HTML. */
export function IntelligentUiCard({ part }: ArtifactPartProps) {
	if (part.state !== "output-available") return null;
	if (!Value.Check(intelligentUiSchema, part.input)) {
		return <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Visual explanation unavailable.</div>;
	}
	const ui = part.input as IntelligentUiInput;
	return (
		<section className="rounded-xl border bg-card p-4 text-card-foreground" aria-label={`Visual explanation: ${ui.title}`}>
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Visual explanation</p>
			<h3 className="mt-1 text-base font-semibold">{ui.title}</h3>
			<p className="mt-2 text-sm text-muted-foreground">{ui.intro}</p>
			<div className="mt-4 grid gap-4">
				{ui.panels.map((panel, index) => <ExplanationPanel key={index} panel={panel} />)}
			</div>
			<p className="mt-4 border-t pt-3 text-sm"><span className="font-semibold">Notice: </span>{ui.insight}</p>
		</section>
	);
}

function ExplanationPanel({ panel }: { panel: Panel }) {
	const [selected, setSelected] = useState(0);
	if (panel.kind === "steps") {
		const current = panel.items[selected] ?? panel.items[0];
		return <div className="rounded-lg border p-3">
			<h4 className="text-sm font-semibold">{panel.heading}</h4>
			<div className="mt-3 flex flex-wrap gap-2" aria-label="Explore steps">
				{panel.items.map((step, index) => <button type="button" key={index} onClick={() => setSelected(index)}
					aria-pressed={selected === index}
					className={`rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${selected === index ? "border-foreground bg-accent text-foreground" : "text-muted-foreground hover:bg-accent"}`}>
					{index + 1}. {step.label}
				</button>)}
			</div>
			<p className="mt-3 text-sm" aria-live="polite">{current?.detail}</p>
		</div>;
	}
	if (panel.kind === "comparison") {
		return <div className="rounded-lg border p-3">
			<h4 className="text-sm font-semibold">{panel.heading}</h4>
			<div className="mt-3 grid grid-cols-[minmax(5rem,1fr)_repeat(2,minmax(0,2fr))] gap-x-2 text-sm">
				<span className="border-b pb-2" />
				<strong className="min-w-0 border-b pb-2 break-words">{panel.left}</strong>
				<strong className="min-w-0 border-b pb-2 break-words">{panel.right}</strong>
				{panel.rows.map((row, index) => <div key={index} className="col-span-3 grid grid-cols-subgrid border-b py-2 last:border-b-0">
					<span className="min-w-0 break-words font-medium">{row.criterion}</span>
					<span className="min-w-0 break-words text-muted-foreground">{row.left}</span>
					<span className="min-w-0 break-words text-muted-foreground">{row.right}</span>
				</div>)}
			</div>
		</div>;
	}
	const max = Math.max(...panel.items.map((bar) => bar.value));
	const current = panel.items[selected] ?? panel.items[0];
	return <div className="rounded-lg border p-3">
		<h4 className="text-sm font-semibold">{panel.heading}</h4>
		<div className="mt-3 grid gap-2" aria-label="Explore values">
			{panel.items.map((bar, index) => <button type="button" key={index} onClick={() => setSelected(index)}
				aria-pressed={selected === index}
				className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-md p-1 text-left text-xs transition-colors ${selected === index ? "bg-accent" : "hover:bg-accent"}`}>
				<span className="min-w-0 break-words">{bar.label}</span>
				<span className="tabular-nums">{bar.value.toLocaleString()} {panel.unit}</span>
				<span className="col-span-2 h-3 overflow-hidden rounded bg-muted"><span className="block h-full rounded bg-foreground/70" style={{ width: `${max === 0 ? 0 : bar.value / max * 100}%` }} /></span>
			</button>)}
		</div>
		<p className="mt-3 text-sm text-muted-foreground" aria-live="polite">{current?.detail}</p>
	</div>;
}
