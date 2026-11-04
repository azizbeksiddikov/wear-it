import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { POINTS_BALANCE_CAP, TOPUP_MAX_AMOUNT, TOPUP_MIN_AMOUNT } from '../src/libs/config';
import Errors, { Message } from '../src/libs/Errors';
import { validateTopUpAmount } from '../src/libs/utils/points';

describe('validateTopUpAmount', () => {
	it('accepts whole numbers from the minimum to the maximum', () => {
		assert.equal(validateTopUpAmount(TOPUP_MIN_AMOUNT), TOPUP_MIN_AMOUNT);
		assert.equal(validateTopUpAmount(250), 250);
		assert.equal(validateTopUpAmount(TOPUP_MAX_AMOUNT), TOPUP_MAX_AMOUNT);
	});

	it('rejects everything else with TOPUP_INVALID_AMOUNT (400)', () => {
		for (const bad of [0, -5, 1001, 1.5, NaN, Infinity, '100', null, undefined, {}, [100], true]) {
			assert.throws(
				() => validateTopUpAmount(bad),
				(err: unknown) => err instanceof Errors && err.code === 400 && err.errorCode === 'TOPUP_INVALID_AMOUNT',
				`should reject ${JSON.stringify(bad)}`,
			);
		}
	});

	it('keeps the limits and the messages in step', () => {
		assert.ok(Message.TOPUP_INVALID_AMOUNT.includes(String(TOPUP_MIN_AMOUNT)));
		assert.ok(Message.TOPUP_INVALID_AMOUNT.includes(String(TOPUP_MAX_AMOUNT)));
		assert.ok(Message.TOPUP_LIMIT_REACHED.includes(String(POINTS_BALANCE_CAP)));
	});
});
