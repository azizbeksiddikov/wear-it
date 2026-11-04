import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrderStatus } from '../src/libs/enums/order.enum';
import { canMoveOrder, priceOrder, unitPriceOf } from '../src/libs/utils/orderPricing';

describe('priceOrder', () => {
	it('uses the sale price when there is one and adds shipping under 50', () => {
		assert.deepEqual(priceOrder([{ itemQuantity: 2, itemUnitPrice: 20, salePrice: 12.5 }]), {
			orderSubTotal: 25,
			orderShippingCost: 5,
			orderTotalAmount: 30,
		});
	});

	it('ships free from 50 and rounds to one decimal', () => {
		const lines = [{ itemQuantity: 3, itemUnitPrice: 16.67 }];
		assert.deepEqual(priceOrder(lines), { orderSubTotal: 50, orderShippingCost: 0, orderTotalAmount: 50 });
	});

	it('treats a zero or missing sale price as no sale', () => {
		assert.equal(unitPriceOf({ itemQuantity: 1, itemUnitPrice: 40, salePrice: 0 }), 40);
		assert.equal(unitPriceOf({ itemQuantity: 1, itemUnitPrice: 40, salePrice: null }), 40);
	});
});

describe('canMoveOrder', () => {
	it('allows only the moves the storefront makes', () => {
		assert.equal(canMoveOrder(OrderStatus.PAUSED, OrderStatus.PROCESSING), true);
		assert.equal(canMoveOrder(OrderStatus.PROCESSING, OrderStatus.FINISHED), true);
		assert.equal(canMoveOrder(OrderStatus.FINISHED, OrderStatus.CANCELLED), true);
		assert.equal(canMoveOrder(OrderStatus.CANCELLED, OrderStatus.DELETED), true);
	});

	it('refuses repeats, free refunds and jumps back', () => {
		assert.equal(canMoveOrder(OrderStatus.PROCESSING, OrderStatus.PROCESSING), false);
		assert.equal(canMoveOrder(OrderStatus.PAUSED, OrderStatus.CANCELLED), false);
		assert.equal(canMoveOrder(OrderStatus.CANCELLED, OrderStatus.PROCESSING), false);
		assert.equal(canMoveOrder(OrderStatus.DELETED, OrderStatus.PAUSED), false);
		assert.equal(canMoveOrder(OrderStatus.PROCESSING, OrderStatus.DELETED), false);
	});
});
