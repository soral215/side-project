import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// 환경 변수 로드 (server.ts에서 이미 로드되었을 수 있지만, 안전을 위해 다시 로드)
dotenv.config();

// Cloudinary 설정
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️  Cloudinary 환경 변수가 설정되지 않았습니다. 이미지 업로드가 작동하지 않을 수 있습니다.');
  console.warn('   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET을 .env 파일에 설정하세요.');
} else {
  console.log('✅ Cloudinary 설정 완료');
}

cloudinary.config({
  cloud_name: cloudName || '',
  api_key: apiKey || '',
  api_secret: apiSecret || '',
});

export default cloudinary;

