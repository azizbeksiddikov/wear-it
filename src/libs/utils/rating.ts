/**
 * Ratings are shown with one decimal (4.6, not 4.5714). The stored average keeps full precision on purpose:
 * `Review.service` updates it from the old average times the review count, so rounding on write would drift.
 * Round only when sending a product to a client.
 */
export const roundRating = (value: unknown): number => {
	const n = Number(value);
	return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
};
