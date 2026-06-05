import mongoose from 'mongoose';

declare global { var _mongoose: { conn: any; promise: any } | undefined; }
const cached = global._mongoose || { conn: null, promise: null };
global._mongoose = cached;

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI environment variable');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
