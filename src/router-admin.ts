import express from "express";
import router from "./router";
import adminController from "./controllers/admin.controller";
import productController from "./controllers/product.controller";
import makeUploader from "./libs/utils/uploader";

const routerAdmin = express.Router();

/** Home **/
routerAdmin.get("/", adminController.goHome);

/** Admin Auth **/
routerAdmin.get("/signup", adminController.getSignup).post(
  "/signup",

  adminController.processSignup
);
//     makeUploader("members").single("memberImage"),

routerAdmin
  .get("/login", adminController.getLogin)
  .post("/login", adminController.processLogin);
routerAdmin.get("/logout", adminController.logout);
routerAdmin.get("/check-me", adminController.checkAuthSession);

/** Member Management **/
routerAdmin.get(
  "/users",
  adminController.verifyAdmin,
  adminController.getUsers
);

routerAdmin.get(
  "/user/:id",
  adminController.verifyAdmin,
  adminController.getChosenUser
); // + orders

routerAdmin.post(
  "/user/edit",
  adminController.verifyAdmin,
  adminController.updateChosenUser
);

/** Product Management **/
routerAdmin.get(
  "/product/all",
  adminController.verifyAdmin,
  productController.getAllProducts
);

routerAdmin.post(
  "/product/create",
  adminController.verifyAdmin,
  makeUploader("products").array("productImages", 10),
  productController.createNewProduct
);

routerAdmin.get(
  "/product/:id",
  adminController.verifyAdmin,
  productController.getChosenProduct
);

routerAdmin.post(
  "/product/edit",
  adminController.verifyAdmin,
  productController.updateChosenProduct
);

export default routerAdmin;
