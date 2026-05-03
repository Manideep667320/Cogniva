import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Atlas URI from .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const ATLAS_URI = process.env.MONGODB_URI;
const LOCAL_URI = 'mongodb://localhost:27017/cogniva';

if (!ATLAS_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

async function migrate() {
  let localConn, atlasConn;

  try {
    console.log('⏳ Connecting to Local MongoDB...');
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to Local MongoDB');

    console.log('⏳ Connecting to Atlas MongoDB...');
    atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to Atlas MongoDB');

    const collections = await localConn.db.listCollections().toArray();
    console.log(`📂 Found ${collections.length} collections to migrate\n`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      console.log(`🚀 Migrating collection: ${colName}...`);

      const localCol = localConn.db.collection(colName);
      const atlasCol = atlasConn.db.collection(colName);

      const documents = await localCol.find({}).toArray();
      
      if (documents.length === 0) {
        console.log(`  ⚪ Collection is empty, skipping.`);
        continue;
      }

      let insertedCount = 0;
      let skippedCount = 0;

      for (const doc of documents) {
        try {
          // Attempt to insert document. Preserve _id.
          await atlasCol.insertOne(doc);
          insertedCount++;
        } catch (err) {
          if (err.code === 11000) {
            // Duplicate key error, skip it
            skippedCount++;
          } else {
            console.error(`  ❌ Error inserting document in ${colName}:`, err.message);
          }
        }
      }

      console.log(`  ✅ Done! Migrated: ${insertedCount}, Skipped (Existing): ${skippedCount}\n`);
    }

    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (localConn) await localConn.close();
    if (atlasConn) await atlasConn.close();
  }
}

migrate();
