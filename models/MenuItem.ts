import { Schema, model, models } from 'mongoose';

const MenuItemSchema = new Schema({
  name:         { type: String, required: true },
  description:  { type: String, default: '' },
  price:        { type: Number, required: true },
  category:     { type: String, enum: ['snack','rice-bowl','noodle','bibimbap','soup','fried-chicken','side','drink','set-menu'], required: true },
  cuisine:      { type: String, enum: ['korean','bangladeshi','both'], default: 'korean' },
  images:       [{ type: String }],
  primaryImage: { type: String, default: '' },
  tags:         [String],
  sizes: [{ label: String, price: Number }],
  isAvailable:  { type: Boolean, default: true },
  isFeatured:   { type: Boolean, default: false },
  sortOrder:    { type: Number, default: 0 },
  richDescription: { type: String, default: '' },
  avgRating:    { type: Number, default: 0 },
  reviewCount:  { type: Number, default: 0 },
  // Epos Now sync fields
  eposProductId:  { type: Number, default: null },
  eposCategoryId: { type: Number, default: null },
  eposUpdatedAt:  { type: Date,   default: null },
  syncedFromEpos: { type: Boolean, default: false },
}, { timestamps: true });

export const MenuItem = models.MenuItem || model('MenuItem', MenuItemSchema);
