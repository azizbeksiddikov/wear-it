import { ObjectId } from "mongoose";
import { ProductCategory, ProductGender } from "../enums/product.enum";
import { Direction } from "../enums/common.enum";

export interface Product {
  _id: ObjectId;
  productName: string;
  productCategory: ProductCategory;
  productGender: ProductGender;
  productDesc?: string;
  productImages: string[];
  isActive: boolean;
  isFeatured: boolean;
  onSale: boolean;
  productViews: number;
  createdAt: Date;
  updatedAt: Date;

  productVariants?: ProductVariant[];
}

export interface ProductInput {
  productName: string;
  productCategory: ProductCategory;
  productGender: ProductGender;
  productDesc?: string;
  productImages: string[];
}

export interface ProductUpdateInput {
  _id: ObjectId;
  productDesc?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  onSale?: boolean;
}

export interface ProductVariant {
  _id: ObjectId;
  productId: ObjectId;
  size: string;
  color: string;
  productPrice: number;
  stockQuantity: number;
  salePrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariantInput {
  productId: ObjectId;
  size: string;
  color: string;
  stockQuantity: number;
  productPrice: number;
  salePrice?: number;
}

export interface ProductVariantUpdate {
  _id: ObjectId;
  size?: string;
  color?: string;
  stockQuantity?: number;
  productPrice?: number;
  salePrice?: number;
}

export interface ProductInquiry {
  page: number;
  limit: number;
  direction: Direction;
  productCategory?: ProductCategory;
  productGender?: ProductGender;
  isFeatured?: boolean;
  onSale?: boolean;
  search?: string;
}

export interface TotalCounter {
  total?: number;
}

export interface Products {
  list: Products[];
  count: TotalCounter;
}
