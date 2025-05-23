import multer from "multer";
import { v4 } from "uuid";
import { supabase } from "./supabase";
import { decode } from "base64-arraybuffer";
import Errors, { HttpCode, Message } from "../Errors";
// import path from "path";
// import fs from "fs";

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

export const uploadFileToSupabase = async (
  file: Express.Multer.File,
  folderName: string = "products"
) => {
  const fileExtension = file.originalname.split(".").pop();

  const randomFileName = `${v4()}.${fileExtension}`; // Generate a random name

  const fileBase64 = decode(file.buffer.toString("base64"));

  const { data, error } = await supabase.storage
    .from(folderName)
    .upload(`/${randomFileName}`, fileBase64, {
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
    .from(folderName)
    .getPublicUrl(data.path);

  return image.publicUrl;
};

export const deleteFileFromSupabase = async (
  fileUrl: string,
  folderName: string = "products"
): Promise<boolean> => {
  try {
    // Extract filename from URL
    const urlParts = fileUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from(folderName)
      .remove([`/${fileName}`]);

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
