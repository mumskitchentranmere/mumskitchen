import { Schema, model, models } from 'mongoose';
const UserSchema = new Schema({ name: { type: String, required: true }, email: { type: String, required: true, unique: true }, password: String, role: { type: String, enum: ['user','admin'], default: 'user' }, phone: String, address: String }, { timestamps: true });
export const User = models.User || model('User', UserSchema);
