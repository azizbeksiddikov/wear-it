import orderModel from "../schema/Order.model";
import orderItemModel from "../schema/OrderItem.model";
import { Member } from "../libs/types/member";
import {
  Order,
  OrderInput,
  OrderInquiry,
  OrderItemInput,
  OrderUpdateInput,
} from "../libs/types/order";
import { shapeIntoMongooseObjectId } from "../libs/config";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { OrderStatus } from "../libs/enums/order.enum";
import { ObjectId } from "mongoose";
import { T } from "../libs/types/common";
import { ClientSession } from "mongoose";

class OrderService {
  private readonly orderModel;
  private readonly orderItemModel;

  constructor() {
    this.orderModel = orderModel;
    this.orderItemModel = orderItemModel;
  }

  public async createOrder(member: Member, input: OrderInput): Promise<Order> {
    const memberId = shapeIntoMongooseObjectId(member._id);

    const newOrderInput: T = {
      memberId: memberId,
      orderShippingAddress: input.orderShippingAddress,
      orderSubTotal: input.orderSubTotal,
      orderShippingCost: input.orderShippingCost,
      orderTotalAmount: input.orderTotalAmount,
      orderDate: new Date(),
      orderStatus: OrderStatus.PAUSED,
    };

    // Start a session for the transaction
    const session = await this.orderModel.startSession();
    let newOrder: Order | null = null; // Initialize with null

    try {
      // Start transaction
      await session.withTransaction(async () => {
        // Create order within the transaction
        newOrder = (
          await this.orderModel.create(
            [newOrderInput], // Note the array syntax for transactions
            { session }
          )
        )[0] as unknown as Order;

        // Create all order items within the same transaction
        await this.recordOrderItem(newOrder._id, input, session);
      });

      if (!newOrder) {
        throw new Error("Order creation failed within transaction");
      }

      return newOrder;
    } catch (err) {
      console.log("Error, createOrder Schema", err);
      throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.CREATE_FAILED);
    } finally {
      // Always end the session
      session.endSession();
    }
  }

  private async recordOrderItem(
    orderId: ObjectId,
    input: OrderInput,
    session: ClientSession // Add session parameter
  ): Promise<void> {
    const promisedList = input.orderItems.map(async (item: OrderItemInput) => {
      item.orderId = orderId;
      item.productId = shapeIntoMongooseObjectId(item.productId);
      item.variantId = shapeIntoMongooseObjectId(item.variantId);

      // Pass the session to each create operation
      await this.orderItemModel.create([item], { session });
      return "INSERTED";
    });

    await Promise.all(promisedList);
  }

  public async getMyOrders(
    member: Member,
    inquiry: OrderInquiry
  ): Promise<Order[]> {
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
        { $skip: (inquiry.page - 1) * inquiry.limit },
        { $limit: inquiry.limit },
        {
          $lookup: {
            from: "orderItems",
            localField: "_id",
            foreignField: "orderId",
            as: "orderItems",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "orderItems.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
        {
          $lookup: {
            from: "productVariants",
            localField: "orderItems.variantId",
            foreignField: "_id",
            as: "productVariants",
          },
        },
      ])
      .exec();

    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result;
  }

  public async updateOrder(
    member: Member,
    input: OrderUpdateInput
  ): Promise<Order> {
    const memberId = shapeIntoMongooseObjectId(member._id),
      orderId = shapeIntoMongooseObjectId(input._id);

    const match: T = { _id: orderId, memberId: memberId };

    const result = await this.orderModel
      .findOneAndUpdate(match, input, { new: true })
      .lean()
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);

    return result as unknown as Order;
  }

  public async deleteOrder(memberId: ObjectId, input: ObjectId) {
    const orderId = shapeIntoMongooseObjectId(input);
    const match: T = {
      _id: orderId,
      memberId: memberId,
      orderStatus: { $in: [OrderStatus.PAUSED, OrderStatus.FINISHED] },
    };

    const result = await this.orderModel.findOneAndDelete(match).exec();
    if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.DELETE_FAILED);
    return result;
  }

  //  Dashboard
  public async getDashboard(thirtyDaysAgo: Date): Promise<number> {
    return await this.orderModel
      .countDocuments({
        orderStatus: OrderStatus.PROCESSING,
        updatedAt: { $gte: thirtyDaysAgo },
      })
      .exec();
  }

  // For other Services
  public async validateOrder(
    memberId: ObjectId,
    productId: ObjectId
  ): Promise<boolean> {
    const match: T = {
      memberId: memberId,
      orderStatus: { $in: [OrderStatus.FINISHED, OrderStatus.CANCELLED] },
    };

    const memberOrders = await this.orderModel.find(match).exec();
    if (!memberOrders.length) return false;

    for (const order of memberOrders) {
      const productExist = await this.orderItemModel.findOne({
        orderId: order._id,
        productId: productId,
      });
      if (productExist) return true;
    }

    return false;

    // const result = await this.orderItemModel
    //   .aggregate([
    //     {
    //       $lookup: {
    //         from: "orders",
    //         localField: "orderId",
    //         foreignField: "_id",
    //         as: "order",
    //       },
    //     },
    //     { $unwind: "$order" },
    //     {
    //       $match: {
    //         productId: productId,
    //         "order.memberId": memberId,
    //         "order.orderStatus": {
    //           $in: [OrderStatus.FINISHED, OrderStatus.CANCELLED],
    //         },
    //       },
    //     },
    //     { $limit: 1 },
    //   ])
    //   .exec();

    // return result.length > 0;
  }
}

export default OrderService;
