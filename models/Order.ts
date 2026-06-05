import { Schema, model, models } from 'mongoose';
const ItemSchema = new Schema({ menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' }, name: String, price: Number, quantity: Number, image: String, selectedSize: String });
const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: String,
  orderType: { type: String, enum: ['takeaway','delivery','dinein'], required: true },
  items: [ItemSchema],
  subtotal: Number, deliveryFee: { type: Number, default: 0 }, total: Number,
  status: { type: String, enum: ['pending','confirmed','preparing','ready','out-for-delivery','delivered','cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  paymentIntentId: String,
  deliveryAddress: String, pickupTime: String, specialInstructions: String,
  eposOrderId: String,   // sync with Epos Now
}, { timestamps: true });
export const Order = models.Order || model('Order', OrderSchema);
