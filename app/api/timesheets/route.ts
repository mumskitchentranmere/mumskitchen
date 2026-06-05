import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Timesheet } from '@/models/Timesheet';
import { Employee } from '@/models/Employee';
import { auth } from '@/lib/auth';

async function requireAdmin() {
  const session = await auth();
  return (session?.user as any)?.role === 'admin';
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;

/** Calculate decimal hours between two HH:MM strings. Handles midnight crossover. */
function shiftHours(start: string, finish: string): number {
  if (!start || !finish) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [fh, fm] = finish.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(fh) || isNaN(fm)) return 0;
  let diff = (fh * 60 + fm) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // crossed midnight
  return Math.round(diff / 60 * 100) / 100;
}

function calcTotals(shifts: Record<string, { start?: string; finish?: string }>, wagesPerHour: number) {
  const totalHours = DAYS.reduce((s, d) => {
    const shift = shifts[d] || {};
    return s + shiftHours(shift.start || '', shift.finish || '');
  }, 0);
  const totalWages = Math.round(totalHours * wagesPerHour * 100) / 100;
  return { totalHours: Math.round(totalHours * 100) / 100, totalWages };
}

function buildShifts(raw: Record<string, { start?: string; finish?: string }>) {
  const shifts: Record<string, { start: string; finish: string; hours: number }> = {};
  for (const day of DAYS) {
    const s = raw[day]?.start || '';
    const f = raw[day]?.finish || '';
    shifts[day] = { start: s, finish: f, hours: shiftHours(s, f) };
  }
  return shifts;
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const weekStart  = searchParams.get('weekStart');
  const employeeId = searchParams.get('employeeId');
  const dateFrom   = searchParams.get('dateFrom');
  const dateTo     = searchParams.get('dateTo');
  const query: any = {};
  if (weekStart)  query.weekStart  = weekStart;
  if (employeeId) query.employeeId = employeeId;
  if (dateFrom || dateTo) {
    query.weekStart = {};
    if (dateFrom) query.weekStart.$gte = dateFrom;
    if (dateTo)   query.weekStart.$lte = dateTo;
  }
  const timesheets = await Timesheet.find(query).sort({ weekStart: -1, employeeName: 1 });
  return NextResponse.json(timesheets);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await connectDB();
    const body = await req.json();
    const { employeeId, weekStart, shifts: rawShifts = {}, notes } = body;
    if (!employeeId || !weekStart) return NextResponse.json({ error: 'employeeId and weekStart are required' }, { status: 400 });

    const employee = await Employee.findById(employeeId);
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    const shifts = buildShifts(rawShifts);
    const { totalHours, totalWages } = calcTotals(rawShifts, employee.wagesPerHour);

    const timesheet = await Timesheet.findOneAndUpdate(
      { employeeId, weekStart },
      { employeeId, weekStart, employeeName: employee.name, wagesPerHour: employee.wagesPerHour, shifts, totalHours, totalWages, notes: notes || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json(timesheet, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
