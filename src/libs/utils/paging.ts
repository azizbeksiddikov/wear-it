export const DEFAULT_PAGE_SIZE = 6;
export const MAX_PAGE_SIZE = 100;

const wholeNumber = (value: unknown): number | null => {
	const n = Number(value);
	return value !== undefined && value !== '' && Number.isInteger(n) ? n : null;
};

/**
 * Page number and page size from a query string. Both are whole numbers: the page starts at 1 and the size is
 * between 1 and `MAX_PAGE_SIZE`. A missing, non-numeric, zero or negative value falls back to the default instead
 * of reaching the database, where it used to crash the request.
 */
export function parsePaging(page: unknown, limit: unknown): { page: number; limit: number } {
	const p = wholeNumber(page);
	const l = wholeNumber(limit);
	return {
		page: p !== null && p >= 1 ? p : 1,
		limit: l !== null && l >= 1 ? Math.min(l, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE,
	};
}
