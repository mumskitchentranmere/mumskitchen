import { Schema, model, models } from 'mongoose';
const TableSchema = new Schema({ tableNumber: { type: Number, required: true, unique: true }, capacity: { type: Number, required: true }, floor: { type: String, default: 'Ground' }, status: { type: String, enum: ['available','reserved','occupied'], default: 'available' }, isActive: { type: Boolean, default: true } }, { timestamps: true });
export const Table = models.Table || model('Table', TableSchema);
