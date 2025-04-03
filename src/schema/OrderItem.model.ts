import mongoose, { Schema } from "mongoose";
import { ProductCategory, ProductGender } from "../libs/enums/product.enum";

const OrderItemSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },

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

    productImage: {
      type: String,
      required: true,
    },

    productSize: {
      type: String,
      required: true,
    },

    productColor: {
      type: String,
      required: true,
    },

    itemQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    salePrice: {
      type: Number,
      min: 0,
    },

    itemUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("OrderItem", OrderItemSchema, "orderItems");
