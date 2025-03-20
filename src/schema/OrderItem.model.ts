import mongoose, { Schema } from "mongoose";

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

    itemQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    itemUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    size: {
      type: String,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("OrderItem", OrderItemSchema, "orderItems");
