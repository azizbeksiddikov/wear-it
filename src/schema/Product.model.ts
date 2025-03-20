import mongoose, { Schema } from "mongoose";
import { productType } from "../libs/enums/product.enum";

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

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    productType: {
      type: String,
      enum: productType,
      default: productType.ACTIVE,
    },

    productImages: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema, "products");
