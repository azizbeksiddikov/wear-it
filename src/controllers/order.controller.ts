import { T } from "../libs/types/common";
import { Request, Response } from "express";
import { MemberRequest, VerifiedMemberRequest } from "../libs/types/member";
import Errors, { HttpCode, Message } from "../libs/Errors";
import OrderService from "../models/Order.service";
import { Order, OrderInquiry, OrderUpdateInput } from "../libs/types/order";
import { OrderStatus } from "../libs/enums/order.enum";

const orderController: T = {},
  orderService = new OrderService();

orderController.createOrder = async (
  req: VerifiedMemberRequest,
  res: Response
) => {
  try {
    console.log("createOrder");

    const input = req.body;
    const result: Order = await orderService.createOrder(req.member, input);

    res.status(HttpCode.CREATED).json(result);
  } catch (err) {
    console.log("Error, createOrder", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

orderController.getMyOrders = async (
  req: VerifiedMemberRequest,
  res: Response
) => {
  try {
    console.log("getMyOrders");

    const { page, limit, orderStatus } = req.query,
      inquiry: OrderInquiry = {
        page: Number(page),
        limit: Number(limit),
        orderStatus: orderStatus as OrderStatus,
      },
      result = await orderService.getMyOrders(req.member, inquiry);

    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, getMyOrders", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

orderController.updateOrder = async (
  req: VerifiedMemberRequest,
  res: Response
) => {
  try {
    console.log("updateOrder");

    const input: OrderUpdateInput = req.body,
      result = await orderService.updateOrder(req.member, input);

    res.status(HttpCode.OK).json(result);
  } catch (err) {
    console.log("Error, updateOrder", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

orderController.deleteOrder = () => {};

export default orderController;
