export const MORGAN_FORMAT = `:method :url :response-time [:status] \n`;
export const AUTH_TIMER = 48;

/**
 * The login cookie. `httpOnly`: page scripts cannot read it, only the browser sends it back.
 * `secure` in production, `sameSite=lax` so other sites cannot make it ride along on POSTs.
 */
export const authCookieOptions = () => ({
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: process.env.NODE_ENV === 'production',
	path: '/',
});

/** Demo store: points are free and no real money is involved. Limits for `POST /member/topup`. */
export const TOPUP_MIN_AMOUNT = 1;
export const TOPUP_MAX_AMOUNT = 1000;
/** A balance can never go above this, whatever the number of top-ups. */
export const POINTS_BALANCE_CAP = 10000;
import mongoose from 'mongoose';
export const shapeIntoMongooseObjectId = (target: any) => {
	return typeof target === 'string' ? new mongoose.Types.ObjectId(target) : target;
};
