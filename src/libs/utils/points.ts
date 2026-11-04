import Errors, { HttpCode, Message } from '../Errors';
import { TOPUP_MAX_AMOUNT, TOPUP_MIN_AMOUNT } from '../config';

/** A top-up amount must be a JSON number: a whole number from TOPUP_MIN_AMOUNT to TOPUP_MAX_AMOUNT. */
export const validateTopUpAmount = (amount: unknown): number => {
	if (
		typeof amount !== 'number' ||
		!Number.isInteger(amount) ||
		amount < TOPUP_MIN_AMOUNT ||
		amount > TOPUP_MAX_AMOUNT
	) {
		throw new Errors(HttpCode.BAD_REQUEST, Message.TOPUP_INVALID_AMOUNT);
	}
	return amount;
};
