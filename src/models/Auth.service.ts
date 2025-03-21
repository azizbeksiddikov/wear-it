import { Member } from "../libs/types/member";

class AuthService {
  private secretToken: string;
  constructor() {
    this.secretToken = process.env.SECRET_TOKEN as string;
  }

  public async createToken() {}

  public async verifyToken() {}
}

export default AuthService;
