import { AUTH_TIMER } from "../libs/config";
import { Member } from "../libs/types/member";
import * as util from "util";
import jwt from "jsonwebtoken";
import Errors, { HttpCode, Message } from "../libs/Errors";

class AuthService {
  private secretToken: string;
  constructor() {
    this.secretToken = process.env.SECRET_TOKEN as string;
  }

  public async createToken(payload: Member) {
    return new Promise((resolve, reject) => {
      const duration = `${AUTH_TIMER}h`;

      jwt.sign(
        payload,
        this.secretToken,
        { expiresIn: AUTH_TIMER * 3600 },
        (err, token) => {
          if (err)
            reject(
              new Errors(HttpCode.UNAUTHORIZED, Message.TOKEN_CREATION_FAILED)
            );
          else resolve(token as string);
        }
      );
    });
  }

  public async verifyToken(token: string): Promise<Member> {
    const result: Member = (await jwt.verify(
      token,
      this.secretToken
    )) as Member;

    return result;
  }
}

export default AuthService;
