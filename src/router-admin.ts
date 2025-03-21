import express from "express";
import router from "./router";
import adminController from "./controllers/admin.controller";
import productController from "./controllers/product.controller";
import makeUploader from "./libs/utils/uploader";

const routerAdmin = express.Router();

/** Home **/
routerAdmin.get("/", adminController.verifyAdmin, adminController.goHome);

/** Admin Auth **/
routerAdmin
  .get("/signup", adminController.getSignup)
  .post(
    "/signup",
    makeUploader("members").single("memberImage"),
    adminController.processSignup
  );

routerAdmin
  .get("/login", adminController.getLogin)
  .post("/login", adminController.processLogin);
routerAdmin.get("/logout", adminController.logout);
routerAdmin.get("/check-me", adminController.checkAuthSession);

/** Member Management **/
routerAdmin.get(
  "/user/all",
  adminController.verifyAdmin,
  adminController.getUsers
);

routerAdmin.get(
  "/user/:id",
  adminController.verifyAdmin,
  adminController.getChosenUser
); // + orders

routerAdmin.post(
  "/user/:id",
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
  productController.createNewProduct
); //   makeUploader("products").array("productImages", 5)

routerAdmin.get(
  "/product/:id",
  adminController.verifyAdmin,
  productController.getChosenProduct // + reviews
);

routerAdmin.post(
  "/product/:id",
  adminController.verifyAdmin,
  productController.updateChosenProduct
);

export default routerAdmin;
