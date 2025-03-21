import { T } from "../libs/types/common";
import { NextFunction, Request, Response } from "express";
import MemberService from "../models/Member.service";
import { AdminRequest, MemberInput } from "../libs/types/member";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { MemberType } from "../libs/enums/member.enum";

const adminController: T = {},
  memberService = new MemberService();

/** Home **/
adminController.goHome = async (req: AdminRequest, res: Response) => {
  console.log("goHome");
  res.render("home");
};

/** Admin Auth **/
adminController.getSignup = async (req: Request, res: Response) => {
  console.log("getSignup");
  res.redirect("/admin");
};
adminController.processSignup = async (req: AdminRequest, res: Response) => {};

adminController.getLogin = async (req: Request, res: Response) => {};
adminController.processLogin = async (req: AdminRequest, res: Response) => {};

adminController.logout = async (req: AdminRequest, res: Response) => {
  console.log("logout");
  res.redirect("/admin");
};

adminController.checkAuthSession = async (req: AdminRequest, res: Response) => {
  console.log("checkAuthSession");
  res.redirect("/admin");
};

adminController.verifyAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("verifyAdmin");
  next();
};

/** Member Management **/
adminController.getUsers = async (req: AdminRequest, res: Response) => {
  console.log("getUsers");
  res.redirect("/admin");
};
adminController.getChosenUser = async (req: AdminRequest, res: Response) => {
  console.log("getChosenUser");
  res.redirect("/admin");
};
adminController.updateChosenUser = async (req: AdminRequest, res: Response) => {
  console.log("updateChosenUser");
  res.redirect("/admin");
};

export default adminController;
