import { ObjectId } from "mongoose";
import { OrderStatus } from "../enums/order.enum";

export interface Order {
  _id: ObjectId;
  memberId: ObjectId;
  orderDate: Date;
  orderStatus: OrderStatus;
  orderShippingAddress: string;
  orderSubTotal: number;
  orderShippingCost: number;
  orderTotalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderInput {
  memberId: ObjectId;
  orderDate: Date;
  orderStatus: OrderStatus;
  orderShippingAddress: string;
  orderSubTotal: number;
  orderShippingCost: number;
  orderTotalAmount: number;
}

export interface OrderUpdate {
  _id: ObjectId;
  orderStatus?: OrderStatus;
  orderShippingAddress?: string;
  orderSubTotal?: number;
  orderShippingCost?: number;
  orderTotalAmount?: number;
}
