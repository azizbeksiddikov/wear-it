import orderModel from "../schema/Order.model";
import orderItemModel from "../schema/OrderItem.model";
import MemberService from "../models/Member.service";
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

class OrderService {
  private readonly orderModel;
  private readonly orderItemModel;
  private readonly memberService;

  constructor() {
    this.orderModel = orderModel;
    this.orderItemModel = orderItemModel;
    this.memberService = new MemberService();
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
      orderStatus: OrderStatus.PROCESSING,
    };

    const newOrder = (await this.orderModel.create(
      newOrderInput
    )) as unknown as Order;

    await this.recordOrderItem(newOrder._id, input);

    return newOrder;
  }

  private async recordOrderItem(
    orderId: ObjectId,
    input: OrderInput
  ): Promise<void> {
    const promisedList = input.orderItems.map(async (item: OrderItemInput) => {
      item.orderId = orderId;
      item.productId = shapeIntoMongooseObjectId(item.productId);
      item.variantId = shapeIntoMongooseObjectId(item.variantId);

      await this.orderItemModel.create(item);
      return "INSERTED";
    });

    await Promise.all(promisedList);
  }

  public async getMyOrders(
    member: Member,
    inquiry: OrderInquiry
  ): Promise<Order[]> {
    const memberId = shapeIntoMongooseObjectId(member._id),
      matches = { memberId: memberId, orderStatus: inquiry.orderStatus },
      result = await this.orderModel
        .aggregate([
          { $match: matches },
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
      orderId = shapeIntoMongooseObjectId(input._id),
      orderStatus = input.orderStatus,
      result = await this.orderModel
        .findOneAndUpdate(
          { _id: orderId, memberId: memberId }, // isn't {_id: orderId} enough?
          { orderStatus: orderStatus },
          { new: true }
        )
        .exec();

    if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);

    // !safe because several orders will cause increase in the memberPoints
    // a need for check of previous status of the order
    if (orderStatus === OrderStatus.PROCESSING) {
      // await this.memberService.addUserPoint(member, 1);
    }
    return result as unknown as Order;
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
}

export default OrderService;
