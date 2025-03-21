import { T } from "../libs/types/common";
import e, { NextFunction, Request, Response } from "express";
import MemberService from "../models/Member.service";
import {
  AdminRequest,
  MemberRequest,
  LoginInput,
  Member,
  MemberInput,
  MemberInquiry,
} from "../libs/types/member";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { MemberType } from "../libs/enums/member.enum";
import AuthService from "../models/Auth.service";
import { AUTH_TIMER } from "../libs/config";

const memberController: T = {},
  memberService = new MemberService(),
  authService = new AuthService();

/** Auth **/
memberController.signup = async (req: Request, res: Response) => {
  try {
    console.log("signup");

    const input = req.body,
      result: Member = await memberService.signup(input),
      token = await authService.createToken(result);

    res.cookie("accessToken", token, {
      maxAge: AUTH_TIMER * 3600 * 1000,
      httpOnly: false,
    });

    res.status(HttpCode.CREATED).json({ member: result, accessToken: token });
  } catch (err) {
    console.log("Error, signup", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

memberController.login = async (req: Request, res: Response) => {
  try {
    console.log("login");

    const input: LoginInput = req.body,
      result: Member = await memberService.login(input),
      token = await authService.createToken(result);

    res.cookie("accessToken", token, {
      maxAge: AUTH_TIMER * 3600 * 1000, // hours
      httpOnly: false,
    });

    res.status(HttpCode.OK).json({ member: result, accessToken: token });
  } catch (err) {
    console.log("Error, login", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

memberController.logout = async (req: MemberRequest, res: Response) => {
  try {
    console.log("logout");

    res.clearCookie("accessToken", { httpOnly: true });

    res.status(HttpCode.OK).json({ logout: true });
  } catch (err) {
    console.log("Error, logout", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

memberController.verifyAuth = (
  req: MemberRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("verifyAuth");

    const token = req.cookies?.accessToken;

    if (token) {
      req.member = authService.verifyToken(token) as unknown as Member;
    }

    if (!req.member)
      throw new Errors(HttpCode.UNAUTHORIZED, Message.NOT_AUTHENTICATED);

    next();
  } catch (err) {
    console.log("Error, verifyAuth", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
  }
};

memberController.retrieveAuth = async (
  req: MemberRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("retrieveAuth");
    const token: string = req.cookies?.accessToken;
    if (token) req.member = await authService.verifyToken(token);

    next();
  } catch (err) {
    console.log("Error, retrieveAuth", err);
    if (err instanceof Errors) res.status(err.code).json(err);
    else res.status(Errors.standard.code).json(Errors.standard);
    next(err);
  }
};

/** Member **/
memberController.getAdmin = () => {};
memberController.getMemberDetail = () => {};
memberController.updateMember = () => {};

export default memberController;
