import { VerifiedMemberRequest } from "../libs/types/member";
import { T } from "../libs/types/common";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { Response } from "express";
import { ReviewInput } from "../libs/types/review";
import ReviewService from "../models/Review.service";

const reviewController: T = {},
  reviewService = new ReviewService();

reviewController.createReview = async (
  req: VerifiedMemberRequest,
  res: Response
) => {
  try {
    console.log("createReview");

    const memberId = req.member._id;

    const result = await reviewService.createReview(memberId, req.body);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, createReview", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

reviewController.updateReview = async (
  req: VerifiedMemberRequest,
  res: Response
) => {
  try {
    console.log("updateReview");

    const memberId = req.member._id;

    const result = await reviewService.updateReview(memberId, req.body);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, updateReview", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

reviewController.deleteReview = async (
  req: VerifiedMemberRequest,
  res: Response
) => {
  try {
    console.log("deleteReview");

    const memberId = req.member._id;

    const result = await reviewService.deleteReview(memberId, req.body);
    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, deleteReview", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

export default reviewController;
