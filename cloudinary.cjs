
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} catch (error) {
  console.error('Cloudinary configuration error:', error);
  process.exit(1);
}

module.exports = cloudinary;
