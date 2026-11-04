import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { roundRating } from '../src/libs/utils/rating';

describe('roundRating', () => {
	it('keeps one decimal', () => {
		assert.equal(roundRating(4.5714285), 4.6);
		assert.equal(roundRating(3.6666), 3.7);
		assert.equal(roundRating(4.04), 4);
	});

	it('leaves whole numbers and zero alone', () => {
		assert.equal(roundRating(5), 5);
		assert.equal(roundRating(0), 0);
	});

	it('turns missing or broken values into 0', () => {
		assert.equal(roundRating(undefined), 0);
		assert.equal(roundRating(null), 0);
		assert.equal(roundRating('abc'), 0);
	});
});
