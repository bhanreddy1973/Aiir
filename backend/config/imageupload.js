const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config({ path: "../../.env" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_ClOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileupload = async (file, usepreset) => {
  try {
    console.log("file", file);

    // Set default value for usepreset to true if not provided
    usepreset = usepreset === undefined ? true : usepreset;

    // Determine file type and resource type
    const fileType = file.mimetype || 'application/octet-stream';
    const fileName = file.originalname || 'unknown';
    const fileSize = file.size || 0;

    // File size limit: 100MB
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (fileSize > maxSize) {
      throw new Error('File size exceeds 100MB limit');
    }

    let resourceType = "auto";
    let folder = "chat-files";

    // Categorize files for better organization
    if (fileType.startsWith('image/')) {
      folder = "chat-images";
    } else if (fileType.startsWith('video/')) {
      folder = "chat-videos";
    } else if (fileType.startsWith('audio/')) {
      folder = "chat-audio";
    } else {
      folder = "chat-documents";
    }

    let options = {
      resource_type: resourceType,
      folder: folder,
      public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      use_filename: true,
      unique_filename: false
    };

    if (usepreset) {
      options.upload_preset = "chat-app";
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(options, (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("Upload result:", result);
            resolve(result);
          }
        })
        .end(file.buffer);
    });

    // Return comprehensive file information
    const fileInfo = {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      originalName: fileName,
      mimeType: fileType
    };

    console.log("File uploaded:", fileInfo);
    return fileInfo;
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
};

module.exports = fileupload;
