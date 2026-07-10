import { Schema, model, models } from 'mongoose';

const ReviewSchema = new Schema({
  // Who wrote it
  userId:        { type: Schema.Types.ObjectId, ref: 'User' },
  customerName:  { type: String, required: true },
  customerEmail: { type: String, required: true },
  avatar:        { type: String, default: '' }, // first letter fallback

  // What they rated
  type:          { type: String, enum: ['restaurant', 'dish'], default: 'restaurant' },
  menuItemId:    { type: Schema.Types.ObjectId, ref: 'MenuItem' }, // only if type=dish
  menuItemName:  { type: String, default: '' },

  // The review
  rating:        { type: Number, required: true, min: 1, max: 5 },
  title:         { type: String, required: true, maxlength: 120 },
  body:          { type: String, required: true, maxlength: 1000 },
  images:        [{ type: String }], // optional photos

  // Tags customers can pick
  tags:          [{ type: String }], // 'Great food', 'Fast service', 'Good value', etc.

  // Linked order (to verify they actually ordered)
  orderId:       { type: Schema.Types.ObjectId, ref: 'Order' },
  verified:      { type: Boolean, default: false }, // verified purchase

  // Admin controls
  status:        { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminReply:    { type: String, default: '' },
  adminReplyAt:  { type: Date },
  featured:      { type: Boolean, default: false },

  // Helpful votes
  helpfulVotes:  { type: Number, default: 0 },
  helpfulVoters: [{ type: String }], // user IDs or IPs

}, { timestamps: true });

ReviewSchema.index({ status: 1, type: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, featured: 1 });
ReviewSchema.index({ menuItemId: 1, status: 1 });

// Auto-update MenuItem average rating when a dish review is saved
ReviewSchema.post('save', async function () {
  if (this.type === 'dish' && this.menuItemId && this.status === 'approved') {
    const Review = this.constructor as any;
    const stats = await Review.aggregate([
      { $match: { menuItemId: this.menuItemId, status: 'approved', type: 'dish' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      const { MenuItem } = await import('./MenuItem');
      await MenuItem.findByIdAndUpdate(this.menuItemId, {
        avgRating: Math.round(stats[0].avgRating * 10) / 10,
        reviewCount: stats[0].count,
      });
    }
  }
});

export const Review = models.Review || model('Review', ReviewSchema);
