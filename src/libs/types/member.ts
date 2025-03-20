import { ObjectId } from "mongoose";
import { MemberStatus, MemberType } from "../enums/member.enum";

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

export interface MemberUpdate {
  _id: ObjectId;
  memberPhone?: string;
  memberPassword?: string;
  memberEmail?: string;
  memberFullName?: string;
  memberAddress?: string;
  memberDesc?: string;
  memberImage?: string;
}

export interface MemberAdminUpdate {
  _id: ObjectId;
  memberStatus?: MemberStatus;
  memberPhone?: string;
  memberPassword?: string;
  memberEmail?: string;
  memberFullName?: string;
  memberAddress?: string;
  memberDesc?: string;
  memberImage?: string;
  memberPoints?: number;
}
