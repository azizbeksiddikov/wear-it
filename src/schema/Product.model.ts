import mongoose, { Schema } from "mongoose";
import { ProductCategory, ProductGender } from "../libs/enums/product.enum";

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
    },

    productCategory: {
      type: String,
      enum: ProductCategory,
      required: true,
    },

    productGender: {
      type: String,
      enum: ProductGender,
      required: true,
    },

    productDesc: {
      type: String,
    },

    productImages: {
      type: [String],
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    onSale: {
      type: Boolean,
      default: false,
    },

    productViews: {
      type: Number,
      default: 0,
    },

    reviewsCount: {
      type: Number,
      default: 0,
    },

    reviewsRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },

  { timestamps: true }
);

productSchema.index(
  { productName: 1, productCategory: 1, productGender: 1 },
  { unique: true }
);

export default mongoose.model("Product", productSchema, "products");
