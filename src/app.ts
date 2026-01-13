import express from "express";
import path from "path";
import routerAdmin from "./router-admin";
import morgan from "morgan";
import { MORGAN_FORMAT } from "./libs/config";
import router from "./router";
import session from "express-session";
import ConnectMongoDB from "connect-mongodb-session";
import { T } from "./libs/types/common";
import cookieParser from "cookie-parser";
import cors from "cors";

const MongoDBStore = ConnectMongoDB(session);
const store = new MongoDBStore({
  uri: process.env.MONGO_URL as string,
  collection: "sessions",
});

/** 1-ENTRANCE **/
const app = express();
app.use(express.static(path.join(__dirname, "public")));
// app.use("/uploads", express.static("./uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

app.use(morgan(MORGAN_FORMAT));

/** 2-SESSIONS **/
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
    store: store,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(function (req, res, next) {
  const sessionInstance = req.session as T;
  res.locals.member = sessionInstance.member;
  next();
});

/** 3-VIEWS **/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/** 4-HEALTH CHECK **/
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

/** 4-ROUTERS **/
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wear It API</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; background-color: #f4f7f6; }
            .card { text-align: center; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 400px; width: 100%; }
            h1 { color: #1a1a1a; margin-bottom: 0.5rem; font-size: 1.5rem; }
            p { color: #666; margin-bottom: 1.5rem; line-height: 1.5; }
            a { display: inline-block; padding: 12px 32px; background: #000; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; transition: transform 0.2s, background 0.2s; }
            a:hover { background: #333; transform: translateY(-2px); }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Wear It API</h1>
            <p>Welcome! The API is running successfully. To manage products and users, please visit the admin dashboard.</p>
            <a href="/admin">Go to Admin Panel</a>
        </div>
    </body>
    </html>
  `);
});
app.use("/admin", routerAdmin);
app.use("/", router);

export default app;
