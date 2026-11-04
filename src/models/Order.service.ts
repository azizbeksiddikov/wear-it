import { Types } from 'mongoose';
import { shapeIntoMongooseObjectId } from '../libs/config';
import { OrderStatus } from '../libs/enums/order.enum';
import Errors, { HttpCode, Message } from '../libs/Errors';
import { T } from '../libs/types/common';
import { Member } from '../libs/types/member';
import { Order, OrderInput, OrderInquiry, OrderItem, OrderUpdateInput } from '../libs/types/order';
import { canMoveOrder, MAX_ITEM_QUANTITY, priceOrder } from '../libs/utils/orderPricing';
import memberModel from '../schema/Member.model';
import orderModel from '../schema/Order.model';
import orderItemModel from '../schema/OrderItem.model';
import productModel from '../schema/Product.model';
import productVariantModel from '../schema/ProductVariant.model';

class OrderService {
	private readonly orderModel;
	private readonly orderItemModel;
	private readonly memberModel;
	private readonly productModel;
	private readonly variantModel;

	constructor() {
		this.orderModel = orderModel;
		this.orderItemModel = orderItemModel;
		this.memberModel = memberModel;
		this.productModel = productModel;
		this.variantModel = productVariantModel;
	}

	/**
	 * Create a PAUSED order. Prices, names and totals come from the database, never from the client:
	 * only the shipping address and, per item, the variant and quantity are read from the request.
	 */
	public async createOrder(member: Member, input: OrderInput): Promise<Order> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const address = typeof input.orderShippingAddress === 'string' ? input.orderShippingAddress.trim() : '';
		if (!address || !Array.isArray(input.orderItems) || input.orderItems.length === 0) {
			throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);
		}

		// One line per variant: a repeated variant is a repeated line, so add the quantities up.
		const wanted = new Map<string, number>();
		for (const item of input.orderItems) {
			const quantity = Number(item.itemQuantity);
			if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
				throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);
			}
			const key = shapeIntoMongooseObjectId(item.variantId).toString();
			wanted.set(key, (wanted.get(key) ?? 0) + quantity);
		}

		const variants = (await this.variantModel
			.find({ _id: { $in: [...wanted.keys()] } })
			.lean()
			.exec()) as unknown as T[];
		if (variants.length !== wanted.size) throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);

		const products = (await this.productModel
			.find({ _id: { $in: variants.map((v) => v.productId) } })
			.lean()
			.exec()) as unknown as T[];
		const productById = new Map(products.map((p) => [String(p._id), p]));

		const lines: T[] = [];
		for (const variant of variants) {
			const product = productById.get(String(variant.productId));
			const itemQuantity = wanted.get(String(variant._id)) as number;
			if (!product) throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);
			if (variant.stockQuantity < itemQuantity) throw new Errors(HttpCode.BAD_REQUEST, Message.OUT_OF_STOCK);
			lines.push({
				productId: product._id,
				variantId: variant._id,
				productName: product.productName,
				productCategory: product.productCategory,
				productGender: product.productGender,
				productImage: product.productImages?.[0] || 'default-product.png',
				productSize: variant.size,
				productColor: variant.color,
				itemQuantity,
				itemUnitPrice: variant.productPrice,
				salePrice: variant.salePrice,
			});
		}
		const { orderSubTotal, orderShippingCost, orderTotalAmount } = priceOrder(
			lines as unknown as Parameters<typeof priceOrder>[0],
		);

		const newOrderInput: T = {
			memberId,
			orderShippingAddress: address,
			orderSubTotal,
			orderShippingCost,
			orderTotalAmount,
			orderDate: new Date(),
			orderStatus: OrderStatus.PAUSED,
		};

		const session = await this.orderModel.startSession();
		let newOrder: Order | null = null;
		try {
			await session.withTransaction(async () => {
				newOrder = (await this.orderModel.create([newOrderInput], { session }))[0] as unknown as Order;
				await this.orderItemModel.create(
					lines.map((line) => ({ ...line, orderId: newOrder?._id })),
					{ session },
				);
			});
			if (!newOrder) throw new Error('Order creation failed within transaction');
			return newOrder;
		} catch (err) {
			console.log('Error, createOrder Schema', err);
			throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.CREATE_FAILED);
		} finally {
			session.endSession();
		}
	}

	public async getMyOrders(member: Member, inquiry: OrderInquiry): Promise<Order[]> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const match: T = {
			memberId: memberId,
		};

		if (inquiry?.orderStatus && inquiry.orderStatus !== OrderStatus.DELETED) {
			match.orderStatus = inquiry.orderStatus;
		} else {
			match.orderStatus = { $ne: OrderStatus.DELETED };
		}

		const result = await this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'orderItems',
						localField: '_id',
						foreignField: 'orderId',
						as: 'orderItems',
					},
				},
				{
					$lookup: {
						from: 'products',
						localField: 'orderItems.productId',
						foreignField: '_id',
						as: 'productData',
					},
				},
				{
					$lookup: {
						from: 'productVariants',
						localField: 'orderItems.variantId',
						foreignField: '_id',
						as: 'productVariants',
					},
				},
			])
			.exec();

		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

		return result;
	}

	/**
	 * Move an order to a new status. Only `_id` and `orderStatus` are read from the request: the amount
	 * paid or refunded is the total stored on the order, and the allowed moves are fixed (see `canMoveOrder`).
	 * Points, stock and status change together in one transaction.
	 */
	public async updateOrder(member: Member, input: OrderUpdateInput): Promise<Order> {
		const memberId = shapeIntoMongooseObjectId(member._id),
			orderId = shapeIntoMongooseObjectId(input._id);
		const target = input.orderStatus;
		if (!Object.values(OrderStatus).includes(target)) throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);

		const session = await this.orderModel.startSession();
		try {
			let outcome: { order: T; member: T } | null = null;
			await session.withTransaction(async () => {
				outcome = null;
				const current = (await this.orderModel
					.findOne({ _id: orderId, memberId }, null, { session })
					.lean()
					.exec()) as T | null;
				if (!current) throw new Errors(HttpCode.NOT_FOUND, Message.UPDATE_FAILED);
				if (!canMoveOrder(current.orderStatus, target)) throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);

				const total: number = current.orderTotalAmount;
				const items = (await this.orderItemModel
					.find({ orderId }, null, { session })
					.lean()
					.exec()) as unknown as OrderItem[];
				const pays = target === OrderStatus.PROCESSING;
				const refunds = target === OrderStatus.CANCELLED; // only reachable from a paid status

				if (pays) {
					const buyer = (await this.memberModel
						.findById(memberId, null, { session })
						.lean()
						.exec()) as unknown as Member | null;
					if (!buyer) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
					if (!buyer.memberAddress || buyer.memberAddress.trim() === '')
						throw new Errors(HttpCode.BAD_REQUEST, Message.NO_ADDRESS);

					// Both updates are conditional, so two requests at once cannot spend the same points or stock twice.
					const paid = await this.memberModel
						.updateOne(
							{ _id: memberId, memberPoints: { $gte: total } },
							{ $inc: { memberPoints: -total } },
							{ session },
						)
						.exec();
					if (paid.modifiedCount !== 1) throw new Errors(HttpCode.BAD_REQUEST, Message.NOT_ENOUGH_POINTS);
					for (const item of items) {
						const taken = await this.variantModel
							.updateOne(
								{ _id: item.variantId, stockQuantity: { $gte: item.itemQuantity } },
								{ $inc: { stockQuantity: -item.itemQuantity } },
								{ session },
							)
							.exec();
						if (taken.modifiedCount !== 1) throw new Errors(HttpCode.BAD_REQUEST, Message.OUT_OF_STOCK);
					}
				} else if (refunds) {
					await this.memberModel.updateOne({ _id: memberId }, { $inc: { memberPoints: total } }, { session }).exec();
					for (const item of items) {
						await this.variantModel
							.updateOne({ _id: item.variantId }, { $inc: { stockQuantity: item.itemQuantity } }, { session })
							.exec();
					}
				}

				// The status in the filter makes this a compare-and-set: a parallel request that already moved the order loses.
				const order = await this.orderModel
					.findOneAndUpdate(
						{ _id: orderId, memberId, orderStatus: current.orderStatus },
						{ orderStatus: target },
						{ new: true, session },
					)
					.lean()
					.exec();
				if (!order) throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_ORDER);

				const updatedMember = (await this.memberModel
					.findById(memberId, '-memberPassword', { session })
					.lean()
					.exec()) as T;
				outcome = { order, member: updatedMember };
			});
			if (!outcome) throw new Errors(HttpCode.NOT_FOUND, Message.UPDATE_FAILED);
			return outcome as unknown as Order;
		} finally {
			session.endSession();
		}
	}

	public async deleteOrder(memberId: Types.ObjectId, input: Types.ObjectId) {
		const orderId = shapeIntoMongooseObjectId(input);
		const match: T = {
			_id: orderId,
			memberId: memberId,
			orderStatus: { $in: [OrderStatus.PAUSED, OrderStatus.FINISHED] },
		};

		const result = await this.orderModel.findOneAndDelete(match).exec();
		if (!result) {
			// 404 when the order is not this member's (or does not exist), 400 when its status forbids deleting.
			const exists = await this.orderModel.exists({ _id: orderId, memberId }).exec();
			throw new Errors(exists ? HttpCode.BAD_REQUEST : HttpCode.NOT_FOUND, Message.DELETE_FAILED);
		}
		return result;
	}

	//  Dashboard
	public async getDashboard(): Promise<number> {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		return await this.orderModel
			.countDocuments({
				orderStatus: { $ne: OrderStatus.PAUSED },
				updatedAt: { $gte: thirtyDaysAgo },
			})
			.exec();
	}

	// For other Services
	public async validateOrder(memberId: Types.ObjectId, productId: Types.ObjectId): Promise<boolean> {
		const count = await this.orderItemModel.countDocuments({
			productId,
			orderId: {
				$in: await this.orderModel
					.find({
						memberId,
						orderStatus: { $in: [OrderStatus.FINISHED, OrderStatus.CANCELLED] },
					})
					.distinct('_id'),
			},
		});

		return count > 0;
	}
}

export default OrderService;
