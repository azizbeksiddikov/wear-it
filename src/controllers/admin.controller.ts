import { T } from "../libs/types/common";
import e, { NextFunction, Request, Response } from "express";
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
    const file = req.file;
    if (!file)
      throw new Errors(HttpCode.BAD_REQUEST, Message.FILE_UPLOAD_FAILED);

    const newMember: MemberInput = req.body;
    newMember.memberImage = file?.path.replace(/\\/g, "");
    newMember.memberType = MemberType.ADMIN;
    const result = await memberService.processSignup(newMember);

    req.session.member = result;

    req.session.save(function () {
      res.redirect("/admin/product/all");
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
