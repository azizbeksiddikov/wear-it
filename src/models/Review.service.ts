import Errors, { HttpCode, Message } from "../libs/Errors";
import { shapeIntoMongooseObjectId } from "../libs/config";
import {
  StatisticModifierAbsolute,
  StatisticModifierRelative,
  T,
} from "../libs/types/common";
import { ObjectId } from "mongoose";
import ReviewModel from "../schema/Review.model";
import { Review, ReviewInput, ReviewUpdateInput } from "../libs/types/review";
import OrderService from "./Order.service";
import ProductModel from "../schema/Product.model";
import { Product } from "../libs/types/product";

class ReviewService {
  private readonly reviewModel;
  private readonly productModel;

  private readonly orderService;

  constructor() {
    this.reviewModel = ReviewModel;
    this.productModel = ProductModel;
    this.orderService = new OrderService();
  }

  public async createReview(
    memberId: ObjectId,
    input: ReviewInput
  ): Promise<Review> {
    const { productId, orderId, rating, comment } = input;
    const newReview: T = {
      productId: shapeIntoMongooseObjectId(productId),
      orderId: shapeIntoMongooseObjectId(orderId),
      memberId: shapeIntoMongooseObjectId(memberId),
      rating: Number(rating),
    };
    if (comment) newReview.comment = comment;

    const isValid = await this.orderService.validateOrder(
      memberId,
      orderId,
      productId
    );
    if (!isValid) throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

    try {
      const result = await this.reviewModel.create(newReview);
      if (!result)
        throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

      // update reviewsCount and reviewsRating
      const product = await this.getProductWithoutVariants(productId);
      const newReviewsCount = product.reviewsCount + 1;
      const newReviewsRating = roundToNearestHalf(
        (product.reviewsRating * product.reviewsCount + rating) /
          newReviewsCount
      );

      // Update product statistics
      await this.productStatsIncrement({
        _id: productId,
        targetKey: "reviewsCount",
        modifier: 1,
      });
      await this.productStatsUpdate({
        _id: productId,
        targetKey: "reviewsRating",
        newValue: newReviewsRating,
      });

      return result as unknown as Review;
    } catch (err) {
      console.log("Error, createReview Schema", err);
      throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.CREATE_FAILED);
    }
  }

  public async updateReview(
    memberId: ObjectId,
    input: ReviewUpdateInput
  ): Promise<Review> {
    const { _id, rating, comment } = input;
    const match: T = {
      _id: shapeIntoMongooseObjectId(_id),
      memberId: memberId,
    };

    const oldReview = (await this.reviewModel.findOne(
      match
    )) as unknown as Review;
    if (!oldReview)
      throw new Errors(HttpCode.BAD_REQUEST, Message.NO_DATA_FOUND);
    const originalRating = oldReview.rating;

    const newReview: T = {};
    if (rating) newReview.rating = Number(rating);
    if (comment) newReview.comment = comment;
    if (newReview.rating > 5 || newReview.rating < 0)
      throw new Errors(HttpCode.BAD_REQUEST, Message.RATING_OUT_OF_RANGE);

    const result = await this.reviewModel
      .findOneAndUpdate(match, newReview, { new: true })
      .lean()
      .exec();
    if (!result) throw new Errors(HttpCode.BAD_REQUEST, Message.UPDATE_FAILED);

    if (rating && originalRating !== rating) {
      // Get product to update review statistics
      const product = await this.getProductWithoutVariants(oldReview.productId);

      // Calculate new average rating
      const totalRatingPoints = product.reviewsRating * product.reviewsCount;
      const adjustedRatingPoints =
        totalRatingPoints + (rating - originalRating);
      const newReviewsRating = roundToNearestHalf(
        adjustedRatingPoints / product.reviewsCount
      );

      await this.productStatsUpdate({
        _id: oldReview.productId,
        targetKey: "reviewsRating",
        newValue: newReviewsRating,
      });
    }
    return result as unknown as Review;
  }

  public async deleteReview(
    memberId: ObjectId,
    input: string
  ): Promise<Review> {
    const reviewId = shapeIntoMongooseObjectId(input);
    const match: T = {
      _id: reviewId,
      memberId: memberId,
    };

    const result = (await this.reviewModel.findOneAndDelete(
      match
    )) as unknown as Review;
    if (!result) throw new Errors(HttpCode.BAD_REQUEST, Message.DELETE_FAILED);

    // Get product to update review stats
    const product = await this.getProductWithoutVariants(result.productId);

    // Calculate new review statistics after deletion
    const newReviewsCount = product.reviewsCount - 1;

    // Update reviewsCount first - decrement by 1
    await this.productStatsIncrement({
      _id: result.productId,
      targetKey: "reviewsCount",
      modifier: -1,
    });

    // Calculate new rating average
    const adjustedRatingPoints =
      product.reviewsRating * product.reviewsCount - result.rating;
    const newReviewsRating = roundToNearestHalf(
      adjustedRatingPoints / newReviewsCount
    );

    // Update product's review rating
    await this.productStatsUpdate({
      _id: result.productId,
      targetKey: "reviewsRating",
      newValue: newReviewsRating,
    });

    return result as unknown as Review;
  }

  public async getReviewByProductId(productId: ObjectId): Promise<Review[]> {
    const match: T = {
      productId: shapeIntoMongooseObjectId(productId),
    };

    const result = await this.reviewModel.find(match).lean().exec();
    if (!result) throw new Errors(HttpCode.BAD_REQUEST, Message.NO_DATA_FOUND);

    return result as unknown as Review[];
  }

  public async productStatsIncrement(
    input: StatisticModifierRelative
  ): Promise<Product> {
    const { _id, targetKey, modifier } = input;

    return (await this.productModel
      .findByIdAndUpdate(
        { _id },
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
      .findByIdAndUpdate({ _id }, { [targetKey]: newValue }, { new: true })
      .exec()) as unknown as Product;
  }

  public async getProductWithoutVariants(
    productId: ObjectId
  ): Promise<Product> {
    let result = (await this.productModel
      .findOne({ _id: productId, isActive: true })
      .lean()
      .exec()) as unknown as Product;
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result as unknown as Product;
  }
}

export default ReviewService;

function roundToNearestHalf(num: number): number {
  return Math.round(num * 2) / 2;
}
