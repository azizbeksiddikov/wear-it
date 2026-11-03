import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Errors, {
  ERROR_CODES,
  ErrorCode,
  HttpCode,
  Message,
  errorCodeOf,
} from "../src/libs/Errors";

describe("errorCodeOf", () => {
  it("uses the Message key as the stable code", () => {
    assert.equal(
      errorCodeOf(Message.WRONG_PASSWORD),
      "WRONG_PASSWORD",
    );
    assert.equal(
      errorCodeOf(Message.NOT_AUTHENTICATED),
      "NOT_AUTHENTICATED",
    );
  });

  it("gives every message its own code (keys and values are one-to-one)", () => {
    for (const key of ERROR_CODES) {
      assert.equal(errorCodeOf(Message[key]), key);
    }
    const values = ERROR_CODES.map((key) => Message[key]);
    assert.equal(new Set(values).size, values.length);
  });
});

describe("Errors", () => {
  it("serializes to { code, message, errorCode } as the REST API sends it", () => {
    const err = new Errors(
      HttpCode.UNAUTHORIZED,
      Message.WRONG_PASSWORD,
    );
    assert.deepEqual(JSON.parse(JSON.stringify(err)), {
      code: 401,
      message: Message.WRONG_PASSWORD,
      errorCode: "WRONG_PASSWORD",
    });
  });

  it("keeps the HTTP status in `code` so controllers can reply with err.code", () => {
    const err = new Errors(HttpCode.FORBIDDEN, Message.BLOCKED_USER);
    assert.equal(err.code, HttpCode.FORBIDDEN);
    assert.equal(err.errorCode, "BLOCKED_USER");
  });

  it("has a standard fallback with its own code", () => {
    assert.deepEqual(JSON.parse(JSON.stringify(Errors.standard)), {
      code: 500,
      message: Message.SOMETHING_WENT_WRONG,
      errorCode: "SOMETHING_WENT_WRONG",
    });
  });
});

describe("Message text", () => {
  it('has no double quotes (admin pages put it inside alert("..."))', () => {
    for (const key of ERROR_CODES) {
      assert.ok(
        !Message[key].includes('"'),
        `${key} contains a double quote`,
      );
    }
  });

  it("has no leftover restaurant wording", () => {
    for (const key of ERROR_CODES) {
      assert.ok(
        !/restaurant/i.test(Message[key]),
        `${key} mentions restaurant`,
      );
    }
  });

  it("covers the codes the frontend translates", () => {
    const expected: ErrorCode[] = [
      "SOMETHING_WENT_WRONG",
      "NO_DATA_FOUND",
      "CREATE_FAILED",
      "UPDATE_FAILED",
      "DELETE_FAILED",
      "NO_MEMBER_EMAIL",
      "USED_EMAIL_PHONE",
      "BLOCKED_USER",
      "WRONG_PASSWORD",
      "NOT_AUTHENTICATED",
      "TOKEN_CREATION_FAILED",
      "FILE_UPLOAD_FAILED",
      "RATING_OUT_OF_RANGE",
      "EXISTING_USER",
      "NOT_ENOUGH_POINTS",
      "NO_ADDRESS",
    ];
    assert.deepEqual([...ERROR_CODES].sort(), [...expected].sort());
  });
});
