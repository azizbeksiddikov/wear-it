import { AdminRequest, MemberRequest } from "../libs/types/member";
import { Request, Response } from "express";
import { T } from "../libs/types/common";
import ProductService from "../models/Product.service";
import {
  Product,
  ProductInput,
  ProductInquiry,
  ProductVariantUpdate,
} from "../libs/types/product";
import Errors from "../libs/Errors";
import { HttpCode } from "../libs/Errors";
import { Message } from "../libs/Errors";
import { shapeIntoMongooseObjectId } from "../libs/config";
import { uploadFileToSupabase } from "../libs/utils/uploader";
import { Direction } from "../libs/enums/common.enum";
import { ProductCategory } from "../libs/enums/product.enum";
import { ProductGender } from "../libs/enums/product.enum";

const productController: T = {},
  productService = new ProductService();

// SPA
productController.getProducts = async (req: Request, res: Response) => {
  try {
    console.log("getProducts");

    const {
      page,
      limit,
      direction,
      productCategory,
      productGender,
      isFeatured,
      onSale,
      search,
    } = req.query;
    const inquiry: ProductInquiry = {
      page: Number(page),
      limit: Number(limit),
      direction: direction as unknown as Direction,
    };
    if (productCategory)
      inquiry.productCategory = productCategory as ProductCategory;
    if (productGender) inquiry.productGender = productGender as ProductGender;
    if (isFeatured) inquiry.isFeatured = Boolean(isFeatured);
    if (onSale) inquiry.onSale = Boolean(onSale);
    if (search) inquiry.search = search as string;

    const result = await productService.getProducts(inquiry);

    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getProducts", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

productController.getProduct = async (req: MemberRequest, res: Response) => {
  try {
    console.log("getProduct");

    const { id } = req.params,
      memberId = req.member?._id ?? null,
      result: Product = await productService.getProduct(memberId, id);

    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getProduct", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

// ADMIN
productController.getAllProducts = async (req: AdminRequest, res: Response) => {
  try {
    console.log("getAllProducts");
    const input = req.body;
    const products: Product[] = await productService.getAllProducts(input);

    res.render("products", {
      products: products,
    });
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

    // Upload all files in parallel
    const uploadedImageUrls = await Promise.all(
      req.files.map((file) => uploadFileToSupabase(file))
    );

    // Prepare product data
    const data: ProductInput = {
      ...req.body,
      productImages: uploadedImageUrls,
    };

    console.log("uploadedImageUrls", uploadedImageUrls);

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
  try {
    console.log("getChosenProduct");

    const productId = shapeIntoMongooseObjectId(req.params.id);

    const result = await productService.getChosenProduct(productId);
    res.render("product", {
      product: result,
    });
  } catch (err) {
    console.log("Error, updateChosenProduct:", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/signup");</script>`
    );
  }
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
      `<script> alert("${message}"); window.location.replace("/admin/product/all");</script>`
    );
  }
};

productController.deleteChosenProduct = async (
  req: AdminRequest,
  res: Response
) => {
  try {
    console.log("deleteChosenProduct");
    const productId = shapeIntoMongooseObjectId(req.body.productId);
    const result = await productService.deleteChosenProduct(productId);

    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, deleteChosenProduct:", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/product/all");</script>`
    );
  }
};

// Product Variants
productController.createNewProductVariant = async (
  req: AdminRequest,
  res: Response
) => {
  try {
    console.log("createNewProductVariant");

    const data = req.body;
    data.productId = shapeIntoMongooseObjectId(data.productId);
    const result = await productService.createNewProductVariant(data);
    res.status(HttpCode.OK).json({ productVariant: result });
  } catch (err) {
    console.log("Error, updateChosenProduct:", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/product/all");</script>`
    );
  }
};

productController.updateChosenProductVariant = async (
  req: AdminRequest,
  res: Response
) => {
  try {
    console.log("updateChosenProductVariant");
    const data: ProductVariantUpdate = req.body;
    data._id = shapeIntoMongooseObjectId(data._id);

    const result = await productService.updateChosenProductVariant(data);

    res.status(HttpCode.OK).json({
      productVariant: result,
    });
  } catch (err) {
    console.log("Error, updateChosenProductVariant:", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/product/all");</script>`
    );
  }
};

productController.getAllProductVariants = async (
  req: AdminRequest,
  res: Response
) => {
  try {
    console.log("getProductVariants");

    const productId = shapeIntoMongooseObjectId(req.params.productId);
    const result = await productService.getAllProductVariants(productId);

    res.status(HttpCode.OK).json({
      productVariants: result,
    });
  } catch (err) {
    console.log("Error, getProductVariants:", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/product/all");</script>`
    );
  }
};

productController.deleteChosenProductVariant = async (
  req: AdminRequest,
  res: Response
) => {
  try {
    console.log("deleteChosenProductVariant");

    const productVariantId = shapeIntoMongooseObjectId(req.body.id);
    const result = await productService.deleteChosenProductVariant(
      productVariantId
    );

    res.status(HttpCode.OK).json({
      productVariant: result,
    });
  } catch (err) {
    console.log("Error, getProductVariants:", err);
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/product/all");</script>`
    );
  }
};

export default productController;
