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

/**
 * User-facing sentences (English). Keep them short, friendly and free of
 * double quotes: the admin pages put them inside `alert("...")`.
 * The enum KEY is the stable `errorCode` sent to clients; never rename a key
 * without changing the client, rewording the value is safe.
 */
export enum Message {
  SOMETHING_WENT_WRONG = "Something went wrong. Please try again.",
  NO_DATA_FOUND = "We couldn't find what you were looking for.",
  CREATE_FAILED = "We couldn't create that. Please try again.",
  UPDATE_FAILED = "We couldn't save your changes. Please try again.",
  DELETE_FAILED = "We couldn't delete that. Please try again.",

  NO_MEMBER_EMAIL = "We couldn't find an account with that email.",
  USED_EMAIL_PHONE = "That email or phone number is already in use.",
  BLOCKED_USER = "Your account has been blocked. Please contact Wearit support.",
  WRONG_PASSWORD = "Wrong password. Please try again.",
  NOT_AUTHENTICATED = "Please log in to continue.",
  TOKEN_CREATION_FAILED = "We couldn't log you in. Please try again.",
  FILE_UPLOAD_FAILED = "We couldn't upload the file. Please try again.",
  RATING_OUT_OF_RANGE = "Rating must be between 0 and 5.",
  EXISTING_USER = "An account with these details already exists.",
  NOT_ENOUGH_POINTS = "You don't have enough points for this order.",
  NO_ADDRESS = "Please add your delivery address first.",
}

/** Stable machine-readable code: the `Message` enum key, e.g. "WRONG_PASSWORD". */
export type ErrorCode = keyof typeof Message;

export const ERROR_CODES = Object.keys(Message) as ErrorCode[];

/** Look up the code for a message (the keys and values are one-to-one). */
export const errorCodeOf = (message: Message): ErrorCode => {
  const found = ERROR_CODES.find((key) => Message[key] === message);
  return found ?? "SOMETHING_WENT_WRONG";
};

class Errors extends Error {
  public code: HttpCode;
  public message: Message;
  public errorCode: ErrorCode;

  static standard = {
    code: HttpCode.INTERNAL_SERVER_ERROR,
    message: Message.SOMETHING_WENT_WRONG,
    errorCode: "SOMETHING_WENT_WRONG" as ErrorCode,
  };

  constructor(statusCode: HttpCode, statusMessage: Message) {
    super();
    this.code = statusCode;
    this.message = statusMessage;
    this.errorCode = errorCodeOf(statusMessage);
  }
}

export default Errors;
