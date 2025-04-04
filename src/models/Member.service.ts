import { shapeIntoMongooseObjectId } from "../libs/config";
import { MemberStatus, MemberType } from "../libs/enums/member.enum";
import Errors, { HttpCode, Message } from "../libs/Errors";
import {
  LoginInput,
  Member,
  MemberInput,
  MemberInquiry,
  MemberUpdateInput,
} from "../libs/types/member";
import MemberModel from "../schema/Member.model";
import * as bcryptjs from "bcryptjs";
import { T } from "../libs/types/common";

class MemberService {
  private readonly memberModel;

  constructor() {
    this.memberModel = MemberModel;
  }

  /** USER **/
  public async signup(input: MemberInput): Promise<Member> {
    const salt = await bcryptjs.genSalt();
    input.memberPassword = await bcryptjs.hash(input.memberPassword, salt);
    input.memberType = MemberType.USER;
    input.memberPoints = 100;

    try {
      const result = await this.memberModel.create(input);

      result.memberPassword = "";
      return result.toJSON() as unknown as Member;
    } catch (err) {
      console.log("Error, model:signup", err);
      throw new Errors(HttpCode.BAD_REQUEST, Message.USED_EMAIL_PHONE);
    }
  }

  public async login(input: LoginInput): Promise<Member> {
    const member = await this.memberModel
      .findOne(
        {
          memberEmail: input.memberEmail,
          memberStatus: { $ne: MemberStatus.DELETE },
        },
        { memberNick: 1, memberPassword: 1, memberStatus: 1 }
      )
      .exec();
    if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_EMAIL);
    else if (member.memberStatus === MemberStatus.BLOCK)
      throw new Errors(HttpCode.FORBIDDEN, Message.BLOCKED_USER);

    const isMatch = await bcryptjs.compare(
      input.memberPassword,
      member.memberPassword
    );

    if (!isMatch)
      throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);

    const result = await this.memberModel.findById(member._id).lean().exec();
    return result as unknown as Member;
  }

  public async getMemberDetail(member: Member): Promise<Member> {
    const memberId = shapeIntoMongooseObjectId(member._id);
    const result = await this.memberModel
      .findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE })
      .exec();
    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    // TODO: get Member Orders info

    return result as unknown as Member;
  }

  public async updateMember(
    member: Member,
    input: MemberUpdateInput
  ): Promise<Member> {
    const memberId = shapeIntoMongooseObjectId(member._id);
    try {
      const result = await this.memberModel
        .findOneAndUpdate({ _id: memberId }, input, { new: true })
        .exec();
      if (!result)
        throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
      return result as unknown as Member;
    } catch (err) {
      console.log("Error, model:updateMember");
      throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
    }
  }

  /** ADMIN **/
  public async processSignup(input: MemberInput): Promise<Member> {
    const isExist = await this.memberModel
      .findOne({ memberType: MemberType.ADMIN })
      .exec();
    if (isExist) throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

    const salt = await bcryptjs.genSalt();
    input.memberPassword = await bcryptjs.hash(input.memberPassword, salt);

    try {
      const result = await this.memberModel.create(input);
      result.memberPassword = "";

      return result as unknown as Member;
    } catch (err) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
    }
  }

  public async processLogin(input: LoginInput): Promise<Member> {
    const { memberEmail, memberPassword } = input;

    const member = await this.memberModel
      .findOne(
        { memberEmail: memberEmail },
        { memberEmail: 1, memberPassword: 1 }
      )
      .exec();
    if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_EMAIL);

    const isMatch = await bcryptjs.compare(
      memberPassword,
      member.memberPassword
    );
    if (!isMatch)
      throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);

    const result = await this.memberModel.findById(member._id).exec();
    return result as unknown as Member;
  }

  public async getUsers(input: MemberInquiry): Promise<Member[]> {
    const { text } = input;

    const match: T = { memberType: MemberType.USER };
    if (text) match.memberEmail = { $regex: text, $options: "i" };

    const result = await this.memberModel.find(match).exec();

    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result as unknown as Member[];
  }

  public async updateChosenUser(input: MemberUpdateInput): Promise<Member> {
    input._id = shapeIntoMongooseObjectId(input._id);

    const result = await this.memberModel
      .findByIdAndUpdate(input._id, input, {
        new: true,
        lean: true,
      })
      .exec();

    if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);

    return result as unknown as Member;
  }

  public async getChosenUser(inputId: string): Promise<Member> {
    inputId = shapeIntoMongooseObjectId(inputId);
    const result = await this.memberModel.findById({ _id: inputId }).exec();

    // TODO: get Member Orders info

    if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);

    return result as unknown as Member;
  }

  //  Dashboard
  public async getDashboard(thirtyDaysAgo: Date): Promise<number> {
    return await this.memberModel
      .countDocuments({
        memberStatus: MemberStatus.ACTIVE,
      })
      .exec();
  }
}

export default MemberService;
