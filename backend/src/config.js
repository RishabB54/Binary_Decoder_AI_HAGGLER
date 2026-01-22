/**
 * Load environment variables FIRST before anything else
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root
const envPath = join(__dirname, '..', '.env');
console.log('🔧 [Config] Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ [Config] Failed to load .env:', result.error);
} else {
  console.log('✅ [Config] Environment variables loaded');
  console.log('✅ [Config] GEMINI_TEXT_API_KEY:', process.env.GEMINI_TEXT_API_KEY ? 'Found' : 'Missing');
  console.log('✅ [Config] GEMINI_IMAGE_API_KEY:', process.env.GEMINI_IMAGE_API_KEY ? 'Found' : 'Missing');
}
