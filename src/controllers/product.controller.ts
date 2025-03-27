import { AdminRequest } from "../libs/types/member";
import { Request, Response } from "express";
import { T } from "../libs/types/common";
import ProductService from "../models/Product.service";
import { Product, ProductInput } from "../libs/types/product";
import Errors from "../libs/Errors";
import { HttpCode } from "../libs/Errors";
import { Message } from "../libs/Errors";
import { DOMAIN_NAME } from "../libs/config";

const productController: T = {},
  productService = new ProductService();

// SPA
productController.getProducts = async () => {};
productController.getProduct = async () => {}; // + reviews

// SSR
productController.getAllProducts = async (req: AdminRequest, res: Response) => {
  try {
    console.log("getAllProducts");
    const input = req.body;
    const products: Product[] = await productService.getAllProducts(input);

    res.render("products", { products: products, DOMAIN_NAME: DOMAIN_NAME });
  } catch (err) {
    console.log("Error, getAllProducts:", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin");</script>`
    );
  }
};

productController.createNewProduct = async (
  req: AdminRequest,
  res: Response
) => {
  try {
    console.log("createNewProduct");

    if (!req.files?.length) {
      throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.CREATE_FAILED);
    }
    const data: ProductInput = req.body;
    data.productImages = req.files.map((ele) => {
      return ele.path.replace(/\\/g, "");
    });

    const result = await productService.createNewProduct(data);

    res.send(
      `<script> alert("Successfully created product");
       window.location.replace("/admin/product/${result._id}");</script>`
    );
  } catch (err) {
    console.log("Error, createNewProduct:", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}");
       window.location.replace("/admin/product/all");</script>`
    );
  }
};

productController.getChosenProduct = async (
  req: AdminRequest,
  res: Response
) => {
  console.log("getChosenProduct");
  res.redirect("/admin/product/all");
};

productController.updateChosenProduct = async (
  req: AdminRequest,
  res: Response
) => {
  try {
    console.log("updateChosenProduct");

    const result = await productService.updateChosenProduct(req.body);

    res.status(HttpCode.OK).json({ product: result });
  } catch (err) {
    console.log("Error, updateChosenProduct:", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/signup");</script>`
    );
  }
};

export default productController;
