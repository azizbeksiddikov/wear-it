import { ObjectId } from "mongoose";
import { OrderStatus } from "../enums/order.enum";
import { ProductCategory, ProductGender } from "../enums/product.enum";

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
  orderShippingAddress: string;
  orderSubTotal: number;
  orderShippingCost: number;
  orderTotalAmount: number;

  orderItems: OrderItemInput[];
}

export interface OrderUpdateInput {
  _id: ObjectId;
  orderStatus?: OrderStatus;
  // orderShippingAddress?: string;
  // orderSubTotal?: number;
  // orderShippingCost?: number;
  // orderTotalAmount?: number;
}

export interface OrderItem {
  _id: ObjectId;
  orderId: ObjectId;
  productId: ObjectId;
  variantId: ObjectId;
  productName: string;
  productCategory: ProductCategory;
  productGender: ProductGender;
  productImage: string;
  productSize: string;
  productColor: string;
  itemUnitPrice: number;
  salePrice?: number;
  itemQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemInput {
  orderId?: ObjectId;

  productId: ObjectId;
  variantId: ObjectId;
  productName: string;
  productCategory: ProductCategory;
  productGender: ProductGender;
  productImage: string;
  productSize: string;
  productColor: string;
  itemUnitPrice: number;
  salePrice: number | null;
  itemQuantity: number;
}

export interface OrderInquiry {
  page: number;
  limit?: number;
  orderStatus?: OrderStatus;
}
