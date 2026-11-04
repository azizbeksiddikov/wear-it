/** Escape regex characters so shopper-typed search text matches literally (and `(` cannot crash a query). */
export function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
