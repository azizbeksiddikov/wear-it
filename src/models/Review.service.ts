import Errors, { HttpCode, Message } from "../libs/Errors";
import { shapeIntoMongooseObjectId } from "../libs/config";
import { Types } from "mongoose";
import { T } from "../libs/types/common";
import ReviewModel from "../schema/Review.model";
import { Review, ReviewInput, ReviewUpdateInput } from "../libs/types/review";
import OrderService from "./Order.service";
import ProductService from "./Product.service";
import { Product } from "../libs/types/product";

class ReviewService {
  private readonly reviewModel;
  private readonly productService;
  private readonly orderService;

  constructor() {
    this.reviewModel = ReviewModel;
    this.productService = new ProductService();
    this.orderService = new OrderService();
  }

  public async createReview(
    memberId: Types.ObjectId,
    input: ReviewInput
  ): Promise<Review> {
    const { productId, rating, comment } = input;
    const newReview: T = {
      memberId: shapeIntoMongooseObjectId(memberId),
      productId: shapeIntoMongooseObjectId(productId),
      rating: Number(rating),
    };
    if (comment) newReview.comment = comment;

    const product: Product = await this.productService.getPureProduct(
      productId
    );
    if (!product) throw new Errors(HttpCode.BAD_REQUEST, Message.NO_DATA_FOUND);

    const isValid = await this.orderService.validateOrder(memberId, productId);
    if (!isValid) throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

    try {
      const result = await this.reviewModel.create(newReview);
      if (!result)
        throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

      // update Product.reviewsCount and Product.reviewsRating
      const prevReviewsCount = Number(product?.reviewsCount ?? 0);
      const prevReviewsRating = Number(product?.reviewsRating ?? 0);
      const newReviewsCount = prevReviewsCount + 1;
      const totalRatingPoints = prevReviewsCount * prevReviewsRating;
      const newReviewsRating =
        (totalRatingPoints + Number(rating)) / newReviewsCount;

      // Update product statistics
      await this.productService.productStatsIncrement({
        _id: productId,
        targetKey: "reviewsCount",
        modifier: 1,
      });

      await this.productService.productStatsUpdate({
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
    memberId: Types.ObjectId,
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
    const originalRating = Number(oldReview.rating);

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
      const product = await this.productService.getPureProduct(
        oldReview.productId
      );

      // update Product.reviewsCount and Product.reviewsRating
      const reviewsCount = Number(product?.reviewsCount ?? 0);
      const prevReviewsRating = Number(product?.reviewsRating ?? 0);

      const totalRatingPoints = reviewsCount * prevReviewsRating;
      const newReviewsRating =
        (totalRatingPoints + Number(rating - originalRating)) / reviewsCount;

      await this.productService.productStatsUpdate({
        _id: oldReview.productId,
        targetKey: "reviewsRating",
        newValue: newReviewsRating,
      });
    }
    return result as unknown as Review;
  }

  public async deleteReview(
    memberId: Types.ObjectId,
    reviewId: string
  ): Promise<Review> {
    const match: T = {
      _id: shapeIntoMongooseObjectId(reviewId),
      memberId: shapeIntoMongooseObjectId(memberId),
    };

    const result = (await this.reviewModel.findOneAndDelete(
      match
    )) as unknown as Review;
    if (!result) throw new Errors(HttpCode.BAD_REQUEST, Message.DELETE_FAILED);

    // update Product.reviewsCount and Product.reviewsRating
    const product = await this.productService.getPureProduct(result.productId);

    const prevReviewsCount = product?.reviewsCount
      ? Number(product.reviewsCount)
      : 0;
    const prevReviewsRating = product?.reviewsRating
      ? Number(product.reviewsRating)
      : 0;

    const newReviewsCount = prevReviewsCount - 1;

    let newReviewsRating = 0;
    if (newReviewsCount !== 0) {
      const totalRatingPoints = prevReviewsCount * prevReviewsRating;

      newReviewsRating =
        (totalRatingPoints - Number(result.rating)) / newReviewsCount;
    }

    await this.productService.productStatsIncrement({
      _id: result.productId,
      targetKey: "reviewsCount",
      modifier: -1,
    });

    await this.productService.productStatsUpdate({
      _id: result.productId,
      targetKey: "reviewsRating",
      newValue: newReviewsRating,
    });

    return result as unknown as Review;
  }
}

export default ReviewService;
