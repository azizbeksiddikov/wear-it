import Errors, { HttpCode, Message } from "../libs/Errors";
import { shapeIntoMongooseObjectId } from "../libs/config";
import { T } from "../libs/types/common";
import { ObjectId } from "mongoose";
import ReviewModel from "../schema/Review.model";
import { Review, ReviewInput, ReviewUpdateInput } from "../libs/types/review";
import OrderService from "./Order.service";

class ReviewService {
  private readonly reviewModel;
  private readonly orderService;

  constructor() {
    this.reviewModel = ReviewModel;
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
    if (comment) {
      newReview.comment = comment;
    }
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

    const result = await this.reviewModel.findOneAndDelete(match);
    if (!result) throw new Errors(HttpCode.BAD_REQUEST, Message.DELETE_FAILED);

    return result as unknown as Review;
  }
}

export default ReviewService;
