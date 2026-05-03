import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- Database Diagnostic ---');
console.log('MONGODB_URI from process.env:', process.env.MONGODB_URI || 'NOT SET (falling back to localhost)');
console.log('Final URI used by backend:', process.env.MONGODB_URI || 'mongodb://localhost:27017/cogniva');
console.log('---------------------------');
