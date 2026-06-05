import { Schema, model, models } from 'mongoose';

const EmployeeSchema = new Schema({
  name:         { type: String, required: true },
  role:         { type: String, default: '' },
  wagesPerHour: { type: Number, required: true, min: 0 },
  isActive:     { type: Boolean, default: true },
  phone:        { type: String, default: '' },
  email:        { type: String, default: '' },
  notes:        { type: String, default: '' },
}, { timestamps: true });

export const Employee = models.Employee || model('Employee', EmployeeSchema);
