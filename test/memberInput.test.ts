import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pickMemberUpdate } from '../src/libs/utils/memberInput';

describe('pickMemberUpdate', () => {
	it('keeps the profile fields', () => {
		const input = { memberFullName: 'Min Park', memberAddress: '1 Example Street', memberDesc: 'Hi' };
		assert.deepEqual(pickMemberUpdate(input), input);
	});

	it('drops points, type, status and _id', () => {
		const result = pickMemberUpdate({
			memberFullName: 'Min Park',
			memberPoints: 999999,
			memberType: 'ADMIN',
			memberStatus: 'ACTIVE',
			memeberStatus: 'ACTIVE',
			_id: '64b000000000000000000000',
		});
		assert.deepEqual(result, { memberFullName: 'Min Park' });
	});

	it('ignores non-string values and empty required fields', () => {
		const result = pickMemberUpdate({
			memberEmail: { $ne: null },
			memberPhone: '   ',
			memberPassword: '',
			memberAddress: '',
		});
		assert.deepEqual(result, { memberAddress: '' });
	});

	it('copes with a missing body', () => {
		assert.deepEqual(pickMemberUpdate(undefined), {});
		assert.deepEqual(pickMemberUpdate(null), {});
	});
});
