import path from "path";
import multer from "multer";
import { v4 } from "uuid";
import fs from "fs";
import { supabase } from "./supabase";
import { decode } from "base64-arraybuffer";
import Errors, { HttpCode, Message } from "../Errors";

function getTargetImageStorage(address: any) {
  const targetPath = `./uploads/${address}`;
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, targetPath);
    },
    filename: function (req, file, cb) {
      const extension = path.parse(file.originalname).ext;
      const random_name = v4() + extension;
      cb(null, random_name);
    },
  });
}

const makeUploader = (address: string) => {
  const storage = getTargetImageStorage(address);
  return multer({ storage: storage });
};

export default makeUploader;

export const memoryUploader = multer({
  storage: multer.memoryStorage(), // Store files in memory as Buffer
  limits: { fileSize: 10 * 1024 * 1024 }, // Set file size limit (e.g., 10 MB)
});

export const uploadFileToSupabase = async (file: Express.Multer.File) => {
  const fileExtension = file.originalname.split(".").pop(); // Get the file extension
  const randomFileName = `${v4()}.${fileExtension}`; // Generate a random name

  const fileBase64 = decode(file.buffer.toString("base64"));

  const { data, error } = await supabase.storage
    .from("products")
    .upload(`products/${randomFileName}`, fileBase64, {
      contentType: file.mimetype,
    });

  if (error) {
    console.error("Error uploading file to Supabase:", error);
    throw new Errors(
      HttpCode.INTERNAL_SERVER_ERROR,
      Message.FILE_UPLOAD_FAILED
    );
  }

  const { data: image } = supabase.storage
    .from("products")
    .getPublicUrl(data.path);

  return image.publicUrl;
};
