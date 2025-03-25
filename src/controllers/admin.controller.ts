import { T } from "../libs/types/common";
import e, { NextFunction, Request, Response } from "express";
import MemberService from "../models/Member.service";
import {
  AdminRequest,
  LoginInput,
  MemberInput,
  MemberInquiry,
} from "../libs/types/member";
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
    // const file = req.file;
    // if (!file)
    //   throw new Errors(HttpCode.BAD_REQUEST, Message.FILE_UPLOAD_FAILED);

    const newMember: MemberInput = req.body;
    // newMember.memberImage = file?.path.replace(/\\/g, "");
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
      res.redirect("/admin/product/all");
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

    req.session.destroy(function (err) {
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

    const { page = 1, limit = 10, text } = req.query;
    const input: MemberInquiry = {
      page: Number(page),
      limit: Number(limit),
      text: text ? String(text) : undefined,
    };

    const users = await memberService.getUsers(input);

    res.render("users", { users });
  } catch (err) {
    console.error("Error, getUsers:", err);
    res.redirect("/admin");
  }
};

adminController.getChosenUser = async (req: AdminRequest, res: Response) => {
  try {
    console.log("getChosenUser");

    const id = req.params.id;
    const result = await memberService.getChosenUser(id);

    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, getChosenUser:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

adminController.updateChosenUser = async (req: AdminRequest, res: Response) => {
  try {
    console.log("updateChosenUser");

    const id = req.params.id;
    const result = await memberService.updateChosenUser(id, req.body);

    res.status(HttpCode.OK).json({ data: result });
  } catch (err) {
    console.log("Error, updateChosenUser:", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

export default adminController;
