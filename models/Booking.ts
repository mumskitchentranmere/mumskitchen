import { Schema, model, models } from 'mongoose';
const BookingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
  tableNumber: Number,
  date: { type: String, required: true },
  time: { type: String, required: true },
  partySize: { type: Number, required: true },
  specialRequests: String,
  depositAmount: { type: Number, default: 0 },
  depositPaid: { type: Boolean, default: false },
  paymentIntentId: String,
  status: { type: String, enum: ['pending','confirmed','cancelled','completed','no-show'], default: 'pending' },
}, { timestamps: true });
export const Booking = models.Booking || model('Booking', BookingSchema);
