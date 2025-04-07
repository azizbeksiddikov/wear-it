import { ObjectId } from "mongoose";

export interface Review {
  _id: ObjectId;
  productId: ObjectId;
  memberId: ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewInput {
  productId: ObjectId;
  rating: number;
  comment?: string;
}

export interface ReviewUpdateInput {
  _id: ObjectId;
  rating?: number;
  comment?: string;
}
