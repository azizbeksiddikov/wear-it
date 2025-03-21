import express from "express";
import memberController from "./controllers/member.controller";
import productController from "./controllers/product.controller";
import orderController from "./controllers/order.controller";
import reviewController from "./controllers/review.controller";
const router = express.Router();

/** Member **/
router.get("/member/admin", memberController.getAdmin);
router.post("/member/signup", memberController.signup);
router.post("/member/login", memberController.login);
router.post("/logout", memberController.verifyAuth, memberController.logout);
router.get("member/detail", memberController.getMemberDetail);
router.post(
  "/member/update",
  memberController.verifyAuth,
  memberController.updateMember
); //   uploader("members").single("memberImage"),

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
  "/order/update/",
  memberController.verifyAuth,
  orderController.updateOrder
);

/** Review **/
router.post("/review/create", reviewController.createReview);
router.post("/review/update", reviewController.updateReview);

export default router;
