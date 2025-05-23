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
import OrderService from "./Order.service";

class ProductService {
  private readonly productModel;
  private readonly productVariantModel;
  private readonly viewService;
  private readonly orderService;

  constructor() {
    this.productModel = ProductModel;
    this.productVariantModel = ProductVariantModel;
    this.viewService = new ViewService();
    this.orderService = new OrderService();
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
              {
                $lookup: {
                  from: "productVariants",
                  localField: "_id",
                  foreignField: "productId",
                  as: "productVariants",
                },
              },
            ],
            count: [{ $count: "total" }],
          },
        },
      ])
      .exec();
    if (!result.length)
      throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    // GetProducts: add cheapest productVariant in fetching process'
    const products = result[0].list as unknown as Product[];
    products.forEach((product: Product) => {
      if (!product?.productVariants?.length) return;

      if (product.onSale) {
        const variantsWithSalePrice = product.productVariants.filter(
          (variant) =>
            variant.salePrice !== undefined && variant.salePrice !== null
        );

        // If we have variants with sale price, find the cheapest one
        if (variantsWithSalePrice.length > 0) {
          product.cheapestProductVariant = variantsWithSalePrice.reduce(
            (prev, curr) => (prev.salePrice! < curr.salePrice! ? prev : curr),
            variantsWithSalePrice[0]
          );
        }
        // If no variants have sale price (shouldn't happen for onSale products, but as fallback)
        else {
          product.cheapestProductVariant = product.productVariants.reduce(
            (prev, curr) =>
              prev.productPrice < curr.productPrice ? prev : curr,
            product.productVariants[0]
          );
        }
      } else {
        // For regular products, find the cheapest by normal price
        product.cheapestProductVariant = product.productVariants.reduce(
          (prev, curr) => (prev.productPrice < curr.productPrice ? prev : curr),
          product.productVariants[0]
        );
      }
    });

    return result[0] as unknown as Products;
  }

  public async getProduct(
    memberId: ObjectId | null,
    id: string
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
            let: { productId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$productId", "$$productId"] } } },
              {
                $lookup: {
                  from: "members",
                  localField: "memberId",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        memberEmail: 1,
                        memberFullName: 1,
                        memberImage: 1,
                      },
                    },
                  ],
                  as: "memberData",
                },
              },
              {
                $addFields: {
                  memberData: { $arrayElemAt: ["$memberData", 0] },
                },
              },
            ],
            as: "productReviews",
          },
        },
        { $limit: 1 },
      ])
      .exec();

    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    const product = result[0] as unknown as Product;

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
      }

      if (product.productReviews) {
        product.memberReview = product.productReviews.find(
          (review) => review.memberId.toString() === memberId.toString()
        );
      }
      product.isReviewValid = await this.orderService.validateOrder(
        memberId,
        productId
      );
    }

    return product;
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
  public async getDashboard(): Promise<number> {
    return await this.productModel
      .countDocuments({
        isActive: true,
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
