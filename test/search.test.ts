import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { escapeRegExp } from '../src/libs/utils/search';

describe('escapeRegExp', () => {
	it('makes every special character literal', () => {
		for (const text of ['(', 'a.b', '[x]', '*', '\\', 'a|b', '^$', '+?', '{1}']) {
			assert.ok(new RegExp(escapeRegExp(text), 'i').test(text), text);
		}
	});

	it('leaves normal words alone', () => {
		assert.equal(escapeRegExp('denim jacket'), 'denim jacket');
	});
});
