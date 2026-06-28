import { Schema, model, models } from 'mongoose';

const PrintJobSchema = new Schema({
  hex:    { type: String, required: true },
  status: { type: String, enum: ['pending', 'printing', 'done'], default: 'pending' },
}, { timestamps: true });

export const PrintJob = models.PrintJob || model('PrintJob', PrintJobSchema);
