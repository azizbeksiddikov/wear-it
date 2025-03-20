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
  orderDate?: Date;
  orderStatus?: OrderStatus;
  orderShippingAddress: string;
  orderSubTotal: number;
  orderShippingCost: number;
  orderTotalAmount?: number;
}

export interface OrderUpdate {
  _id: ObjectId;
  orderStatus?: OrderStatus;
  orderShippingAddress?: string;
  orderSubTotal?: number;
  orderShippingCost?: number;
  orderTotalAmount?: number;
}

export interface OrderItem {
  _id: ObjectId;
  orderId: ObjectId;
  productId: ObjectId;
  variantId: ObjectId;
  itemQuantity: number;
  itemUnitPrice: number;
  size: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemInput {
  orderId: ObjectId;
  productId: ObjectId;
  variantId: ObjectId;
  itemQuantity: number;
  itemUnitPrice: number;
  size: string;
  color: string;
}
