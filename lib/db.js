import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Helper to check if string is a valid MongoDB URI
const isValidMongoURI = (uri) => {
  return uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'));
};

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!isValidMongoURI(MONGODB_URI)) {
    console.warn("⚠️ Invalid MONGODB_URI format detected. It should start with 'mongodb://' or 'mongodb+srv://'.");
    console.warn("Current Value:", MONGODB_URI);
    
    // Check if we are using the placeholder
    if (MONGODB_URI?.includes("YOUR_ATLAS_CONNECTION_STRING_HERE") || MONGODB_URI?.includes("YOUR_MONGODB_CONNECTION_STRING_HERE")) {
        console.warn("⚠️ Using Mock Database Mode because MONGODB_URI is a placeholder.");
        return null; // Return null to signal mock mode
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
