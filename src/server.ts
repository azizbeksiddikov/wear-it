import dotenv from "dotenv";
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});
import mongoose from "mongoose";
import app from "./app";

const PORT = process.env.PORT ?? 3003;
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("MONGO_URL is not defined in environment variables");
  process.exit(1);
}

mongoose.set("strictQuery", false);
mongoose.Schema.Types.String.set("trim", true);

(async function startServer() {
  try {
    await mongoose.connect(MONGO_URL as string, {});
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
})();
