import { T } from "../libs/types/common";
import { NextFunction, Request, Response } from "express";
import MemberService from "../models/Member.service";
import ProductService from "../models/Product.service";
import OrderService from "../models/Order.service";
import {
  AdminRequest,
  LoginInput,
  Member,
  MemberInput,
} from "../libs/types/member";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { MemberType } from "../libs/enums/member.enum";
import { Dashboard } from "../libs/types/dashboard";

const adminController: T = {},
  memberService = new MemberService(),
  productService = new ProductService(),
  orderService = new OrderService();

/** Home **/
adminController.goHome = async (req: AdminRequest, res: Response) => {
  console.log("goHome");
  let dashboard: Dashboard = {
    totalMembers: 0,
    totalOrders: 0,
    totalProducts: 0,
  };

  if (req.session?.member?.memberType === MemberType.ADMIN) {
    const [totalMembers, totalProducts, totalOrders] = await Promise.all([
      memberService.getDashboard(),
      productService.getDashboard(),
      orderService.getDashboard(),
    ]);

    dashboard.totalMembers = totalMembers;
    dashboard.totalProducts = totalProducts;
    dashboard.totalOrders = totalOrders;
  }
  res.render("home", { dashboard: dashboard });
};

/** Admin Auth **/
adminController.getSignup = async (req: Request, res: Response) => {
  try {
    console.log("getSignup");
    res.render("signup");
  } catch (err) {
    console.error("Error, getSignup:", err);
    res.redirect("/admin");
  }
};

adminController.processSignup = async (req: AdminRequest, res: Response) => {
  try {
    console.log("processSignup");

    const newMember: MemberInput = req.body;
    newMember.memberType = MemberType.ADMIN;

    const result = await memberService.processSignup(newMember);

    req.session.member = result;

    req.session.save(function () {
      res.redirect("/admin");
    });
  } catch (err) {
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    console.error("Error, processSignup:", message);
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/signup")</script>`
    );
  }
};

adminController.getLogin = async (req: Request, res: Response) => {
  try {
    console.log("getLogin");
    res.render("login");
  } catch (err) {
    console.error("Error, getLogin:", err);
    res.redirect("/admin");
  }
};
adminController.processLogin = async (req: AdminRequest, res: Response) => {
  try {
    console.log("processLogin");

    const input: LoginInput = req.body;
    const member = await memberService.processLogin(input);

    req.session.member = member;

    req.session.save(function () {
      res.redirect("/admin");
    });
  } catch (err) {
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    console.error("Error, processLogin:", message);
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/login")</script>`
    );
  }
};

adminController.logout = async (req: AdminRequest, res: Response) => {
  try {
    console.log("logout");

    req.session.destroy(function () {
      res.redirect("/admin/login");
    });
  } catch (err) {
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    console.error("Error, logout:", message);
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/login")</script>`
    );
  }
};

adminController.checkAuthSession = async (req: AdminRequest, res: Response) => {
  try {
    console.log("checkAuthSession");

    if (req.session?.member)
      res.send(
        `<script> alert("Hi, your email is ${req.session.member.memberEmail}")</script>`
      );
    else res.send(`<script> alert("${Message.NOT_AUTHENTICATED}")</script>`);
  } catch (err) {
    const message =
      err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
    console.error("Error, checkAuthSession:", message);
    res.send(
      `<script> alert("${message}"); window.location.replace("/admin/login")</script>`
    );
  }
};

adminController.verifyAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("verifyAdmin");

  if (req.session?.member?.memberType === MemberType.ADMIN) {
    req.member = req.session.member;
    next();
  } else {
    const message = Message.NOT_AUTHENTICATED;
    res.send(
      `<script> alert("${message}");window.location.replace("/admin/login")</script>`
    );
  }
};

/** Member Management **/
adminController.getUsers = async (req: AdminRequest, res: Response) => {
  try {
    console.log("getUsers");

    const users = await memberService.getUsers(req.query);

    res.render("users", { users: users });
  } catch (err) {
    console.error("Error, getUsers:", err);
    res.redirect("/admin");
  }
};

adminController.getChosenUser = async (req: AdminRequest, res: Response) => {
  try {
    console.log("getChosenUser");

    const id = req.params.id;
    const result: Member = await memberService.getChosenUser(id);

    res.render("user", { member: result });
  } catch (err) {
    console.log("Error, getChosenUser:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

adminController.updateChosenUser = async (req: AdminRequest, res: Response) => {
  try {
    console.log("updateChosenUser");
    const result = await memberService.updateChosenUser(req.body);

    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, updateChosenUser:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

export default adminController;
