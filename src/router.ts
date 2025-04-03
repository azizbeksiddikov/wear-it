import express from "express";
import memberController from "./controllers/member.controller";
import productController from "./controllers/product.controller";
import orderController from "./controllers/order.controller";
import reviewController from "./controllers/review.controller";
import { memoryUploader } from "./libs/utils/uploader";
const router = express.Router();

/** Member **/
router.post("/member/signup", memberController.signup);
router.post("/member/login", memberController.login);
router.post(
  "/member/logout",
  memberController.verifyAuth,
  memberController.logout
);
router.get(
  "/member/detail",
  memberController.verifyAuth,
  memberController.getMemberDetail
);
router.post(
  "/member/update",
  memberController.verifyAuth,
  memoryUploader.single("memberImage"),
  memberController.updateMember
);

/** Product **/
router.get("/product/all", productController.getProducts);
router.get(
  "/product/:id",
  memberController.retrieveAuth,
  productController.getProduct
);

/** Orders **/
router.post(
  "/order/create",
  memberController.verifyAuth,
  orderController.createOrder
);
router.get(
  "/order/all",
  memberController.verifyAuth,
  orderController.getMyOrders
);

router.post(
  "/order/update",
  memberController.verifyAuth,
  orderController.updateOrder
);

router.post(
  "/order/delete",
  memberController.verifyAuth,
  orderController.deleteOrder
);

/** Review **/
router.post(
  "/review/create",
  memberController.verifyAuth,
  reviewController.createReview
);
router.post(
  "/review/update",
  memberController.verifyAuth,
  reviewController.updateReview
);
router.post(
  "/review/delete",
  memberController.verifyAuth,
  reviewController.deleteReview
);

export default router;
