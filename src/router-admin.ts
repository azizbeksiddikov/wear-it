import express from "express";
import adminController from "./controllers/admin.controller";
import productController from "./controllers/product.controller";
import { memoryUploader } from "./libs/utils/uploader";

const routerAdmin = express.Router();

/** Home **/
routerAdmin.get("/", adminController.goHome);

/** Admin Auth **/
routerAdmin
  .get("/signup", adminController.getSignup)
  .post("/signup", adminController.processSignup);

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
  "/users/:id",
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
  memoryUploader.array("productImages", 9),
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

routerAdmin.post(
  "/product/delete",
  adminController.verifyAdmin,
  productController.deleteChosenProduct
);

/** Product Variant Management **/
routerAdmin.post(
  "/product-variant/create",
  adminController.verifyAdmin,
  productController.createNewProductVariant
);

routerAdmin.post(
  "/product-variant/edit",
  adminController.verifyAdmin,
  productController.updateChosenProductVariant
);

routerAdmin.get(
  "/product-variants/:productId",
  adminController.verifyAdmin,
  productController.getAllProductVariants
);

routerAdmin.post(
  "/product-variant/delete",
  adminController.verifyAdmin,
  productController.deleteChosenProductVariant
);

export default routerAdmin;
