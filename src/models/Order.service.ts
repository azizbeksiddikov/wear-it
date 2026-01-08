import orderModel from "../schema/Order.model";
import orderItemModel from "../schema/OrderItem.model";
import memberModel from "../schema/Member.model";
import { Member } from "../libs/types/member";
import {
  Order,
  OrderInput,
  OrderInquiry,
  OrderItem,
  OrderItemInput,
  OrderUpdateInput,
} from "../libs/types/order";
import { shapeIntoMongooseObjectId } from "../libs/config";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { OrderStatus } from "../libs/enums/order.enum";
import { Types } from "mongoose";
import { T } from "../libs/types/common";
import { ClientSession } from "mongoose";

class OrderService {
  private readonly orderModel;
  private readonly orderItemModel;
  private readonly memberModel;

  constructor() {
    this.orderModel = orderModel;
    this.orderItemModel = orderItemModel;
    this.memberModel = memberModel;
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
    orderId: Types.ObjectId,
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
    let _member = (await this.memberModel
      .findById(memberId)
      .exec()) as unknown as Member;
    if (!_member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    const match: T = { _id: orderId, memberId: memberId };

    if (input.orderStatus === OrderStatus.PROCESSING) {
      if (!_member.memberAddress || _member.memberAddress.trim() === "") {
        throw new Errors(HttpCode.BAD_REQUEST, Message.NO_ADDRESS);
      }
      if (
        !_member.memberPoints ||
        _member.memberPoints < input.orderTotalAmount
      ) {
        throw new Errors(HttpCode.BAD_REQUEST, Message.NOT_ENOUGH_POINTS);
      }
    }

    const result = await this.orderModel
      .findOneAndUpdate(match, input, { new: true })
      .lean()
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);

    // Change the Order Quantity and User Points
    if (input.orderStatus === OrderStatus.PROCESSING) {
      const db = this.orderModel.db.db;

      const orderItems = (await this.orderItemModel
        .find({ orderId: orderId })
        .lean()
        .exec()) as unknown as OrderItem[];

      // For each item, update the corresponding product variant
      if (db) {
        for (const item of orderItems) {
          await db
            .collection("productVariants")
            .updateOne(
              { _id: item.variantId },
              { $inc: { stockQuantity: -(item.itemQuantity || 1) } }
            );
        }
      }

      _member = (await this.memberModel
        .findByIdAndUpdate(
          memberId,
          { memberPoints: _member.memberPoints - input.orderTotalAmount },
          { new: true }
        )
        .lean()
        .exec()) as unknown as Member;
    } else if (input.orderStatus === OrderStatus.CANCELLED) {
      // Update the Order Quantity
      const db = this.orderModel.db.db;
      const orderItems = (await this.orderItemModel
        .find({ orderId: orderId })
        .lean()
        .exec()) as unknown as OrderItem[];

      // For each item, update the corresponding product variant
      if (db) {
        for (const item of orderItems) {
          await db
            .collection("productVariants")
            .updateOne(
              { _id: item.variantId },
              { $inc: { stockQuantity: item.itemQuantity || 1 } }
            );
        }
      }
      // Update Member Points

      _member = (await this.memberModel
        .findByIdAndUpdate(
          memberId,
          { memberPoints: _member.memberPoints + input.orderTotalAmount },
          { new: true }
        )
        .lean()
        .exec()) as unknown as Member;
    }

    // change from result to { order: result, member: _member }
    return { order: result, member: _member } as unknown as Order;
  }

  public async deleteOrder(memberId: Types.ObjectId, input: Types.ObjectId) {
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
  public async validateOrder(
    memberId: Types.ObjectId,
    productId: Types.ObjectId
  ): Promise<boolean> {
    const count = await this.orderItemModel.countDocuments({
      productId,
      orderId: {
        $in: await this.orderModel
          .find({
            memberId,
            orderStatus: { $in: [OrderStatus.FINISHED, OrderStatus.CANCELLED] },
          })
          .distinct("_id"),
      },
    });

    return count > 0;
  }
}

export default OrderService;
