import ProductModel from "../schema/Product.model";
import ViewService from "./View.service";
import {
  ProductInput,
  Product,
  ProductUpdateInput,
  ProductInquiry,
  ProductVariantInput,
  ProductVariant,
  ProductVariantUpdate,
} from "../libs/types/product";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { shapeIntoMongooseObjectId } from "../libs/config";
import { T } from "../libs/types/common";
import { ProductStatus } from "../libs/enums/product.enum";
import { ObjectId } from "mongoose";
import ProductVariantModel from "../schema/ProductVariant.model";

class ProductService {
  private readonly productModel;
  private readonly productVariantModel;

  constructor() {
    this.productModel = ProductModel;
    this.productVariantModel = ProductVariantModel;
  }
  // USER

  // ADMIN
  public async getAllProducts(input: ProductInquiry): Promise<Product[]> {
    const match: T = {};
    if (input.productCategory) match.productCategory = input.productCategory;
    if (input.productGender) match.productGender = input.productGender;
    if (input.isActive) match.isActive = input.isActive;

    const result = await this.productModel.find(match).exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result as unknown as Product[];
  }

  public async createNewProduct(input: ProductInput): Promise<Product> {
    try {
      const result = await this.productModel.create(input);

      return result as unknown as Product;
    } catch (err) {
      console.log("ERROR, model:createNewProduct:", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
    }
  }

  public async updateChosenProduct(
    input: ProductUpdateInput
  ): Promise<Product> {
    const productId = shapeIntoMongooseObjectId(input._id);
    const result = await this.productModel
      .findByIdAndUpdate(productId, input, { new: true })
      .exec();

    if (!result) {
      throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
    }

    return result as unknown as Product;
  }

  public async getChosenProduct(productId: ObjectId): Promise<Product> {
    const product = (await this.productModel
      .findById(productId)
      .lean()
      .exec()) as unknown as Product;
    if (!product) {
      throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
    }

    product.productVariants = await this.getAllProductVariants(productId);

    return product as unknown as Product;
  }

  public async deleteChosenProduct(productId: ObjectId): Promise<Product> {
    const result = await this.productModel
      .findById(productId, { new: true })
      .exec();

    if (!result) {
      throw new Errors(HttpCode.NOT_MODIFIED, Message.DELETE_FAILED);
    }

    return result as unknown as Product;
  }

  // ProductVariants
  public async createNewProductVariant(
    input: ProductVariantInput
  ): Promise<ProductVariant> {
    // Verify that the referenced product exists
    const productExists = await this.productModel.findById({
      _id: input.productId,
    });
    if (!productExists) {
      throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
    }
    try {
      const result = await this.productVariantModel.create(input);

      return result as unknown as ProductVariant;
    } catch (err) {
      console.log("ERROR, model:createNewProductVariant:", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
    }
  }

  public async updateChosenProductVariant(
    input: ProductVariantUpdate
  ): Promise<ProductVariant> {
    const variantId = shapeIntoMongooseObjectId(input._id);

    const result = await this.productVariantModel
      .findByIdAndUpdate(variantId, input, { new: true })
      .exec();

    if (!result) {
      throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
    }

    return result as unknown as ProductVariant;
  }

  public async getAllProductVariants(
    productId: ObjectId
  ): Promise<ProductVariant[]> {
    const result = await this.productVariantModel
      .find({ productId: productId })
      .exec();

    return (result || []) as unknown as ProductVariant[];
  }

  public async deleteChosenProductVariant(
    variantId: ObjectId
  ): Promise<ProductVariant> {
    const result = await this.productVariantModel
      .findByIdAndDelete(variantId)
      .exec();

    if (!result) {
      throw new Errors(HttpCode.NOT_MODIFIED, Message.DELETE_FAILED);
    }

    return result as unknown as ProductVariant;
  }
}

export default ProductService;
