import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, parsePaging } from '../src/libs/utils/paging';

describe('parsePaging', () => {
	it('keeps valid whole numbers', () => {
		assert.deepEqual(parsePaging('2', '12'), { page: 2, limit: 12 });
		assert.deepEqual(parsePaging(3, 4), { page: 3, limit: 4 });
	});

	it('falls back to the defaults for missing or bad values', () => {
		for (const bad of [undefined, '', 'abc', '0', '-3', '1.5', NaN, null, [], {}]) {
			assert.deepEqual(parsePaging(bad, bad), { page: 1, limit: DEFAULT_PAGE_SIZE }, String(bad));
		}
	});

	it('caps the page size', () => {
		assert.equal(parsePaging('1', '99999').limit, MAX_PAGE_SIZE);
	});
});
