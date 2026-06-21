'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Check, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name: '', role: '', wagesPerHour: '', phone: '', email: '', notes: '', isActive: true };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [form, setForm]           = useState<any>(EMPTY);
  const [saving, setSaving]       = useState(false);

  const inp: React.CSSProperties = { width: '100%', background: '#f9f5f0', border: '1px solid var(--stone-light)', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', color: 'var(--brown-dark)', outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' };

  const load = () => {
    fetch('/api/employees').then(r => r.json()).then(d => { setEmployees(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (e: any) => {
    setEditing(e);
    setForm({ ...e, wagesPerHour: e.wagesPerHour.toString() });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.wagesPerHour || isNaN(Number(form.wagesPerHour)) || Number(form.wagesPerHour) < 0) { toast.error('Enter a valid hourly wage'); return; }
    setSaving(true);
    const body = { ...form, wagesPerHour: parseFloat(form.wagesPerHour) };
    const url = editing ? `/api/employees/${editing._id}` : '/api/employees';
    const r = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { toast.error('Failed to save'); setSaving(false); return; }
    toast.success(editing ? 'Updated!' : 'Employee added!');
    setModal(false); setSaving(false); load();
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? Their timesheets will remain.`)) return;
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    toast.success('Deleted'); load();
  };

  const toggle = async (e: any) => {
    await fetch(`/api/employees/${e._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !e.isActive }) });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brown-dark)' }}>Employees</h1>
          <p style={{ fontSize: '13px', color: 'var(--brown-mid)' }}>{employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--red-korean)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: 600 }}>
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {loading ? <p style={{ color: 'var(--brown-mid)' }}>Loading…</p> : employees.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '14px', padding: '60px', textAlign: 'center', border: '1px solid var(--stone-light)' }}>
          <Users size={40} color="var(--stone-light)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--brown-mid)' }}>No employees yet. Add your first employee to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {employees.map(e => (
            <div key={e._id} style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', border: '1px solid var(--stone-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', opacity: e.isActive ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--stone-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: 'var(--brown-dark)', flexShrink: 0 }}>
                  {e.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brown-dark)' }}>{e.name}</div>
                  {e.role && <div style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>{e.role}</div>}
                  {e.phone && <div style={{ fontSize: '11px', color: 'var(--brown-mid)' }}>{e.phone}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--red-korean)' }}>${e.wagesPerHour.toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--brown-mid)' }}>per hour</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button onClick={() => toggle(e)} title={e.isActive ? 'Deactivate' : 'Activate'} style={{ padding: '6px 12px', background: e.isActive ? '#f0fdf4' : '#fef2f2', border: `1px solid ${e.isActive ? '#22c55e' : '#ef4444'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: e.isActive ? '#16a34a' : '#dc2626', fontFamily: 'Poppins, sans-serif' }}>
                    {e.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => openEdit(e)} style={{ padding: '7px', background: 'none', border: '1px solid var(--stone-light)', borderRadius: '8px', cursor: 'pointer', color: 'var(--brown-mid)' }}><Edit size={14} /></button>
                  <button onClick={() => remove(e._id, e.name)} style={{ padding: '7px', background: 'none', border: '1px solid var(--stone-light)', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setModal(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brown-dark)' }}>{editing ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="var(--brown-mid)" /></button>
            </div>

            {([['Full Name *', 'name', 'text'], ['Role / Position', 'role', 'text'], ['Phone', 'phone', 'tel'], ['Email', 'email', 'email']] as [string, string, string][]).map(([label, field, type]) => (
              <div key={field} style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>{label}</label>
                <input type={type} value={form[field]} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))} style={inp} />
              </div>
            ))}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Wages Per Hour (AUD) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-mid)', fontSize: '14px' }}>$</span>
                <input type="number" step="0.01" min="0" value={form.wagesPerHour} onChange={e => setForm((f: any) => ({ ...f, wagesPerHour: e.target.value }))} style={{ ...inp, paddingLeft: '24px' }} placeholder="0.00" />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} style={{ ...inp, resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: 'Poppins, sans-serif' }}>
                <Check size={15} />{saving ? 'Saving…' : 'Save Employee'}
              </button>
              <button onClick={() => setModal(false)} style={{ flex: 1, background: 'var(--stone-light)', color: 'var(--brown-dark)', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
