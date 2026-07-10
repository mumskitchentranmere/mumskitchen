import { Schema, model, models } from 'mongoose';

const PrintJobSchema = new Schema({
  order:  { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'done'], default: 'pending' },
}, { timestamps: true });

PrintJobSchema.index({ status: 1, createdAt: 1 });

export const PrintJob = models.PrintJob || model('PrintJob', PrintJobSchema);
