import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { authCookieOptions } from '../src/libs/config';

describe('authCookieOptions', () => {
	const original = process.env.NODE_ENV;
	afterEach(() => {
		process.env.NODE_ENV = original;
	});

	it('is httpOnly, sameSite lax and site-wide', () => {
		const options = authCookieOptions();
		assert.equal(options.httpOnly, true);
		assert.equal(options.sameSite, 'lax');
		assert.equal(options.path, '/');
	});

	it('is secure only in production', () => {
		process.env.NODE_ENV = 'production';
		assert.equal(authCookieOptions().secure, true);
		process.env.NODE_ENV = 'development';
		assert.equal(authCookieOptions().secure, false);
	});
});
