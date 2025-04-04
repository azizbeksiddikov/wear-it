import path from "path";
import multer from "multer";
import { v4 } from "uuid";
import fs from "fs";
import { supabase } from "./supabase";
import { decode } from "base64-arraybuffer";
import Errors, { HttpCode, Message } from "../Errors";

// function getTargetImageStorage(address: any) {
//   const targetPath = `./uploads/${address}`;
//   if (!fs.existsSync(targetPath)) {
//     fs.mkdirSync(targetPath, { recursive: true });
//   }

//   return multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, targetPath);
//     },
//     filename: function (req, file, cb) {
//       const extension = path.parse(file.originalname).ext;
//       const random_name = v4() + extension;
//       cb(null, random_name);
//     },
//   });
// }

// const makeUploader = (address: string) => {
//   const storage = getTargetImageStorage(address);
//   return multer({ storage: storage });
// };

// export default makeUploader;

export const memoryUploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadFileToSupabase = async (file: Express.Multer.File) => {
  const fileExtension = file.originalname.split(".").pop();
  console.log("fileExtension", fileExtension);

  const randomFileName = `${v4()}.${fileExtension}`; // Generate a random name
  console.log("randomFileName", randomFileName);

  const fileBase64 = decode(file.buffer.toString("base64"));
  console.log("fileBase64", fileBase64);

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

export const deleteFileFromSupabase = async (
  fileUrl: string
): Promise<boolean> => {
  try {
    // Extract filename from URL
    const urlParts = fileUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];

    const { data, error } = await supabase.storage
      .from("products")
      .remove([`products/${fileName}`]);

    if (error) {
      console.error("Error deleting file from Supabase:", error);
      return false;
    }

    console.log(`Successfully deleted file: ${fileName}`);
    return true;
  } catch (err) {
    console.error("Failed to delete file from Supabase:", err);
    return false;
  }
};

export const deleteFilesFromSupabase = async (
  fileUrls: string[]
): Promise<void> => {
  if (!fileUrls || fileUrls.length === 0) return;

  try {
    // Process deletions in parallel
    await Promise.all(fileUrls.map((url) => deleteFileFromSupabase(url)));
  } catch (err) {
    console.error("Error during bulk file deletion:", err);
  }
};
