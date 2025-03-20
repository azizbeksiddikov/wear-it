import express from "express";
const router = express.Router();

/** Member Managment  **/
router.get("/member/admin", (req, res) => {}); // Admin info
router.post("/signup", (req, res) => {}); // User signup
router.post("/login", (req, res) => {}); // User login
router.post("/logout", (req, res) => {}); // User logout
router.get("member/detail", (req, res) => {}); // User detail
router.post("/member/update", (req, res) => {}); // User update

/** Product **/
router.get("/product/all", (req, res) => {}); // Get all products
router.get("/product/:id", (req, res) => {}); // Get product by id

/** Orders **/
router.post("/order/create", (req, res) => {}); // Create order
router.get("/order/all", (req, res) => {}); // Get all orders
router.post("/order/update", (req, res) => {}); // Update order

/** Review **/
router.get("/review/all", (req, res) => {}); // Get all reviews
router.get("/review/:id", (req, res) => {}); // Get review by id
router.post("/review/create", (req, res) => {}); // Create review
router.post("/review/update", (req, res) => {}); // Update review

export default router;
