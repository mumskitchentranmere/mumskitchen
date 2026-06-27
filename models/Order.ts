import { Schema, model, models } from 'mongoose';
const ItemSchema = new Schema({ menuItemId: String, name: String, price: Number, originalPrice: Number, quantity: Number, image: String, selectedSize: String });
const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: String,
  orderType: { type: String, enum: ['takeaway','delivery','dinein'], required: true },
  items: [ItemSchema],
  subtotal: Number, deliveryFee: { type: Number, default: 0 }, total: Number,
  status: { type: String, enum: ['pending','confirmed','preparing','ready','out-for-delivery','delivered','cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending','authorized','capturing','paid','failed','refunded','cancelled'], default: 'pending' },
  paymentIntentId: String,
  tableNumber: { type: Number, min: 1, max: 10 },
  deliveryAddress: String, pickupTime: String, specialInstructions: String,
}, { timestamps: true });

OrderSchema.index({ userId: 1 });
OrderSchema.index({ customerEmail: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

export const Order = models.Order || model('Order', OrderSchema);
