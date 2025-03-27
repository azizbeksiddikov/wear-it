import ProductModel from "../schema/Product.model";
import ViewService from "./View.service";
import {
  ProductInput,
  Product,
  ProductUpdateInput,
  ProductInquiry,
} from "../libs/types/product";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { shapeIntoMongooseObjectId } from "../libs/config";
import { T } from "../libs/types/common";
import { ProductStatus } from "../libs/enums/product.enum";
import { ObjectId } from "mongoose";

class ProductService {
  private readonly productModel;

  constructor() {
    this.productModel = ProductModel;
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
}

export default ProductService;
