// Moves Wearit's Supabase storage (buckets: products, members) to a new Supabase project.
// Every file is also saved locally in ./products and ./members (backup).
//
// Needs SUPABASE_SECRET_KEY (the new project's secret key) in wear-it's env file (never printed).
// Files come from the local copies (the old Seoul project kivceufjcybejpsngscy was deleted 2026-10-21).
//
// Run from wear-it/:
//   node scripts/ops/migrate-supabase.js https://<new-ref>.supabase.co          # upload files only
//   node scripts/ops/migrate-supabase.js https://<new-ref>.supabase.co --apply  # also rewrite image URLs in MongoDB
const fs = require("fs");
const path = require("path");
require(path.join(process.cwd(), "node_modules", "dotenv")).config({ quiet: true });
const mongoose = require(path.join(process.cwd(), "node_modules", "mongoose"));
const { createClient } = require(path.join(process.cwd(), "node_modules", "@supabase/supabase-js"));

const BUCKETS = ["products", "members"];
const APPLY = process.argv.includes("--apply");
const OLD = "https://kivceufjcybejpsngscy.supabase.co";
const NEW = (process.argv.find((a) => a.startsWith("https://")) || process.env.SUPABASE_PROJECT_URL || "").replace(/\/$/, "");
if (!NEW || !process.env.SUPABASE_SECRET_KEY) { console.log("Needs SUPABASE_PROJECT_URL (new project) + SUPABASE_SECRET_KEY"); process.exit(1); }
if (OLD === NEW) { console.log("Old and new URL are the same — already migrated?"); process.exit(1); }
const sb = createClient(NEW, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

// Where image URLs live in MongoDB
const FIELDS = [["products", "productImages"], ["orderItems", "productImage"], ["members", "memberImage"]];
const oldPrefix = `${OLD}/storage/v1/object/public/`;
const newPrefix = `${NEW}/storage/v1/object/public/`;

(async () => {
	for (const b of BUCKETS) {
		const { error } = await sb.storage.createBucket(b, { public: true });
		console.log(`bucket ${b}: ${error ? error.message : "created (public)"}`);
	}

	await mongoose.connect(process.env.MONGO_URL);
	const db = mongoose.connection.db;
	const urls = new Set();
	for (const [col, field] of FIELDS)
		for (const d of await db.collection(col).find({ [field]: { $exists: true } }).toArray())
			[].concat(d[field] || []).forEach((u) => typeof u === "string" && u.startsWith(oldPrefix) && urls.add(u));
	console.log(`${urls.size} distinct files referenced in MongoDB`);

	let copied = 0, failed = 0;
	for (const u of urls) {
		const [bucket, ...rest] = u.slice(oldPrefix.length).split("/");
		const file = rest.join("/");
		const local = path.join(process.env.WEARIT_IMAGES_DIR || path.resolve(process.cwd(), "../sample-images"), bucket, path.basename(file));
		try {
			let buf;
			if (fs.existsSync(local)) buf = fs.readFileSync(local);
			else {
				const r = await fetch(u);
				if (!r.ok) throw new Error(`download HTTP ${r.status}`);
				buf = Buffer.from(await r.arrayBuffer());
				fs.mkdirSync(path.dirname(local), { recursive: true });
				fs.writeFileSync(local, buf);
			}
			const type = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif" }[file.split(".").pop().toLowerCase()] || "application/octet-stream";
			const { error } = await sb.storage.from(bucket).upload(file, buf, { contentType: type, upsert: true });
			if (error) throw new Error(error.message);
			copied++;
		} catch (e) { failed++; console.log(`  FAIL ${bucket}/${file}: ${e.message}`); }
	}
	console.log(`copied ${copied}, failed ${failed}`);

	if (APPLY) {
		if (failed) { console.log("Not rewriting URLs because some files failed."); return mongoose.disconnect(); }
		for (const [col, field] of FIELDS) {
			let n = 0;
			for (const d of await db.collection(col).find({ [field]: { $exists: true } }).toArray()) {
				const v = d[field];
				const nv = Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x.replace(oldPrefix, newPrefix) : x)) : typeof v === "string" ? v.replace(oldPrefix, newPrefix) : v;
				if (JSON.stringify(nv) !== JSON.stringify(v)) { await db.collection(col).updateOne({ _id: d._id }, { $set: { [field]: nv } }); n++; }
			}
			console.log(`${col}.${field}: ${n} documents updated`);
		}
	}
	await mongoose.disconnect();
})();
