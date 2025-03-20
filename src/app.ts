import express from "express";
import path from "path";
import routerAdmin from "./router-admin";
import morgan from "morgan";
import { MORGAN_FORMAT } from "./libs/config";
import { T } from "./libs/types/common";

/** 1-ENTRANCE **/
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("./uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan(MORGAN_FORMAT));

/** 2-SESSIONS **/
/** 3-VIEWS **/

/** 4-ROUTERS **/
app.use("/admin", routerAdmin);

export default app;
