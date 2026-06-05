'use client';
import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Save, Trash2, CheckCircle, Download, DollarSign, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type DayShift = { start: string; finish: string };
type ShiftEdits = Record<string, Record<string, DayShift>>;

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().split('T')[0];
}
function addWeeks(ds: string, w: number): string {
  const d = new Date(ds); d.setDate(d.getDate() + w * 7); return d.toISOString().split('T')[0];
}
function fmtRange(ws: string): string {
  const s = new Date(ws + 'T12:00:00'); const e = new Date(ws + 'T12:00:00'); e.setDate(e.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  return `${f(s)} – ${f(e)}`;
}
function getDayDates(ws: string): string[] {
  return DAYS.map((_, i) => {
    const d = new Date(ws + 'T12:00:00'); d.setDate(d.getDate() + i);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  });
}

/** Decimal hours from HH:MM start/finish. Handles midnight crossover. */
function shiftHours(start: string, finish: string): number {
  if (!start || !finish) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [fh, fm] = finish.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(fh) || isNaN(fm)) return 0;
  let diff = (fh * 60 + fm) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return Math.round(diff / 60 * 100) / 100;
}

function fmtHours(h: number): string {
  if (h === 0) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// ── CSV Export ──────────────────────────────────────────────────────────────
function buildCSVRows(timesheets: any[]) {
  const header = [
    'Employee', 'Week Start',
    'Mon Start', 'Mon Finish', 'Mon Hours',
    'Tue Start', 'Tue Finish', 'Tue Hours',
    'Wed Start', 'Wed Finish', 'Wed Hours',
    'Thu Start', 'Thu Finish', 'Thu Hours',
    'Fri Start', 'Fri Finish', 'Fri Hours',
    'Sat Start', 'Sat Finish', 'Sat Hours',
    'Sun Start', 'Sun Finish', 'Sun Hours',
    'Total Hours', 'Rate ($/hr)', 'Total Wages', 'Status', 'Paid', 'Paid On',
  ];
  const rows = timesheets.map(ts => {
    const dayCols: (string | number)[] = [];
    DAYS.forEach(d => {
      const shift = ts.shifts?.[d] || {};
      dayCols.push(shift.start || '', shift.finish || '', (shift.hours ?? 0).toFixed(2));
    });
    return [
      ts.employeeName, ts.weekStart,
      ...dayCols,
      ts.totalHours.toFixed(2), ts.wagesPerHour.toFixed(2), ts.totalWages.toFixed(2),
      ts.status, ts.paid ? 'Yes' : 'No',
      ts.paidAt ? new Date(ts.paidAt).toLocaleDateString('en-AU') : '',
    ];
  });
  return [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCSV(timesheets: any[], label: string) {
  const csv  = buildCSVRows(timesheets);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `timesheets-${label}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function downloadEmployeeCSV(employee: any, ts: any) {
  if (!ts) return;
  downloadCSV([ts], `${employee.name.replace(/\s+/g, '-')}-${ts.weekStart}`);
}

type ViewMode = 'weekly' | 'range';

export default function TimesheetsPage() {
  const [viewMode, setViewMode]         = useState<ViewMode>('weekly');
  const [weekStart, setWeekStart]       = useState(getMondayOfWeek(new Date()));
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [employees, setEmployees]       = useState<any[]>([]);
  const [timesheets, setTimesheets]     = useState<Record<string, any>>({});
  const [rangeTS, setRangeTS]           = useState<any[]>([]);
  const [edits, setEdits]               = useState<ShiftEdits>({});
  const [saving, setSaving]             = useState<Record<string, boolean>>({});
  const [loading, setLoading]           = useState(true);
  const [empFilter, setEmpFilter]       = useState('all');

  const timeInp: React.CSSProperties = {
    width: '100%', background: 'white', border: '1px solid var(--stone-light)',
    borderRadius: '6px', padding: '4px 6px', fontSize: '12px', textAlign: 'center',
    color: 'var(--brown-dark)', outline: 'none', fontFamily: 'Outfit, sans-serif',
    boxSizing: 'border-box',
  };
  const dateInp: React.CSSProperties = {
    background: 'white', border: '1px solid var(--stone-light)', borderRadius: '8px',
    padding: '7px 10px', fontSize: '13px', color: 'var(--brown-dark)',
    outline: 'none', fontFamily: 'Outfit, sans-serif',
  };

  const emptyShifts = (): Record<string, DayShift> => {
    const s: Record<string, DayShift> = {};
    DAYS.forEach(d => { s[d] = { start: '', finish: '' }; });
    return s;
  };

  const loadWeekly = useCallback(async () => {
    setLoading(true);
    const [empRes, tsRes] = await Promise.all([
      fetch('/api/employees').then(r => r.json()),
      fetch(`/api/timesheets?weekStart=${weekStart}`).then(r => r.json()),
    ]);
    const emps = Array.isArray(empRes) ? empRes.filter((e: any) => e.isActive) : [];
    setEmployees(emps);
    const tsMap: Record<string, any> = {};
    const editMap: ShiftEdits = {};
    if (Array.isArray(tsRes)) {
      tsRes.forEach((ts: any) => {
        tsMap[ts.employeeId] = ts;
        editMap[ts.employeeId] = {};
        DAYS.forEach(d => {
          editMap[ts.employeeId][d] = {
            start:  ts.shifts?.[d]?.start  || '',
            finish: ts.shifts?.[d]?.finish || '',
          };
        });
      });
    }
    emps.forEach((e: any) => {
      if (!editMap[e._id]) editMap[e._id] = emptyShifts();
    });
    setTimesheets(tsMap);
    setEdits(editMap);
    setLoading(false);
  }, [weekStart]);

  const loadRange = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    const ts = await fetch(`/api/timesheets?dateFrom=${dateFrom}&dateTo=${dateTo}`).then(r => r.json());
    setRangeTS(Array.isArray(ts) ? ts : []);
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => { if (viewMode === 'weekly') loadWeekly(); }, [viewMode, loadWeekly]);
  useEffect(() => { if (viewMode === 'range') loadRange(); },  [viewMode, loadRange]);

  const updateShift = (empId: string, day: string, field: 'start' | 'finish', val: string) =>
    setEdits(prev => ({ ...prev, [empId]: { ...prev[empId], [day]: { ...prev[empId]?.[day], [field]: val } } }));

  const calcRowTotal = (empId: string, rate: number) => {
    const hours = DAYS.reduce((s, d) => {
      const shift = edits[empId]?.[d] || { start: '', finish: '' };
      return s + shiftHours(shift.start, shift.finish);
    }, 0);
    return { hours: Math.round(hours * 100) / 100, wages: Math.round(hours * rate * 100) / 100 };
  };

  const saveRow = async (employee: any) => {
    setSaving(s => ({ ...s, [employee._id]: true }));
    const existing = timesheets[employee._id];
    const method   = existing ? 'PUT' : 'POST';
    const url      = existing ? `/api/timesheets/${existing._id}` : '/api/timesheets';
    const body     = existing
      ? { shifts: edits[employee._id], notes: existing.notes }
      : { employeeId: employee._id, weekStart, shifts: edits[employee._id] };
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { toast.success(`${employee.name} saved!`); await loadWeekly(); }
    else toast.error('Failed to save');
    setSaving(s => ({ ...s, [employee._id]: false }));
  };

  const approve = async (employee: any) => {
    const ts = timesheets[employee._id];
    if (!ts) return;
    await fetch(`/api/timesheets/${ts._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shifts: ts.shifts, status: 'approved' }) });
    toast.success('Approved!'); loadWeekly();
  };

  const togglePaid = async (ts: any, employee?: any) => {
    const newPaid = !ts.paid;
    const label   = employee?.name ?? ts.employeeName;
    if (newPaid && !confirm(`Mark ${label}'s wages ($${ts.totalWages.toFixed(2)}) as PAID?`)) return;
    const r = await fetch(`/api/timesheets/${ts._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shifts: ts.shifts, paid: newPaid }),
    });
    if (r.ok) { toast.success(newPaid ? '✅ Marked as paid!' : 'Unmarked'); viewMode === 'weekly' ? loadWeekly() : loadRange(); }
    else toast.error('Failed');
  };

  const deleteRow = async (employee: any) => {
    const ts = timesheets[employee._id];
    if (!ts || !confirm(`Clear ${employee.name}'s timesheet?`)) return;
    await fetch(`/api/timesheets/${ts._id}`, { method: 'DELETE' });
    toast.success('Cleared'); loadWeekly();
  };

  const weekTotals = employees.reduce((a, e) => {
    const { hours, wages } = calcRowTotal(e._id, e.wagesPerHour);
    return { hours: a.hours + hours, wages: a.wages + wages, unpaid: a.unpaid + (timesheets[e._id]?.paid ? 0 : wages) };
  }, { hours: 0, wages: 0, unpaid: 0 });

  const rangeTotals = rangeTS.reduce((a, ts) => ({
    hours:  a.hours  + ts.totalHours,
    wages:  a.wages  + ts.totalWages,
    unpaid: a.unpaid + (ts.paid ? 0 : ts.totalWages),
  }), { hours: 0, wages: 0, unpaid: 0 });

  const dayDates = getDayDates(weekStart);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brown-dark)' }}>Timesheets</h1>
          <p style={{ fontSize: '13px', color: 'var(--brown-mid)' }}>Enter start & finish times — hours are calculated automatically</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['weekly', 'range'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              style={{ padding: '8px 16px', borderRadius: '20px', border: '1.5px solid', borderColor: viewMode === m ? 'var(--red-korean)' : 'var(--stone-light)', background: viewMode === m ? 'var(--red-korean)' : 'white', color: viewMode === m ? 'white' : 'var(--brown-mid)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {m === 'weekly' ? <><Calendar size={12} /> Weekly</> : <><Filter size={12} /> Date Range</>}
            </button>
          ))}
        </div>
      </div>

      {/* Week navigator or date range */}
      {viewMode === 'weekly' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid var(--stone-light)', borderRadius: '12px', padding: '8px 14px' }}>
            <button onClick={() => setWeekStart(addWeeks(weekStart, -1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown-mid)', display: 'flex' }}><ChevronLeft size={18} /></button>
            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brown-dark)' }}>{fmtRange(weekStart)}</div>
              <div style={{ fontSize: '11px', color: 'var(--brown-mid)' }}>Week starting {weekStart}</div>
            </div>
            <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown-mid)', display: 'flex' }}><ChevronRight size={18} /></button>
          </div>
          <button onClick={() => setWeekStart(getMondayOfWeek(new Date()))} style={{ background: 'var(--stone-light)', color: 'var(--brown-dark)', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>This Week</button>
          <button onClick={() => { const ts = Object.values(timesheets); if (ts.length) downloadCSV(ts, weekStart); else toast.error('No data to download'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
            <Download size={13} /> Download CSV
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', background: 'white', border: '1px solid var(--stone-light)', borderRadius: '12px', padding: '14px 18px' }}>
          <span style={{ fontSize: '13px', color: 'var(--brown-mid)', fontWeight: 500 }}>From:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={dateInp} />
          <span style={{ fontSize: '13px', color: 'var(--brown-mid)', fontWeight: 500 }}>To:</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={dateInp} />
          <button onClick={loadRange} disabled={!dateFrom || !dateTo}
            style={{ background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Outfit, sans-serif', opacity: (!dateFrom || !dateTo) ? 0.5 : 1 }}>
            Search
          </button>
          {rangeTS.length > 0 && (
            <>
              <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={dateInp}>
                <option value="all">All Employees</option>
                {[...new Set(rangeTS.map((ts: any) => ts.employeeName))].sort().map(name => (
                  <option key={name as string} value={name as string}>{name as string}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const rows = empFilter === 'all' ? rangeTS : rangeTS.filter((ts: any) => ts.employeeName === empFilter);
                  const label = empFilter === 'all' ? `${dateFrom}-to-${dateTo}` : `${empFilter.replace(/\s+/g, '-')}-${dateFrom}-to-${dateTo}`;
                  downloadCSV(rows, label);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
                <Download size={13} /> {empFilter === 'all' ? 'Download All' : `Download ${empFilter}`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Summary cards */}
      {viewMode === 'weekly' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Active Staff',  value: employees.length,                   color: '#3b82f6', suffix: '' },
            { label: 'Total Hours',   value: weekTotals.hours.toFixed(1),        color: '#f97316', suffix: 'h' },
            { label: 'Total Wages',   value: `$${weekTotals.wages.toFixed(2)}`,  color: '#22c55e', suffix: '' },
            { label: 'Unpaid',        value: `$${weekTotals.unpaid.toFixed(2)}`, color: '#ef4444', suffix: '' },
          ].map(c => (
            <div key={c.label} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--stone-light)' }}>
              <div style={{ fontSize: '11px', color: 'var(--brown-mid)', marginBottom: '4px' }}>{c.label}</div>
              <div className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: c.color }}>{c.value}{c.suffix}</div>
            </div>
          ))}
        </div>
      ) : rangeTS.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Records',     value: rangeTS.length,                      color: '#3b82f6' },
            { label: 'Total Hours', value: `${rangeTotals.hours.toFixed(1)}h`,  color: '#f97316' },
            { label: 'Total Wages', value: `$${rangeTotals.wages.toFixed(2)}`,  color: '#22c55e' },
            { label: 'Unpaid',      value: `$${rangeTotals.unpaid.toFixed(2)}`, color: '#ef4444' },
          ].map(c => (
            <div key={c.label} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--stone-light)' }}>
              <div style={{ fontSize: '11px', color: 'var(--brown-mid)', marginBottom: '4px' }}>{c.label}</div>
              <div className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <p style={{ color: 'var(--brown-mid)' }}>Loading…</p> :

      /* ── WEEKLY VIEW ─────────────────────────────────────────────────────── */
      viewMode === 'weekly' ? (
        employees.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '14px', padding: '48px', textAlign: 'center', border: '1px solid var(--stone-light)', color: 'var(--brown-mid)' }}>
            No active employees. <a href="/admin/employees" style={{ color: 'var(--red-korean)' }}>Add employees first →</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {employees.map(employee => {
              const ts         = timesheets[employee._id];
              const { hours: rowHours, wages: rowWages } = calcRowTotal(employee._id, employee.wagesPerHour);
              const isApproved = ts?.status === 'approved';
              const isPaid     = ts?.paid === true;
              const locked     = isApproved || isPaid;

              return (
                <div key={employee._id} style={{ background: 'white', borderRadius: '16px', border: `1.5px solid ${isPaid ? '#22c55e' : isApproved ? '#3b82f6' : 'var(--stone-light)'}`, overflow: 'hidden' }}>
                  {/* Row header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: isPaid ? '#f0fdf4' : isApproved ? '#eff6ff' : '#f9f5f0', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brown-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--gold)' }}>
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brown-dark)' }}>{employee.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brown-mid)' }}>{employee.role || 'Staff'} · ${employee.wagesPerHour.toFixed(2)}/hr</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>{fmtHours(rowHours)}</div>
                        <div className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: isPaid ? '#16a34a' : '#22c55e' }}>${rowWages.toFixed(2)}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {!locked && (
                          <button onClick={() => saveRow(employee)} disabled={saving[employee._id]}
                            style={{ padding: '6px 10px', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Save size={12} /> {saving[employee._id] ? '…' : 'Save'}
                          </button>
                        )}
                        {ts && !isApproved && !isPaid && (
                          <button onClick={() => approve(employee)}
                            style={{ padding: '6px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle size={12} /> Approve
                          </button>
                        )}
                        {ts && (
                          <button onClick={() => togglePaid(ts, employee)}
                            style={{ padding: '6px 10px', background: isPaid ? '#f0fdf4' : '#fef9c3', color: isPaid ? '#16a34a' : '#854d0e', border: `1.5px solid ${isPaid ? '#22c55e' : '#ca8a04'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Outfit, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <DollarSign size={12} /> {isPaid ? '✓ Paid' : 'Mark Paid'}
                          </button>
                        )}
                        {ts && (
                          <button onClick={() => downloadEmployeeCSV(employee, ts)} title="Download this employee's timesheet"
                            style={{ padding: '6px 8px', background: 'none', border: '1px solid var(--stone-light)', borderRadius: '8px', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                            <Download size={12} />
                          </button>
                        )}
                        {ts && !isPaid && (
                          <button onClick={() => deleteRow(employee)}
                            style={{ padding: '6px 8px', background: 'none', border: '1px solid var(--stone-light)', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Day columns — start & finish inputs */}
                  <div style={{ padding: '14px 18px', overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(80px, 1fr))', gap: '8px', minWidth: '580px' }}>
                      {DAYS.map((day, i) => {
                        const shift = edits[employee._id]?.[day] || { start: '', finish: '' };
                        const hrs   = shiftHours(shift.start, shift.finish);
                        const hasShift = shift.start && shift.finish;
                        return (
                          <div key={day} style={{ textAlign: 'center', padding: '6px 4px', borderRadius: '8px', background: hasShift ? '#fdf0ee' : '#f9f5f0', border: `1px solid ${hasShift ? 'var(--red-korean)' : 'var(--stone-light)'}` }}>
                            {/* Day label */}
                            <div style={{ fontSize: '10px', fontWeight: 700, color: hasShift ? 'var(--red-korean)' : 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1px' }}>{DAY_LABELS[i]}</div>
                            <div style={{ fontSize: '9px', color: 'var(--brown-mid)', marginBottom: '6px' }}>{dayDates[i]}</div>

                            {/* Start time */}
                            <div style={{ marginBottom: '3px' }}>
                              <div style={{ fontSize: '8px', fontWeight: 600, color: 'var(--brown-mid)', marginBottom: '2px', textTransform: 'uppercase' }}>Start</div>
                              <input
                                type="time"
                                value={shift.start}
                                onChange={e => updateShift(employee._id, day, 'start', e.target.value)}
                                disabled={locked}
                                style={{ ...timeInp, borderColor: hasShift ? 'var(--red-korean)' : 'var(--stone-light)', opacity: locked ? 0.65 : 1 }}
                              />
                            </div>

                            {/* Finish time */}
                            <div style={{ marginBottom: '5px' }}>
                              <div style={{ fontSize: '8px', fontWeight: 600, color: 'var(--brown-mid)', marginBottom: '2px', textTransform: 'uppercase' }}>Finish</div>
                              <input
                                type="time"
                                value={shift.finish}
                                onChange={e => updateShift(employee._id, day, 'finish', e.target.value)}
                                disabled={locked}
                                style={{ ...timeInp, borderColor: hasShift ? 'var(--red-korean)' : 'var(--stone-light)', opacity: locked ? 0.65 : 1 }}
                              />
                            </div>

                            {/* Calculated hours & pay */}
                            <div style={{ fontSize: '10px', fontWeight: 700, color: hasShift ? 'var(--red-korean)' : 'var(--brown-mid)' }}>
                              {hasShift ? fmtHours(hrs) : '—'}
                            </div>
                            {hasShift && (
                              <div style={{ fontSize: '9px', color: '#22c55e', fontWeight: 600 }}>
                                ${(hrs * employee.wagesPerHour).toFixed(2)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {ts?.paidAt && <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '10px' }}>✅ Paid on {new Date(ts.paidAt).toLocaleDateString('en-AU', { dateStyle: 'medium' })}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) :

      /* ── DATE RANGE VIEW ────────────────────────────────────────────────── */
      (
        rangeTS.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '14px', padding: '48px', textAlign: 'center', border: '1px solid var(--stone-light)', color: 'var(--brown-mid)' }}>
            {dateFrom && dateTo ? 'No timesheets found for this range.' : 'Select a date range and click Search.'}
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--stone-light)', overflow: 'hidden' }}>
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
                <thead style={{ background: '#f9f5f0' }}>
                  <tr>
                    {['Employee', 'Week', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Total Hours', 'Rate', 'Wages', 'Status', 'Paid', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rangeTS.filter((ts: any) => empFilter === 'all' || ts.employeeName === empFilter).map(ts => (
                    <tr key={ts._id} style={{ borderTop: '1px solid var(--stone-light)', background: ts.paid ? '#f0fdf4' : 'white' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 500, color: 'var(--brown-dark)', whiteSpace: 'nowrap' }}>{ts.employeeName}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--brown-mid)', fontSize: '11px', whiteSpace: 'nowrap' }}>{fmtRange(ts.weekStart)}</td>
                      {DAYS.map(d => {
                        const shift = ts.shifts?.[d] || {};
                        const h = shift.hours || 0;
                        return (
                          <td key={d} style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {shift.start && shift.finish ? (
                              <div style={{ fontSize: '10px', lineHeight: 1.4 }}>
                                <div style={{ color: 'var(--brown-dark)', fontWeight: 500 }}>{shift.start}</div>
                                <div style={{ color: 'var(--brown-mid)' }}>{shift.finish}</div>
                                <div style={{ color: 'var(--red-korean)', fontWeight: 700, fontSize: '11px' }}>{fmtHours(h)}</div>
                              </div>
                            ) : <span style={{ color: 'var(--stone-light)', fontSize: '11px' }}>—</span>}
                          </td>
                        );
                      })}
                      <td style={{ padding: '10px 10px', color: 'var(--brown-dark)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtHours(ts.totalHours)}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--brown-mid)', whiteSpace: 'nowrap' }}>${ts.wagesPerHour.toFixed(2)}/hr</td>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: '#22c55e', whiteSpace: 'nowrap' }}>${ts.totalWages.toFixed(2)}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '6px', fontWeight: 600, background: ts.status === 'approved' ? '#eff6ff' : '#f9f5f0', color: ts.status === 'approved' ? '#1d4ed8' : '#6b7280', whiteSpace: 'nowrap' }}>{ts.status}</span>
                      </td>
                      <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                        {ts.paid
                          ? <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>✅ {ts.paidAt ? new Date(ts.paidAt).toLocaleDateString('en-AU', { dateStyle: 'short' }) : 'Paid'}</span>
                          : <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>⏳ Unpaid</span>}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <button onClick={() => togglePaid(ts)}
                          style={{ padding: '5px 10px', background: ts.paid ? '#f0fdf4' : '#fef9c3', color: ts.paid ? '#16a34a' : '#854d0e', border: `1px solid ${ts.paid ? '#22c55e' : '#ca8a04'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Outfit, sans-serif', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {ts.paid ? '✓ Paid' : 'Mark Paid'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
