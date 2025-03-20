import mongoose, { Schema } from "mongoose";
import {
  productCategory,
  productGender,
  productStatus,
} from "../libs/enums/product.enum";

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
      minlength: 2,
    },

    productDescription: {
      type: String,
    },

    gender: {
      type: String,
      required: true,
      enum: productGender,
    },

    categoryId: {
      type: String,
      enum: productCategory,
      required: true,
    },

    productType: {
      type: String,
      enum: productStatus,
      default: productStatus.ACTIVE,
    },

    productImages: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema, "products");
