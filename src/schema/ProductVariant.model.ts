import mongoose, { Schema } from "mongoose";

const productVariantSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    size: {
      type: String,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },

    stockQuantity: {
      type: Number,
      required: true,
    },

    productPrice: {
      type: Number,
      required: true,
    },

    salePrice: {
      type: Number,
    },
  },
  { timestamps: true }
);

productVariantSchema.index(
  { productId: 1, size: 1, color: 1 },
  { unique: true }
);

export default mongoose.model(
  "ProductVariant",
  productVariantSchema,
  "productVariants"
);
