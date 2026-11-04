import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

/**
 * Starts an in-memory MongoDB (a one-node replica set, because orders use transactions) and loads the
 * real Express app against it. No network is used after the first run, which downloads a MongoDB binary.
 * Call it once per test file, before anything imports `src/`.
 */
export const startTestApp = async () => {
	const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
	const uri = replSet.getUri('wearit-test');

	// The app reads these when it is first imported.
	process.env.MONGO_URL = uri;
	process.env.SESSION_SECRET = 'test-session-secret';
	process.env.SECRET_TOKEN = 'test-token-secret';
	process.env.NODE_ENV = 'test';
	// A syntactically valid Supabase client that is never called: the tests never upload.
	process.env.SUPABASE_PROJECT_URL = 'http://127.0.0.1:9';
	process.env.SUPABASE_SECRET_KEY = 'test-key';

	// The controllers log every request; keep the test output readable.
	const originalLog = console.log;
	console.log = () => {};

	await mongoose.connect(uri);
	const { default: app, sessionStore } = await import('../../src/app');

	// The session store connects and creates its index in the background. Wait for it, so that closing
	// it at the end cannot race with that work. (Network I/O cannot finish before this listener is added.)
	const store = sessionStore as any;
	await new Promise<void>((resolve, reject) => {
		store.once('connected', resolve);
		store.once('error', reject);
	});

	const stop = async () => {
		console.log = originalLog;
		await store.client?.close();
		await mongoose.disconnect();
		await replSet.stop();
	};

	return { app, stop };
};
