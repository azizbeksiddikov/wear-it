import { OrderStatus } from '../enums/order.enum';

/** Largest quantity of one variant in one order. */
export const MAX_ITEM_QUANTITY = 20;
/** Orders under this subtotal pay `SHIPPING_COST` points for shipping. */
export const FREE_SHIPPING_FROM = 50;
export const SHIPPING_COST = 5;

type PricedLine = { itemQuantity: number; itemUnitPrice: number; salePrice?: number | null };

/** The unit price a shopper pays: the sale price when there is one (zero or missing means no sale). */
export function unitPriceOf(line: PricedLine): number {
	return line.salePrice ? line.salePrice : line.itemUnitPrice;
}

/** Subtotal, shipping and total for the given lines, rounded to one decimal like the storefront shows. */
export function priceOrder(lines: PricedLine[]) {
	const sum = lines.reduce((total, line) => total + unitPriceOf(line) * line.itemQuantity, 0);
	const orderSubTotal = parseFloat(sum.toFixed(1));
	const orderShippingCost = orderSubTotal < FREE_SHIPPING_FROM ? SHIPPING_COST : 0;
	const orderTotalAmount = parseFloat((orderSubTotal + orderShippingCost).toFixed(1));
	return { orderSubTotal, orderShippingCost, orderTotalAmount };
}

/**
 * The only status changes a shopper may make. Paying (PROCESSING) and refunding (CANCELLED) move points
 * and stock, so every other jump, and any repeat, is refused.
 */
const MOVES: Record<OrderStatus, OrderStatus[]> = {
	[OrderStatus.PAUSED]: [OrderStatus.PROCESSING, OrderStatus.DELETED],
	[OrderStatus.PROCESSING]: [OrderStatus.FINISHED, OrderStatus.CANCELLED],
	[OrderStatus.FINISHED]: [OrderStatus.CANCELLED, OrderStatus.DELETED],
	[OrderStatus.CANCELLED]: [OrderStatus.DELETED],
	[OrderStatus.DELETED]: [],
};

export function canMoveOrder(from: OrderStatus, to: OrderStatus): boolean {
	return (MOVES[from] ?? []).includes(to);
}
