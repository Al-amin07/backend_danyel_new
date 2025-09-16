import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import config from "../config";

// -----------------------------
// 1. Cloudinary Config (One-time)
// -----------------------------
cloudinary.config({
  cloud_name: config.cloudinary_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

// -----------------------------
// 2. Helper: Delete Local File
// -----------------------------
const deleteFile = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error(
      `Error deleting file: ${err instanceof Error ? err.message : String(err)}`
    );
  }
};

// -----------------------------
// 3. Upload Single File
// -----------------------------
export const uploadToCloudinary = async (
  filePath: string,
  folder: string = "uploads"
) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto", // auto handles images + docs (pdf, doc, etc.)
    });

    await deleteFile(filePath);

    return result; // Return full response (secure_url, public_id, etc.)
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("File upload failed");
  }
};

// -----------------------------
// 4. Upload Multiple Files
// -----------------------------
export const uploadMultipleToCloudinary = async (
  filePaths: string[],
  folder: string = "uploads"
) => {
  try {
    const results = [];
    for (const filePath of filePaths) {
      const result = await uploadToCloudinary(filePath, folder);
      results.push(result);
    }
    return results;
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw new Error("Multiple file upload failed");
  }
};

// -----------------------------
// 5. Multer Storage Config
// -----------------------------
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadPath, { recursive: true }); // Ensure folder exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// -----------------------------
// 6. Multer File Filter (Security)
// -----------------------------
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
};

// -----------------------------
// 7. Final Multer Export
// -----------------------------
export const upload = multer({ storage, fileFilter });
