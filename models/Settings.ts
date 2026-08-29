import { Schema, model, models } from 'mongoose';

const SettingsSchema = new Schema({
  globalDiscount:    { type: Number, default: 0, min: 0, max: 100 },
  categoryOrder:     [{ type: String }],
  dineInEnabled:     { type: Boolean, default: true },
  categoryDiscounts: { type: Map, of: Number, default: {} },
}, { timestamps: true });

export const Settings = models.Settings || model('Settings', SettingsSchema);
