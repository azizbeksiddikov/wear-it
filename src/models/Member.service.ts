import { MemberType } from "../libs/enums/member.enum";
import Errors, { HttpCode, Message } from "../libs/Errors";
import {
  LoginInput,
  Member,
  MemberInput,
  MemberInquiry,
} from "../libs/types/member";
import MemberModel from "../schema/Member.model";
import * as bcryptjs from "bcryptjs";

class MemberService {
  private readonly memberModel;

  constructor() {
    this.memberModel = MemberModel;
  }

  /** USER **/

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
    const { page, limit, text } = input;
    const skip = (page - 1) * limit;

    const filter: any = { memberType: MemberType.USER };
    if (text) filter.memberEmail = { $regex: text, $options: "i" };

    console.log(filter);

    const result = await this.memberModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .exec();

    if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

    return result as unknown as Member[];
  }
}

export default MemberService;
