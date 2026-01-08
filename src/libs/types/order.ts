import { Types } from "mongoose";
import { OrderStatus } from "../enums/order.enum";
import { ProductCategory, ProductGender } from "../enums/product.enum";

export interface Order {
  _id: Types.ObjectId;
  memberId: Types.ObjectId;
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
  memberId: Types.ObjectId;
  orderShippingAddress: string;
  orderSubTotal: number;
  orderShippingCost: number;
  orderTotalAmount: number;

  orderItems: OrderItemInput[];
}

export interface OrderUpdateInput {
  _id: Types.ObjectId;
  orderStatus: OrderStatus;
  orderTotalAmount: number;
  orderShippingAddress: string;
  orderSubTotal: number;
  orderShippingCost: number;
}

export interface OrderItem {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId: Types.ObjectId;
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
  orderId?: Types.ObjectId;

  productId: Types.ObjectId;
  variantId: Types.ObjectId;
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
