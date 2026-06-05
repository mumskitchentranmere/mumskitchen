import { Schema, model, models } from 'mongoose';

const DayShiftSchema = new Schema({
  start:  { type: String, default: '' },  // 'HH:MM'
  finish: { type: String, default: '' },  // 'HH:MM'
  hours:  { type: Number, default: 0 },   // calculated from start/finish
}, { _id: false });

const ShiftsSchema = new Schema({
  monday:    { type: DayShiftSchema, default: () => ({}) },
  tuesday:   { type: DayShiftSchema, default: () => ({}) },
  wednesday: { type: DayShiftSchema, default: () => ({}) },
  thursday:  { type: DayShiftSchema, default: () => ({}) },
  friday:    { type: DayShiftSchema, default: () => ({}) },
  saturday:  { type: DayShiftSchema, default: () => ({}) },
  sunday:    { type: DayShiftSchema, default: () => ({}) },
}, { _id: false });

const TimesheetSchema = new Schema({
  employeeId:   { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeName: { type: String, required: true },
  wagesPerHour: { type: Number, required: true },
  weekStart:    { type: String, required: true },   // ISO date YYYY-MM-DD (Monday)
  shifts:       { type: ShiftsSchema, default: () => ({}) },
  totalHours:   { type: Number, default: 0 },
  totalWages:   { type: Number, default: 0 },
  notes:        { type: String, default: '' },
  status:       { type: String, enum: ['draft', 'approved'], default: 'draft' },
  paid:         { type: Boolean, default: false },
  paidAt:       { type: Date },
  paidAmount:   { type: Number, default: 0 },
}, { timestamps: true });

// One timesheet per employee per week
TimesheetSchema.index({ employeeId: 1, weekStart: 1 }, { unique: true });

export const Timesheet = models.Timesheet || model('Timesheet', TimesheetSchema);
