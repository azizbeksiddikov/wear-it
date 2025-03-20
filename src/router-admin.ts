import express from "express";
import router from "./router";
const routerAdmin = express.Router();

/** Admin Management **/
routerAdmin.post("/signup", (req, res) => {});
routerAdmin.post("/login", (req, res) => {});
routerAdmin.post("/logout", (req, res) => {});
routerAdmin.get("/profile", (req, res) => {});
routerAdmin.post("/profile", (req, res) => {});

/** Member Management **/
routerAdmin.get("/users", (req, res) => {});
routerAdmin.get("/users/:id", (req, res) => {});
routerAdmin.post("/users/:id", (req, res) => {});

/** Product Management **/
// getProducts
routerAdmin.get("/products", (req, res) => {});
// getProduct
routerAdmin.get("/products/:id", (req, res) => {});
// createProduct
routerAdmin.post("/products", (req, res) => {});
// updateProduct
routerAdmin.post("/products/:id", (req, res) => {});

/** Product Variant Management **/
// createVariant
routerAdmin.post("/products/:id/variants", (req, res) => {});
// getVariants
routerAdmin.get("/products/:id/variants", (req, res) => {});
// updateVariant
routerAdmin.post("/variants/:id", (req, res) => {});

/** Orders **/
// getLatestOrders
routerAdmin.get("/orders", (req, res) => {});
// getOrder
routerAdmin.get("/orders/:id", (req, res) => {});
// updateOrder
routerAdmin.post("/orders/:id", (req, res) => {});

/** Review **/
routerAdmin.get("/reviews", (req, res) => {});
routerAdmin.get("/reviews/:id", (req, res) => {});
routerAdmin.post("/reviews/:id", (req, res) => {});

/** Dashboard **/
routerAdmin.get("/", (req, res) => {});

export default routerAdmin;
