import * as bcryptjs from 'bcryptjs';
import { POINTS_BALANCE_CAP, shapeIntoMongooseObjectId } from '../libs/config';
import { MemberStatus, MemberType } from '../libs/enums/member.enum';
import Errors, { HttpCode, Message } from '../libs/Errors';
import { T } from '../libs/types/common';
import { LoginInput, Member, MemberInput, MemberInquiry, MemberUpdateInput } from '../libs/types/member';
import { pickMemberUpdate } from '../libs/utils/memberInput';
import { validateTopUpAmount } from '../libs/utils/points';
import MemberModel from '../schema/Member.model';

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

			result.memberPassword = '';
			return result.toJSON() as unknown as Member;
		} catch (err) {
			console.log('Error, model:signup', err);
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
				{ memberNick: 1, memberPassword: 1, memberStatus: 1 },
			)
			.exec();
		if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_EMAIL);
		else if (member.memberStatus === MemberStatus.BLOCK) throw new Errors(HttpCode.FORBIDDEN, Message.BLOCKED_USER);

		const isMatch = await bcryptjs.compare(input.memberPassword, member.memberPassword);

		if (!isMatch) throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);

		const result = await this.memberModel.findById(member._id).lean().exec();
		return result as unknown as Member;
	}

	public async getMemberDetail(member: Member): Promise<Member> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const result = await this.memberModel.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

		// TODO: get Member Orders info

		return result as unknown as Member;
	}

	public async updateMember(member: Member, input: MemberUpdateInput): Promise<Member> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		// Only the profile fields: points, type and status can never be set from here.
		const update = pickMemberUpdate(input);
		if (update.memberPassword)
			update.memberPassword = await bcryptjs.hash(update.memberPassword, await bcryptjs.genSalt());
		let result;
		try {
			result = await this.memberModel.findOneAndUpdate({ _id: memberId }, update, { new: true }).exec();
		} catch (err) {
			// For example an email or phone number that another member already uses.
			console.log('Error, model:updateMember', err);
			throw new Errors(HttpCode.BAD_REQUEST, Message.UPDATE_FAILED);
		}
		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.UPDATE_FAILED);
		return result as unknown as Member;
	}

	/** Demo top-up: adds free points. One atomic update, so two requests cannot push the balance over the cap. */
	public async topUp(member: Member, amount: unknown): Promise<Member> {
		const points = validateTopUpAmount(amount);
		const memberId = shapeIntoMongooseObjectId(member._id);

		const result = await this.memberModel
			.findOneAndUpdate(
				{ _id: memberId, memberStatus: MemberStatus.ACTIVE, memberPoints: { $lte: POINTS_BALANCE_CAP - points } },
				{ $inc: { memberPoints: points } },
				{ new: true },
			)
			.exec();
		if (result) return result as unknown as Member;

		// Nothing matched: either the member is gone or blocked, or the balance would pass the cap.
		const exists = await this.memberModel.exists({ _id: memberId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!exists) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		throw new Errors(HttpCode.BAD_REQUEST, Message.TOPUP_LIMIT_REACHED);
	}

	/** ADMIN **/
	public async processSignup(input: MemberInput): Promise<Member> {
		const isExist = await this.memberModel.findOne({ memberType: MemberType.ADMIN }).exec();
		if (isExist) throw new Errors(HttpCode.BAD_REQUEST, Message.EXISTING_USER);

		input.memberType = MemberType.ADMIN;
		const salt = await bcryptjs.genSalt();
		input.memberPassword = await bcryptjs.hash(input.memberPassword, salt);

		try {
			const result = await this.memberModel.create(input);
			result.memberPassword = '';

			return result as unknown as Member;
		} catch (err) {
			console.log('Error, model:processSignup', err);
			throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
		}
	}

	public async processLogin(input: LoginInput): Promise<Member> {
		const { memberEmail, memberPassword } = input;

		const member = await this.memberModel
			.findOne({ memberEmail: memberEmail }, { memberEmail: 1, memberPassword: 1 })
			.exec();
		if (!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_EMAIL);

		const isMatch = await bcryptjs.compare(memberPassword, member.memberPassword);
		if (!isMatch) throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);

		const result = await this.memberModel.findById(member._id).lean().exec();
		return result as unknown as Member;
	}

	public async getUsers(input: MemberInquiry): Promise<Member[]> {
		const { text } = input;

		const match: T = { memberType: MemberType.USER };
		if (text) match.memberEmail = { $regex: text, $options: 'i' };

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

		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.UPDATE_FAILED);

		return result as unknown as Member;
	}

	public async getChosenUser(inputId: string): Promise<Member> {
		inputId = shapeIntoMongooseObjectId(inputId);
		const result = await this.memberModel.findById({ _id: inputId }).exec();

		// TODO: get Member Orders info

		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

		return result as unknown as Member;
	}

	//  Dashboard
	public async getDashboard(): Promise<number> {
		return await this.memberModel
			.countDocuments({
				memberStatus: MemberStatus.ACTIVE,
			})
			.exec();
	}
}

export default MemberService;
