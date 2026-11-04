import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { HttpCode } from '../src/libs/Errors';

const sourceFiles = (dir: string): string[] =>
	readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return sourceFiles(path);
		return path.endsWith('.ts') ? [path] : [];
	});

describe('HTTP status of failures', () => {
	it('has no 304: a 304 response has no body, so the errorCode would be lost', () => {
		assert.ok(!Object.values(HttpCode).includes(304));
		for (const file of sourceFiles(join(__dirname, '..', 'src'))) {
			assert.ok(!/NOT_MODIFIED|\b304\b/.test(readFileSync(file, 'utf8')), `${file} mentions 304`);
		}
	});
});
