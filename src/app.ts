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
app.use("/uploads", express.static("./uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
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

/** 4-ROUTERS **/
app.use("/admin", routerAdmin);
app.use("/", router);

export default app;
