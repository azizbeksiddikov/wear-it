import { AdminRequest } from "../libs/types/member";
import { Response } from "express";
import { T } from "../libs/types/common";

const productController: T = {};

// SPA
productController.getProducts = async () => {};
productController.getProduct = async () => {};

// SSR
productController.getAllProducts = async (req: AdminRequest, res: Response) => {
  console.log("getAllProducts");
  res.redirect("/admin");
};
productController.createNewProduct = async (
  req: AdminRequest,
  res: Response
) => {};
productController.getChosenProduct = async (
  req: AdminRequest,
  res: Response
) => {};
productController.updateChosenProduct = async (
  req: AdminRequest,
  res: Response
) => {};

export default productController;
