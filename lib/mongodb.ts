import mongoose from 'mongoose';

const OPTS: mongoose.ConnectOptions = {
  bufferCommands:           false,
  maxPoolSize:              10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS:          45000,
  connectTimeoutMS:         10000,
};

declare global { var _mongoose: { conn: any; promise: any } | undefined; }

const cached = global._mongoose || { conn: null, promise: null };
global._mongoose = cached;

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI environment variable');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, OPTS).catch(err => {
      cached.promise = null; // allow retry on next request
      throw err;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
