import mongoose, { Schema } from "mongoose";
import { OrderStatus } from "../libs/enums/order.enum";

const orderSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },

    orderDate: {
      type: Date,
      required: true,
    },

    orderStatus: {
      type: String,
      enum: OrderStatus,
      default: OrderStatus.PAUSED,
    },

    orderShippingAddress: {
      type: String,
      required: true,
    },

    orderSubTotal: {
      type: Number,
      required: true,
    },

    orderShippingCost: {
      type: Number,
      required: true,
    },

    orderTotalAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema, "orders");
