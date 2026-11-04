import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { POINTS_BALANCE_CAP } from '../src/libs/config';
import { startTestApp } from './helpers/testApp';

/**
 * API tests: the real Express app against an in-memory MongoDB (see helpers/testApp.ts).
 * The first run downloads a MongoDB binary; after that no network is needed.
 */

let ctx: Awaited<ReturnType<typeof startTestApp>>;
let Product: typeof import('../src/schema/Product.model').default;
let ProductVariant: typeof import('../src/schema/ProductVariant.model').default;
let Member: typeof import('../src/schema/Member.model').default;

const ids: Record<string, any> = {};
let counter = 0;

/** Signs up a fresh member and returns an agent that keeps the login cookie. */
const signup = async () => {
	counter += 1;
	const agent = request.agent(ctx.app);
	const res = await agent.post('/member/signup').send({
		memberEmail: `member${counter}@test.example`,
		memberPhone: `+82-10-0000-${String(counter).padStart(4, '0')}`,
		memberPassword: 'secret123',
		memberFullName: `Test Member ${counter}`,
	});
	assert.equal(res.status, 201);
	return { agent, member: res.body.member, email: `member${counter}@test.example` };
};

const orderBody = (variantKey: string, quantity: number, unitPrice: number) => ({
	orderShippingAddress: '1 Test Street, Seoul',
	orderSubTotal: unitPrice * quantity,
	orderShippingCost: 0,
	orderTotalAmount: unitPrice * quantity,
	orderItems: [
		{
			productId: ids[variantKey].productId,
			variantId: ids[variantKey]._id,
			productName: 'Classic Denim Jacket',
			productCategory: 'JACKETS',
			productGender: 'UNISEX',
			productImage: 'https://example.test/jacket.jpg',
			productSize: ids[variantKey].size,
			productColor: 'BLUE',
			itemUnitPrice: unitPrice,
			salePrice: null,
			itemQuantity: quantity,
		},
	],
});

const stockOf = async (variantKey: string) =>
	(await ProductVariant.findById(ids[variantKey]._id).lean())!.stockQuantity;

before(async () => {
	ctx = await startTestApp();
	Product = (await import('../src/schema/Product.model')).default;
	ProductVariant = (await import('../src/schema/ProductVariant.model')).default;
	Member = (await import('../src/schema/Member.model')).default;

	const make = async (
		name: string,
		productCategory: string,
		productGender: string,
		extra: Record<string, unknown>,
		variants: { size: string; color: string; price: number; stock: number; key?: string }[],
	) => {
		const product = await Product.create({ productName: name, productCategory, productGender, ...extra });
		for (const v of variants) {
			const variant = await ProductVariant.create({
				productId: product._id,
				size: v.size,
				color: v.color,
				productPrice: v.price,
				stockQuantity: v.stock,
			});
			if (v.key) ids[v.key] = variant.toObject();
		}
		return product;
	};

	ids.jacket = await make('Classic Denim Jacket', 'JACKETS', 'UNISEX', { isActive: true }, [
		{ size: 'M', color: 'BLUE', price: 80, stock: 20, key: 'jacketM' },
		{ size: 'L', color: 'BLUE', price: 80, stock: 20, key: 'jacketL' },
		{ size: 'S', color: 'BLUE', price: 80, stock: 20, key: 'jacketS' },
		{ size: 'XL', color: 'BLUE', price: 80, stock: 20, key: 'jacketXL' },
	]);
	await make('Slim Denim Jeans', 'JEANS', 'MEN', { isActive: true }, [
		{ size: '32', color: 'BLUE', price: 60, stock: 10 },
	]);
	await make('Cotton Tee', 'TOPS', 'WOMEN', { isActive: true, isFeatured: true }, [
		{ size: 'S', color: 'WHITE', price: 20, stock: 20 },
	]);
	await make('Wool Sweater', 'SWEATERS', 'WOMEN', { isActive: true }, [
		{ size: 'M', color: 'GREY', price: 50, stock: 4 },
	]);
	await make('Hidden Prototype', 'TOPS', 'MEN', { isActive: false }, [
		{ size: 'M', color: 'BLACK', price: 10, stock: 1 },
	]);
});

after(async () => {
	await ctx.stop();
});

describe('health', () => {
	it('answers healthy', async () => {
		const res = await request(ctx.app).get('/health');
		assert.equal(res.status, 200);
		assert.deepEqual(res.body, { status: 'healthy' });
	});
});

describe('signup and login', () => {
	it('signs up with 100 points, an httpOnly cookie, and no token or password in the body', async () => {
		const agent = request.agent(ctx.app);
		const res = await agent.post('/member/signup').send({
			memberEmail: 'first@test.example',
			memberPhone: '+82-10-1111-1111',
			memberPassword: 'secret123',
			memberFullName: 'First Member',
		});
		assert.equal(res.status, 201);
		assert.equal(res.body.member.memberEmail, 'first@test.example');
		assert.equal(res.body.member.memberPoints, 100);
		assert.equal(res.body.member.memberType, 'USER');
		assert.ok(!res.body.member.memberPassword, 'the password hash must not be returned');
		assert.equal(res.body.accessToken, undefined, 'the token must only travel in the cookie');

		const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('accessToken='));
		assert.ok(cookie, 'sets the accessToken cookie');
		assert.match(cookie!, /HttpOnly/i);
		assert.match(cookie!, /SameSite=Lax/i);
		assert.match(cookie!, /Path=\//);
	});

	it('refuses a duplicate email or phone with USED_EMAIL_PHONE', async () => {
		const res = await request(ctx.app).post('/member/signup').send({
			memberEmail: 'first@test.example',
			memberPhone: '+82-10-9999-9999',
			memberPassword: 'secret123',
		});
		assert.equal(res.status, 400);
		assert.equal(res.body.errorCode, 'USED_EMAIL_PHONE');
	});

	it('logs in and sets an httpOnly cookie', async () => {
		const res = await request(ctx.app)
			.post('/member/login')
			.send({ memberEmail: 'first@test.example', memberPassword: 'secret123' });
		assert.equal(res.status, 200);
		assert.equal(res.body.member.memberEmail, 'first@test.example');
		assert.equal(res.body.accessToken, undefined);
		const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('accessToken='));
		assert.match(cookie!, /HttpOnly/i);
	});

	it('answers WRONG_PASSWORD (401) and NO_MEMBER_EMAIL (404)', async () => {
		const wrong = await request(ctx.app)
			.post('/member/login')
			.send({ memberEmail: 'first@test.example', memberPassword: 'nope' });
		assert.equal(wrong.status, 401);
		assert.equal(wrong.body.errorCode, 'WRONG_PASSWORD');

		const unknown = await request(ctx.app)
			.post('/member/login')
			.send({ memberEmail: 'nobody@test.example', memberPassword: 'secret123' });
		assert.equal(unknown.status, 404);
		assert.equal(unknown.body.errorCode, 'NO_MEMBER_EMAIL');
	});

	it('answers BLOCKED_USER (403) for a blocked member', async () => {
		const { email } = await signup();
		await Member.updateOne({ memberEmail: email }, { memberStatus: 'BLOCKED' });
		const res = await request(ctx.app).post('/member/login').send({ memberEmail: email, memberPassword: 'secret123' });
		assert.equal(res.status, 403);
		assert.equal(res.body.errorCode, 'BLOCKED_USER');
	});
});

describe('member detail and logout', () => {
	it('answers 401 NOT_AUTHENTICATED without a login', async () => {
		const res = await request(ctx.app).get('/member/detail');
		assert.equal(res.status, 401);
		assert.equal(res.body.errorCode, 'NOT_AUTHENTICATED');
	});

	it('answers 401 for a forged cookie', async () => {
		const res = await request(ctx.app).get('/member/detail').set('Cookie', 'accessToken=not-a-real-token');
		assert.equal(res.status, 401);
		assert.equal(res.body.errorCode, 'NOT_AUTHENTICATED');
	});

	it('returns the member (without the password) when logged in', async () => {
		const { agent, member } = await signup();
		const res = await agent.get('/member/detail');
		assert.equal(res.status, 200);
		assert.equal(res.body._id, member._id);
		assert.ok(!res.body.memberPassword);
	});

	it('clears the cookie on logout', async () => {
		const { agent } = await signup();
		const res = await agent.post('/member/logout');
		assert.equal(res.status, 200);
		const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('accessToken='));
		assert.ok(cookie);
		assert.match(cookie!, /accessToken=;/);
		assert.match(cookie!, /HttpOnly/i);

		const after = await agent.get('/member/detail');
		assert.equal(after.status, 401);
	});
});

describe('products', () => {
	it('lists only active products, with their variants', async () => {
		const res = await request(ctx.app).get('/product/all?page=1&limit=10');
		assert.equal(res.status, 200);
		assert.equal(res.body.count[0].total, 4);
		assert.equal(res.body.list.length, 4);
		assert.ok(!res.body.list.some((p: any) => p.productName === 'Hidden Prototype'));
		const jacket = res.body.list.find((p: any) => p.productName === 'Classic Denim Jacket');
		assert.equal(jacket.productVariants.length, 4);
		assert.equal(jacket.cheapestProductVariant.productPrice, 80);
	});

	it('pages the list', async () => {
		const first = await request(ctx.app).get('/product/all?page=1&limit=3');
		const second = await request(ctx.app).get('/product/all?page=2&limit=3');
		const third = await request(ctx.app).get('/product/all?page=3&limit=3');
		assert.equal(first.body.list.length, 3);
		assert.equal(second.body.list.length, 1);
		assert.equal(third.body.list.length, 0);
		assert.equal(first.body.count[0].total, 4);
		const seen = new Set([...first.body.list, ...second.body.list].map((p: any) => p._id));
		assert.equal(seen.size, 4, 'no product is repeated across pages');
	});

	it('searches by name, ignoring case', async () => {
		const res = await request(ctx.app).get('/product/all?page=1&limit=10&search=DENIM');
		assert.equal(res.status, 200);
		assert.deepEqual(res.body.list.map((p: any) => p.productName).sort(), ['Classic Denim Jacket', 'Slim Denim Jeans']);
	});

	it('sorts oldest first by default and newest first with direction=-1', async () => {
		const asc = await request(ctx.app).get('/product/all?page=1&limit=10&direction=1');
		const desc = await request(ctx.app).get('/product/all?page=1&limit=10&direction=-1');
		assert.equal(asc.status, 200);
		assert.equal(desc.status, 200);
		assert.equal(asc.body.list[0].productName, 'Classic Denim Jacket');
		assert.equal(desc.body.list[0].productName, 'Wool Sweater');
	});

	it('filters by gender and by featured', async () => {
		const women = await request(ctx.app).get('/product/all?page=1&limit=10&productGender=WOMEN');
		assert.equal(women.body.list.length, 2);
		const featured = await request(ctx.app).get('/product/all?page=1&limit=10&isFeatured=true');
		assert.deepEqual(
			featured.body.list.map((p: any) => p.productName),
			['Cotton Tee'],
		);
	});

	it('returns one product with variants and reviews, and counts a view once per member', async () => {
		const anonymous = await request(ctx.app).get(`/product/${ids.jacket._id}`);
		assert.equal(anonymous.status, 200);
		assert.equal(anonymous.body.productName, 'Classic Denim Jacket');
		assert.equal(anonymous.body.productVariants.length, 4);
		assert.deepEqual(anonymous.body.productReviews, []);

		const { agent } = await signup();
		await agent.get(`/product/${ids.jacket._id}`);
		await agent.get(`/product/${ids.jacket._id}`);
		const product = await Product.findById(ids.jacket._id).lean();
		assert.equal(product!.productViews, 1);
	});
});

describe('product ratings', () => {
	it('sends ratings with one decimal and keeps the stored average exact', async () => {
		await Product.updateOne({ _id: ids.jacket._id }, { reviewsRating: 4.5714285, reviewsCount: 7 });

		const list = await request(ctx.app).get('/product/all?page=1&limit=10');
		const inList = list.body.list.find((p: any) => p.productName === 'Classic Denim Jacket');
		assert.equal(inList.reviewsRating, 4.6);

		const detail = await request(ctx.app).get(`/product/${ids.jacket._id}`);
		assert.equal(detail.body.reviewsRating, 4.6);

		const stored = await Product.findById(ids.jacket._id).lean();
		assert.equal(stored!.reviewsRating, 4.5714285);
		await Product.updateOne({ _id: ids.jacket._id }, { reviewsRating: 0, reviewsCount: 0 });
	});
});

describe('points: top-up and profile update', () => {
	it('tops up free points and returns the updated member', async () => {
		const { agent } = await signup();
		const res = await agent.post('/member/topup').send({ amount: 250 });
		assert.equal(res.status, 200);
		assert.equal(res.body.memberPoints, 350);
		assert.ok(!res.body.memberPassword);

		const detail = await agent.get('/member/detail');
		assert.equal(detail.body.memberPoints, 350);
	});

	it('needs a login', async () => {
		const res = await request(ctx.app).post('/member/topup').send({ amount: 10 });
		assert.equal(res.status, 401);
		assert.equal(res.body.errorCode, 'NOT_AUTHENTICATED');
	});

	it('rejects invalid amounts with TOPUP_INVALID_AMOUNT and leaves the balance alone', async () => {
		const { agent } = await signup();
		for (const amount of [0, -5, 1001, 1.5, '100', null, undefined, [100]]) {
			const res = await agent.post('/member/topup').send({ amount });
			assert.equal(res.status, 400, `amount ${JSON.stringify(amount)}`);
			assert.equal(res.body.errorCode, 'TOPUP_INVALID_AMOUNT');
		}
		const noBody = await agent.post('/member/topup').send({});
		assert.equal(noBody.body.errorCode, 'TOPUP_INVALID_AMOUNT');
		assert.equal((await agent.get('/member/detail')).body.memberPoints, 100);
	});

	it('stops at the balance cap with TOPUP_LIMIT_REACHED', async () => {
		const { agent } = await signup();
		// 100 + 9 x 1000 + 900 = 10000 exactly
		for (let i = 0; i < 9; i += 1) assert.equal((await agent.post('/member/topup').send({ amount: 1000 })).status, 200);
		const last = await agent.post('/member/topup').send({ amount: 900 });
		assert.equal(last.status, 200);
		assert.equal(last.body.memberPoints, POINTS_BALANCE_CAP);

		const over = await agent.post('/member/topup').send({ amount: 1 });
		assert.equal(over.status, 400);
		assert.equal(over.body.errorCode, 'TOPUP_LIMIT_REACHED');
		assert.equal((await agent.get('/member/detail')).body.memberPoints, POINTS_BALANCE_CAP);
	});

	it('cannot pass the cap with parallel requests', async () => {
		const { agent } = await signup();
		const results = await Promise.all(
			Array.from({ length: 15 }, () => agent.post('/member/topup').send({ amount: 1000 })),
		);
		const ok = results.filter((r) => r.status === 200).length;
		const refused = results.filter((r) => r.status === 400 && r.body.errorCode === 'TOPUP_LIMIT_REACHED').length;
		assert.equal(ok + refused, 15);
		const points = (await agent.get('/member/detail')).body.memberPoints;
		assert.ok(points <= POINTS_BALANCE_CAP, `balance ${points} is over the cap`);
		assert.equal(points, 100 + ok * 1000);
	});

	it('ignores memberPoints, memberType and memberStatus in a profile update', async () => {
		const { agent } = await signup();
		const res = await agent.post('/member/update').send({
			memberFullName: 'Renamed',
			memberAddress: '5 New Road',
			memberPoints: 99999,
			memberType: 'ADMIN',
			memberStatus: 'ACTIVE',
		});
		assert.equal(res.status, 200);
		assert.equal(res.body.memberFullName, 'Renamed');
		assert.equal(res.body.memberAddress, '5 New Road');
		assert.equal(res.body.memberPoints, 100);
		assert.equal(res.body.memberType, 'USER');
	});

	it('hashes a new password so the member can log in with it', async () => {
		const { agent, email } = await signup();
		assert.equal((await agent.post('/member/update').send({ memberPassword: 'brand-new-pass' })).status, 200);
		const stored = await Member.findOne({ memberEmail: email }).select('+memberPassword').lean();
		assert.notEqual(stored!.memberPassword, 'brand-new-pass');
		const login = await request(ctx.app)
			.post('/member/login')
			.send({ memberEmail: email, memberPassword: 'brand-new-pass' });
		assert.equal(login.status, 200);
	});

	it('answers 400 UPDATE_FAILED (not 304) when the email is already used', async () => {
		const first = await signup();
		const second = await signup();
		const res = await second.agent.post('/member/update').send({ memberEmail: first.email });
		assert.equal(res.status, 400);
		assert.equal(res.body.errorCode, 'UPDATE_FAILED');
	});
});

describe('product search text', () => {
	it('treats regex characters as plain text instead of failing', async () => {
		for (const text of ['(', '[', '*', '\\', 'denim)', '.*']) {
			const res = await request(ctx.app).get('/product/all').query({ page: 1, limit: 10, search: text });
			assert.equal(res.status, 200, `search "${text}" answered ${res.status}`);
			assert.ok(Array.isArray(res.body.list));
		}
		const found = await request(ctx.app).get('/product/all').query({ page: 1, limit: 10, search: 'denim' });
		assert.ok(found.body.list.length > 0);
	});
});

describe('unknown addresses', () => {
	it('answer 404 with the JSON error body, not an HTML page', async () => {
		const res = await request(ctx.app).get('/no/such/route');
		assert.equal(res.status, 404);
		assert.equal(res.body.errorCode, 'NO_DATA_FOUND');
		assert.equal(res.body.code, 404);
	});

	it('answer 404 for a product that does not exist or an id that is not an id', async () => {
		const missing = await request(ctx.app).get('/product/64b000000000000000000000');
		assert.equal(missing.status, 404);
		assert.equal(missing.body.errorCode, 'NO_DATA_FOUND');
		const garbage = await request(ctx.app).get('/product/not-an-id');
		assert.equal(garbage.status, 404);
		assert.equal(garbage.body.errorCode, 'NO_DATA_FOUND');
	});
});

describe('orders', () => {
	it('creates a PAUSED order for the member', async () => {
		const { agent } = await signup();
		const res = await agent.post('/order/create').send(orderBody('jacketM', 1, 80));
		assert.equal(res.status, 201);
		assert.equal(res.body.orderStatus, 'PAUSED');
		assert.equal(res.body.orderTotalAmount, 80);

		const mine = await agent.get('/order/all');
		assert.equal(mine.status, 200);
		assert.equal(mine.body.length, 1);
		assert.equal(mine.body[0].orderItems.length, 1);
	});

	it('needs an address and enough points to start processing', async () => {
		const { agent } = await signup();
		const order = (await agent.post('/order/create').send(orderBody('jacketM', 1, 80))).body;

		const noAddress = await agent
			.post('/order/update')
			.send({ _id: order._id, orderStatus: 'PROCESSING', orderTotalAmount: 80 });
		assert.equal(noAddress.status, 400);
		assert.equal(noAddress.body.errorCode, 'NO_ADDRESS');

		await agent.post('/member/update').send({ memberAddress: '1 Test Street, Seoul' });
		const big = (await agent.post('/order/create').send(orderBody('jacketM', 5, 80))).body;
		const tooMuch = await agent
			.post('/order/update')
			.send({ _id: big._id, orderStatus: 'PROCESSING', orderTotalAmount: 400 });
		assert.equal(tooMuch.status, 400);
		assert.equal(tooMuch.body.errorCode, 'NOT_ENOUGH_POINTS');
	});

	it('reduces stock and points when processing starts, and gives them back on cancel', async () => {
		const { agent } = await signup();
		await agent.post('/member/update').send({ memberAddress: '1 Test Street, Seoul' });
		const stockBefore = await stockOf('jacketL');

		const order = (await agent.post('/order/create').send(orderBody('jacketL', 1, 80))).body;
		const started = await agent
			.post('/order/update')
			.send({ _id: order._id, orderStatus: 'PROCESSING', orderTotalAmount: 80 });
		assert.equal(started.status, 200);
		assert.equal(started.body.order.orderStatus, 'PROCESSING');
		assert.equal(started.body.member.memberPoints, 20);
		assert.equal(await stockOf('jacketL'), stockBefore - 1);

		const cancelled = await agent
			.post('/order/update')
			.send({ _id: order._id, orderStatus: 'CANCELLED', orderTotalAmount: 80 });
		assert.equal(cancelled.status, 200);
		assert.equal(cancelled.body.member.memberPoints, 100);
		assert.equal(await stockOf('jacketL'), stockBefore);
	});

	it('prices the order from the database, ignoring prices and totals sent by the client', async () => {
		const { agent } = await signup();
		const body = orderBody('jacketM', 2, 1); // the client claims 1 point per jacket
		body.orderItems[0].itemUnitPrice = 1;
		body.orderItems[0].salePrice = 1 as unknown as null;
		const res = await agent.post('/order/create').send({ ...body, orderSubTotal: 2, orderTotalAmount: 2 });
		assert.equal(res.status, 201);
		assert.equal(res.body.orderSubTotal, 160);
		assert.equal(res.body.orderShippingCost, 0);
		assert.equal(res.body.orderTotalAmount, 160);

		const mine = await agent.get('/order/all');
		assert.equal(mine.body[0].orderItems[0].itemUnitPrice, 80);
		assert.equal(mine.body[0].orderItems[0].productName, 'Classic Denim Jacket');
	});

	it('adds shipping under 50 points and rejects empty, unknown or silly orders', async () => {
		const { agent } = await signup();
		const tee = await Product.findOne({ productName: 'Cotton Tee' }).lean();
		const teeVariant = await ProductVariant.findOne({ productId: tee!._id }).lean();
		const teeOrder = orderBody('jacketM', 1, 80);
		teeOrder.orderItems[0].productId = tee!._id as never;
		teeOrder.orderItems[0].variantId = teeVariant!._id as never;
		const cheap = await agent.post('/order/create').send(teeOrder);
		assert.equal(cheap.status, 201);
		assert.equal(cheap.body.orderSubTotal, 20);
		assert.equal(cheap.body.orderShippingCost, 5);
		assert.equal(cheap.body.orderTotalAmount, 25);

		for (const bad of [
			{ ...orderBody('jacketM', 1, 80), orderItems: [] },
			{ ...orderBody('jacketM', 1, 80), orderShippingAddress: '   ' },
			orderBody('jacketM', 0, 80),
			orderBody('jacketM', -3, 80),
			orderBody('jacketM', 1.5, 80),
			orderBody('jacketM', 999, 80),
		]) {
			const res = await agent.post('/order/create').send(bad);
			assert.equal(res.status, 400);
			assert.equal(res.body.errorCode, 'INVALID_ORDER');
		}
		const unknown = orderBody('jacketM', 1, 80);
		unknown.orderItems[0].variantId = '64b000000000000000000000' as never;
		assert.equal((await agent.post('/order/create').send(unknown)).body.errorCode, 'INVALID_ORDER');

		const tooMany = await agent.post('/order/create').send(orderBody('jacketM', 20, 80));
		assert.equal(tooMany.status, 201); // within the 20 per line limit and in stock
		const sweater = await Product.findOne({ productName: 'Wool Sweater' }).lean();
		const sweaterVariant = await ProductVariant.findOne({ productId: sweater!._id }).lean();
		const outOfStock = orderBody('jacketM', 5, 50);
		outOfStock.orderItems[0].productId = sweater!._id as never;
		outOfStock.orderItems[0].variantId = sweaterVariant!._id as never; // only 4 in stock
		const res = await agent.post('/order/create').send(outOfStock);
		assert.equal(res.status, 400);
		assert.equal(res.body.errorCode, 'OUT_OF_STOCK');
	});

	it('charges the stored total, not the amount sent when paying', async () => {
		const { agent } = await signup();
		await agent.post('/member/update').send({ memberAddress: '1 Test Street, Seoul' });
		const order = (await agent.post('/order/create').send(orderBody('jacketM', 1, 80))).body;
		const res = await agent.post('/order/update').send({
			_id: order._id,
			orderStatus: 'PROCESSING',
			orderTotalAmount: 1, // tries to pay one point
			orderSubTotal: 1,
			orderShippingAddress: 'somewhere else',
		});
		assert.equal(res.status, 200);
		assert.equal(res.body.member.memberPoints, 20); // 100 - 80
		assert.equal(res.body.order.orderTotalAmount, 80);
		assert.equal(res.body.order.orderShippingAddress, '1 Test Street, Seoul');
		assert.equal(res.body.member.memberPassword, undefined);
	});

	it('cannot be paid twice or refunded for free', async () => {
		const { agent } = await signup();
		await agent.post('/member/update').send({ memberAddress: '1 Test Street, Seoul' });
		const stockBefore = await stockOf('jacketXL');
		const order = (await agent.post('/order/create').send(orderBody('jacketXL', 1, 80))).body;
		const update = (orderStatus: string, orderTotalAmount = 80) =>
			agent.post('/order/update').send({ _id: order._id, orderStatus, orderTotalAmount });

		// A cancel of an order that was never paid must not hand out points.
		const early = await update('CANCELLED', 9999);
		assert.equal(early.status, 400);
		assert.equal(early.body.errorCode, 'INVALID_ORDER');

		assert.equal((await update('PROCESSING')).status, 200);
		const again = await update('PROCESSING');
		assert.equal(again.status, 400);
		assert.equal(await stockOf('jacketXL'), stockBefore - 1); // charged once

		assert.equal((await update('CANCELLED', 9999)).body.member.memberPoints, 100); // refund is the stored 80
		const twice = await update('CANCELLED');
		assert.equal(twice.status, 400);
		assert.equal(await stockOf('jacketXL'), stockBefore);

		// No way back to a paid status, and nothing outside the allowed moves.
		assert.equal((await update('PROCESSING')).status, 400);
		assert.equal((await update('PAUSED')).status, 400);
		assert.equal((await update('NOPE')).status, 400);
		assert.equal((await update('DELETED')).status, 200);
	});

	it('lets only one of two simultaneous payments through', async () => {
		const { agent } = await signup();
		await agent.post('/member/update').send({ memberAddress: '1 Test Street, Seoul' });
		const order = (await agent.post('/order/create').send(orderBody('jacketS', 1, 80))).body;
		const pay = () => agent.post('/order/update').send({ _id: order._id, orderStatus: 'PROCESSING' });
		const results = await Promise.all([pay(), pay()]);
		assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
		const me = await agent.get('/member/detail');
		assert.equal(me.body.memberPoints, 20);
	});

	it('shows only the logged-in member their own orders', async () => {
		const a = await signup();
		const b = await signup();
		await a.agent.post('/order/create').send(orderBody('jacketM', 1, 80));
		assert.equal((await b.agent.get('/order/all')).body.length, 0);
	});

	it("answers 404 UPDATE_FAILED (not 304) for an order that is not the member's", async () => {
		const owner = await signup();
		const other = await signup();
		const order = (await owner.agent.post('/order/create').send(orderBody('jacketM', 1, 80))).body;
		const res = await other.agent
			.post('/order/update')
			.send({ _id: order._id, orderStatus: 'CANCELLED', orderTotalAmount: 80 });
		assert.equal(res.status, 404);
		assert.equal(res.body.errorCode, 'UPDATE_FAILED');
	});

	it('answers 404 or 400 DELETE_FAILED (not 304) when an order cannot be deleted', async () => {
		const { agent } = await signup();
		await agent.post('/member/update').send({ memberAddress: '1 Test Street, Seoul' });
		const processing = (await agent.post('/order/create').send(orderBody('jacketS', 1, 80))).body;
		await agent.post('/order/update').send({ _id: processing._id, orderStatus: 'PROCESSING', orderTotalAmount: 80 });

		const wrongStatus = await agent.post('/order/delete').send({ _id: processing._id });
		assert.equal(wrongStatus.status, 400);
		assert.equal(wrongStatus.body.errorCode, 'DELETE_FAILED');

		const missing = await agent.post('/order/delete').send({ _id: '64b000000000000000000000' });
		assert.equal(missing.status, 404);
		assert.equal(missing.body.errorCode, 'DELETE_FAILED');

		const paused = (await agent.post('/order/create').send(orderBody('jacketS', 1, 80))).body;
		const deleted = await agent.post('/order/delete').send({ _id: paused._id });
		assert.equal(deleted.status, 200);
	});
});

describe('reviews', () => {
	it('needs a finished order, then updates the product rating and count', async () => {
		const { agent } = await signup();
		await agent.post('/member/update').send({ memberAddress: '1 Test Street, Seoul' });
		const productId = String(ids.jacket._id);

		const early = await agent.post('/review/create').send({ productId, rating: 5, comment: 'Too early' });
		assert.equal(early.status, 400);
		assert.equal(early.body.errorCode, 'CREATE_FAILED');

		const order = (await agent.post('/order/create').send(orderBody('jacketXL', 1, 80))).body;
		await agent.post('/order/update').send({ _id: order._id, orderStatus: 'PROCESSING', orderTotalAmount: 80 });
		await agent.post('/order/update').send({ _id: order._id, orderStatus: 'FINISHED', orderTotalAmount: 80 });

		const review = await agent.post('/review/create').send({ productId, rating: 4, comment: 'Fits well' });
		assert.equal(review.status, 200);
		assert.equal(review.body.rating, 4);

		const product = await Product.findById(productId).lean();
		assert.equal(product!.reviewsCount, 1);
		assert.equal(product!.reviewsRating, 4);

		const detail = await agent.get(`/product/${productId}`);
		assert.equal(detail.body.productReviews.length, 1);
		assert.equal(detail.body.isReviewValid, true);
		assert.equal(detail.body.memberReview.comment, 'Fits well');
	});

	it('answers 400 DELETE_FAILED (not 304) for a review that does not exist', async () => {
		const { agent } = await signup();
		const res = await agent.post('/review/delete').send({ reviewId: '64b000000000000000000000' });
		assert.equal(res.status, 400);
		assert.equal(res.body.errorCode, 'DELETE_FAILED');
	});
});
