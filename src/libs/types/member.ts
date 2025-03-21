import { ObjectId } from "mongoose";
import { MemberStatus, MemberType } from "../enums/member.enum";
import { Session } from "express-session";
import { Request } from "express";

export interface Member {
  _id: ObjectId;
  memberType: MemberType;
  memberStatus: MemberStatus;
  memberEmail: string;
  memberPhone: string;
  memberPassword?: string;
  memberFullName?: string;
  memberAddress?: string;
  memberDesc?: string;
  memberImage?: string;
  memberPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberInput {
  memberType?: MemberType;
  memberStatus?: MemberStatus;
  memberPhone: string;
  memberPassword: string;
  memberEmail: string;
  memberFullName?: string;
  memberAddress?: string;
  memberDesc?: string;
  memberImage?: string;
  memberPoints?: number;
}

export interface MemberUpdateInput {
  _id: ObjectId;
  memberPhone?: string;
  memberPassword?: string;
  memberEmail?: string;
  memberFullName?: string;
  memberAddress?: string;
  memberDesc?: string;
  memberImage?: string;
  memberPoints?: number;
}

export interface LoginInput {
  memberEmail: string;
  memberPassword: string;
}

export interface MemberInquiry {
  page: number;
  limit: number;
  text?: string;
}

export interface AdminRequest extends Request {
  member: Member;
  session: Session & { member: Member };
  file: Express.Multer.File;
  files: Express.Multer.File[];
}

export interface MemberRequest extends Request {
  member: Member;
}
