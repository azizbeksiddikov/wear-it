import { ObjectId } from "mongoose";

export interface ProductVariant {
  _id: ObjectId;
  productId: ObjectId;
  size: string;
  color: string;
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariantInput {
  productId: ObjectId;
  size: string;
  color: string;
  stockQuantity: number;
}

export interface ProductVariantUpdate {
  _id: ObjectId;
  size?: string;
  color?: string;
  stockQuantity?: number;
}
