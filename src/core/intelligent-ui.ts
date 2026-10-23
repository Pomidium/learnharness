import { Type, type Static } from "typebox";

/** Data-only visual explanation vocabulary shared by teacher and renderer.
 * No arbitrary HTML, URL, code, or host actions enter this contract. */
const item = Type.Object({
	label: Type.String({ minLength: 1, maxLength: 80 }),
	detail: Type.String({ minLength: 1, maxLength: 500 }),
});
const steps = Type.Object({
	kind: Type.Literal("steps"),
	heading: Type.String({ minLength: 1, maxLength: 100 }),
	items: Type.Array(item, { minItems: 2, maxItems: 8 }),
});
const comparison = Type.Object({
	kind: Type.Literal("comparison"),
	heading: Type.String({ minLength: 1, maxLength: 100 }),
	left: Type.String({ minLength: 1, maxLength: 60 }),
	right: Type.String({ minLength: 1, maxLength: 60 }),
	rows: Type.Array(Type.Object({
		criterion: Type.String({ minLength: 1, maxLength: 80 }),
		left: Type.String({ minLength: 1, maxLength: 250 }),
		right: Type.String({ minLength: 1, maxLength: 250 }),
	}), { minItems: 1, maxItems: 8 }),
});
const bars = Type.Object({
	kind: Type.Literal("bars"),
	heading: Type.String({ minLength: 1, maxLength: 100 }),
	unit: Type.String({ maxLength: 30, description: "Unit after each number, e.g. '%', 'seconds', or 'cases'." }),
	items: Type.Array(Type.Object({
		label: Type.String({ minLength: 1, maxLength: 80 }),
		value: Type.Number({ minimum: 0, maximum: 1000000 }),
		detail: Type.String({ minLength: 1, maxLength: 300 }),
	}), { minItems: 2, maxItems: 8 }),
});

export const intelligentUiSchema = Type.Object({
	title: Type.String({ minLength: 1, maxLength: 120 }),
	intro: Type.String({ minLength: 1, maxLength: 400 }),
	panels: Type.Array(Type.Union([steps, comparison, bars]), { minItems: 1, maxItems: 3 }),
	insight: Type.String({ minLength: 1, maxLength: 400, description: "The connection the learner should notice after exploring the panels." }),
});
export type IntelligentUiInput = Static<typeof intelligentUiSchema>;
