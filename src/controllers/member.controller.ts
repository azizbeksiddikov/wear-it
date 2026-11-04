import { NextFunction, Request, Response } from 'express';
import { AUTH_TIMER, authCookieOptions } from '../libs/config';
import Errors, { HttpCode, Message } from '../libs/Errors';
import { T } from '../libs/types/common';
import { LoginInput, Member, MemberRequest, MemberUpdateInput, VerifiedMemberRequest } from '../libs/types/member';
import { uploadFileToSupabase } from '../libs/utils/uploader';
import AuthService from '../models/Auth.service';
import MemberService from '../models/Member.service';

const memberController: T = {},
	memberService = new MemberService(),
	authService = new AuthService();

/** Auth **/
memberController.signup = async (req: Request, res: Response) => {
	try {
		console.log('signup');

		const input = req.body,
			result: Member = await memberService.signup(input),
			token = await authService.createToken(result);

		res.cookie('accessToken', token, { ...authCookieOptions(), maxAge: AUTH_TIMER * 3600 * 1000 });

		// The token travels only in the httpOnly cookie, never in the body.
		res.status(HttpCode.CREATED).json({ member: result });
	} catch (err) {
		console.log('Error, signup', err);
		if (err instanceof Errors) res.status(err.code).json(err);
		else res.status(Errors.standard.code).json(Errors.standard);
	}
};

memberController.login = async (req: Request, res: Response) => {
	try {
		console.log('login');

		const input: LoginInput = req.body,
			result: Member = await memberService.login(input),
			token = await authService.createToken(result);

		res.cookie('accessToken', token, { ...authCookieOptions(), maxAge: AUTH_TIMER * 3600 * 1000 });

		res.status(HttpCode.OK).json({ member: result });
	} catch (err) {
		console.log('Error, login', err);
		if (err instanceof Errors) res.status(err.code).json(err);
		else res.status(Errors.standard.code).json(Errors.standard);
	}
};

memberController.logout = async (req: VerifiedMemberRequest, res: Response) => {
	try {
		console.log('logout');

		res.clearCookie('accessToken', authCookieOptions());

		res.status(HttpCode.OK).json({ logout: true });
	} catch (err) {
		console.log('Error, logout', err);
		if (err instanceof Errors) res.status(err.code).json(err);
		else res.status(Errors.standard.code).json(Errors.standard);
	}
};

memberController.verifyAuth = async (req: MemberRequest, res: Response, next: NextFunction) => {
	try {
		console.log('verifyAuth');

		const token = req.cookies?.accessToken;

		if (token) {
			req.member = (await authService.verifyToken(token)) as unknown as Member;
		}

		if (!req.member) throw new Errors(HttpCode.UNAUTHORIZED, Message.NOT_AUTHENTICATED);

		next();
	} catch (err) {
		console.log('Error, verifyAuth', err);
		if (err instanceof Errors) res.status(err.code).json(err);
		else res.status(Errors.standard.code).json(Errors.standard);
	}
};

memberController.retrieveAuth = async (req: MemberRequest, res: Response, next: NextFunction) => {
	try {
		console.log('retrieveAuth');
		const token: string = req.cookies?.accessToken;
		if (token) {
			try {
				req.member = await authService.verifyToken(token);
			} catch {
				// If token is invalid, just set member to null (optional auth)
				req.member = null;
			}
		} else {
			req.member = null;
		}

		next();
	} catch (err) {
		console.log('Error, retrieveAuth', err);
		req.member = null;
		next();
	}
};

/** Member **/
memberController.getMemberDetail = async (req: VerifiedMemberRequest, res: Response) => {
	try {
		console.log('getMemberDetail');
		const result = await memberService.getMemberDetail(req.member);

		res.status(HttpCode.OK).json(result);
	} catch (err) {
		console.log('Error, getMemberDetail', err);
		if (err instanceof Errors) res.status(err.code).json(err);
		else res.status(Errors.standard.code).json(Errors.standard);
	}
};

memberController.updateMember = async (req: VerifiedMemberRequest, res: Response) => {
	try {
		console.log('update');
		const input: MemberUpdateInput = req.body;

		if (req.file) {
			const uploadedImage = await uploadFileToSupabase(req.file, 'members');
			input.memberImage = uploadedImage;
			console.log('Uploaded image URL:', uploadedImage);
		}

		const result = await memberService.updateMember(req.member, input);

		res.status(HttpCode.OK).json(result);
	} catch (err) {
		console.log('Error, updateMember', err);
		if (err instanceof Errors) res.status(err.code).json(err);
		else res.status(Errors.standard.code).json(Errors.standard);
	}
};

memberController.topUp = async (req: VerifiedMemberRequest, res: Response) => {
	try {
		console.log('topUp');
		const result = await memberService.topUp(req.member, req.body?.amount);

		res.status(HttpCode.OK).json(result);
	} catch (err) {
		console.log('Error, topUp', err);
		if (err instanceof Errors) res.status(err.code).json(err);
		else res.status(Errors.standard.code).json(Errors.standard);
	}
};

export default memberController;
