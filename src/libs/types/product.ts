import { ObjectId } from "mongoose";

export interface ProductVariant {
  _id: ObjectId;
  productId: ObjectId;
  size: string;
  color: string;
  stockQuantity: number;
  productPrice: number;
  salesPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariantInput {
  productId: ObjectId;
  size: string;
  color: string;
  stockQuantity: number;
  productPrice: number;
  salesPrice?: number;
}

export interface ProductVariantUpdate {
  _id: ObjectId;
  size?: string;
  color?: string;
  stockQuantity?: number;
  productPrice?: number;
  salesPrice?: number;
}

export interface Product {
  _id: ObjectId;
  productName: string;
  productDesc?: string;
  onSale?: boolean;
  categoryId: ObjectId;
  isFeatured?: boolean;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
