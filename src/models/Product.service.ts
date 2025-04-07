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
  Products,
} from "../libs/types/product";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { shapeIntoMongooseObjectId } from "../libs/config";
import {
  StatisticModifierAbsolute,
  StatisticModifierRelative,
  T,
} from "../libs/types/common";
import { ObjectId } from "mongoose";
import ProductVariantModel from "../schema/ProductVariant.model";
import { deleteFilesFromSupabase } from "../libs/utils/uploader";
import { Direction } from "../libs/enums/common.enum";
import { ViewInput } from "../libs/types/view";
import { ViewGroup } from "../libs/enums/view.enum";

class ProductService {
  private readonly productModel;
  private readonly productVariantModel;
  private readonly viewService;

  constructor() {
    this.productModel = ProductModel;
    this.productVariantModel = ProductVariantModel;
    this.viewService = new ViewService();
  }
  // USER
  public async getProducts(inquiry: ProductInquiry): Promise<Products> {
    const match: T = { isActive: true };
    if (inquiry.productCategory)
      match.productCategory = inquiry.productCategory;
    if (inquiry.productGender) match.productGender = inquiry.productGender;
    if (inquiry.isFeatured) match.isFeatured = inquiry.isFeatured;
    if (inquiry.onSale) match.onSale = inquiry.onSale;
    if (inquiry.search)
      match.productName = { $regex: new RegExp(inquiry.search, "i") };

    const sort: T = {
      createdAt: inquiry.direction
        ? Direction[inquiry.direction]
        : Direction.ASC,
    };

    const result = await this.productModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: [
              { $skip: (inquiry.page * 1 - 1) * inquiry.limit },
              { $limit: inquiry.limit * 1 },
            ],
            count: [{ $count: "total" }],
          },
        },
      ])
      .exec();
    if (!result.length)
      throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result[0] as unknown as Products;
  }

  public async getProduct(
    memberId: ObjectId | null,
    id: String
  ): Promise<Product> {
    const productId = shapeIntoMongooseObjectId(id);

    const match: T = { _id: productId, isActive: true };

    let result = await this.productModel
      .aggregate([
        { $match: match },
        {
          $lookup: {
            from: "productVariants",
            localField: "_id",
            foreignField: "productId",
            as: "productVariants",
          },
        },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "productId",
            as: "productReviews",
          },
        },
        { $limit: 1 },
      ])
      .exec();

    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    // View logic
    if (memberId) {
      const input: ViewInput = {
        memberId: memberId,
        viewGroup: ViewGroup.PRODUCT,
        viewRefId: productId,
      };
      const existView = await this.viewService.checkViewExistence(input);
      if (!existView) {
        await this.viewService.insertMemberView(input);

        await this.productModel
          .findByIdAndUpdate(
            productId,
            { $inc: { productViews: +1 } },
            { new: true }
          )
          .exec();
        result[0].productViews += 1;
      }
    }

    return result[0] as unknown as Product;
  }
  // ADMIN
  public async getAllProducts(input: ProductInquiry): Promise<Product[]> {
    const match: T = {};
    if (input.productCategory) match.productCategory = input.productCategory;
    if (input.productGender) match.productGender = input.productGender;

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
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
    }

    const variantIds = await this.getAllProductVariants(productId);

    // Delete product images from Supabase
    await deleteFilesFromSupabase(product.productImages);

    const result = await this.productModel
      .findByIdAndDelete(productId, { new: true })
      .exec();

    if (!result) {
      throw new Errors(HttpCode.NOT_MODIFIED, Message.DELETE_FAILED);
    }

    await Promise.all(
      variantIds.map((variant) => this.deleteChosenProductVariant(variant._id))
    );

    return result as unknown as Product;
  }

  // ProductVariants
  public async createNewProductVariant(
    input: ProductVariantInput
  ): Promise<ProductVariant> {
    const productExists = await this.productModel.findById({
      _id: input.productId,
    });
    if (!productExists) {
      throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
    }
    input.color = input.color.toUpperCase();
    input.size = input.size.toUpperCase();

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
    if (input.color) input.color = input.color.toUpperCase();
    if (input.size) input.size = input.size.toUpperCase();

    const result = await this.productVariantModel
      .findByIdAndUpdate(input._id, input, { new: true })
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
      .lean()
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

  //  Dashboard
  public async getDashboard(thirtyDaysAgo: Date): Promise<number> {
    return await this.productModel
      .countDocuments({
        isActive: true,
        updatedAt: { $gte: thirtyDaysAgo },
      })
      .exec();
  }

  // Other Services
  public async getPureProduct(productId: ObjectId): Promise<Product> {
    let result = (await this.productModel
      .findOne({ _id: productId, isActive: true })
      .lean()
      .exec()) as unknown as Product;
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result as unknown as Product;
  }

  public async productStatsIncrement(
    input: StatisticModifierRelative
  ): Promise<Product> {
    const { _id, targetKey, modifier } = input;

    return (await this.productModel
      .findByIdAndUpdate(
        _id,
        { $inc: { [targetKey]: modifier } },
        { new: true }
      )
      .exec()) as unknown as Product;
  }

  public async productStatsUpdate(
    input: StatisticModifierAbsolute
  ): Promise<Product> {
    const { _id, targetKey, newValue } = input;

    return (await this.productModel
      .findByIdAndUpdate(_id, { [targetKey]: newValue }, { new: true })
      .exec()) as unknown as Product;
  }
}

export default ProductService;
