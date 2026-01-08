import { Types } from "mongoose";

export interface Review {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  memberId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewInput {
  productId: Types.ObjectId;
  rating: number;
  comment?: string;
}

export interface ReviewUpdateInput {
  _id: Types.ObjectId;
  rating?: number;
  comment?: string;
}
