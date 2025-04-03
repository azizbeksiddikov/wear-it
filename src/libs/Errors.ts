export enum HttpCode {
  OK = 200,
  CREATED = 201,
  NOT_MODIFIED = 304,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export enum Message {
  SOMETHING_WENT_WRONG = "Something went wrong!",
  NO_DATA_FOUND = "No data is found!",
  CREATE_FAILED = "Create is failed!",
  UPDATE_FAILED = "Update is failed!",
  DELETE_FAILED = "Delete is failed!",

  NO_MEMBER_EMAIL = "No member with that email",
  USED_EMAIL_PHONE = "Already used phone or email",
  BLOCKED_USER = "You have been blocked, contact restaurant",
  WRONG_PASSWORD = "Wrong password entered, please try again",
  NOT_AUTHENTICATED = "You are not authenticated. Please, login first!",
  TOKEN_CREATION_FAILED = "Token creation error!",
  FILE_UPLOAD_FAILED = "File upload failed!",
  RATING_OUT_OF_RANGE = "Rating is out of range!",
}

class Errors extends Error {
  public code: HttpCode;
  public message: Message;

  static standard = {
    code: HttpCode.INTERNAL_SERVER_ERROR,
    message: Message.SOMETHING_WENT_WRONG,
  };

  constructor(statusCode: HttpCode, statusMessage: Message) {
    super();
    this.code = statusCode;
    this.message = statusMessage;
  }
}

export default Errors;
