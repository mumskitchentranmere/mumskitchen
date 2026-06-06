'use client';
import { useEffect, useState } from 'react';
import { StarRating } from '@/components/reviews/StarRating';
import { CheckCircle, XCircle, Star, Trash2, MessageSquare, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:  { bg: '#fef3c7', color: '#92400e' },
  approved: { bg: '#f0fdf4', color: '#166534' },
  rejected: { bg: '#fef2f2', color: '#991b1b' },
};

export default function AdminReviewsPage() {
  const [reviews, setReviews]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<'all'|'pending'|'approved'|'rejected'>('pending');
  const [replyId, setReplyId]     = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [stats, setStats]         = useState<any>({});

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (filter !== 'all') params.set('status', filter);
    const res  = await fetch(`/api/reviews?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setReviews(data.reviews || []);
    setStats(data.stats || {});
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const action = async (id: string, act: string, extra?: any) => {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act, ...extra }),
    });
    if (res.ok) { toast.success(`Review ${act}d`); load(); }
    else toast.error('Action failed');
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
    toast.success('Deleted'); load();
  };

  const submitReply = async (id: string) => {
    if (!replyText.trim()) { toast.error('Reply cannot be empty'); return; }
    await action(id, 'reply', { reply: replyText });
    setReplyId(null); setReplyText('');
  };

  const statCards = [
    { label: 'Pending',  value: reviews.filter(r => r.status === 'pending').length,  color: '#f59e0b' },
    { label: 'Approved', value: reviews.filter(r => r.status === 'approved').length, color: '#22c55e' },
    { label: 'Avg Rating', value: stats.avgRating ? stats.avgRating.toFixed(1) + ' ★' : '–', color: '#C8922A' },
    { label: 'Total', value: stats.total || 0, color: '#3b82f6' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brown-dark)' }}>Reviews</h1>
        <p style={{ fontSize: '13px', color: 'var(--brown-mid)' }}>Moderate, reply to, and feature customer reviews</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '12px', marginBottom: '24px' }}>
        {statCards.map(c => (
          <div key={c.label} style={{ background: 'white', borderRadius: '12px', padding: '14px', border: '1px solid var(--stone-light)' }}>
            <div style={{ fontSize: '11px', color: 'var(--brown-mid)', marginBottom: '4px' }}>{c.label}</div>
            <div className="font-display" style={{ fontSize: '26px', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 16px', borderRadius: '20px', border: '1.5px solid', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textTransform: 'capitalize', transition: 'all 0.15s', borderColor: filter === f ? 'var(--red-korean)' : 'var(--stone-light)', background: filter === f ? 'var(--red-korean)' : 'white', color: filter === f ? 'white' : 'var(--brown-mid)' }}>
            {f === 'pending' ? `⏳ Pending` : f === 'approved' ? `✅ Approved` : f === 'rejected' ? `❌ Rejected` : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: '14px', height: '120px' }} />)}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '14px', padding: '60px', textAlign: 'center', border: '1px solid var(--stone-light)', color: 'var(--brown-mid)' }}>
          No {filter !== 'all' ? filter : ''} reviews found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reviews.map(r => (
            <div key={r._id} style={{ background: 'white', borderRadius: '16px', padding: '18px', border: '1px solid var(--stone-light)' }}>
              {/* Review header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `hsl(${r.customerName?.charCodeAt(0) * 7 % 360},50%,45%)`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                    {r.customerName?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brown-dark)' }}>{r.customerName}</span>
                      {r.verified && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '10px', color: '#16a34a', background: '#f0fdf4', padding: '2px 6px', borderRadius: '6px' }}><ShieldCheck size={9} />Verified</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--brown-mid)' }}>{r.customerEmail} · {new Date(r.createdAt).toLocaleDateString('en-AU')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StarRating rating={r.rating} size={13} />
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', fontWeight: 600, ...STATUS_COLOR[r.status] }}>{r.status}</span>
                  {r.type === 'dish' && <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '8px' }}>Dish review</span>}
                </div>
              </div>

              {/* Content */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>{r.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--brown-mid)', lineHeight: 1.6 }}>{r.body}</div>
                {r.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {r.tags.map((t: string) => <span key={t} style={{ fontSize: '11px', background: 'var(--stone-light)', padding: '2px 8px', borderRadius: '8px', color: 'var(--brown-mid)' }}>{t}</span>)}
                  </div>
                )}
              </div>

              {/* Existing admin reply */}
              {r.adminReply && (
                <div style={{ background: '#faf7f2', borderLeft: '3px solid var(--gold)', padding: '10px 12px', borderRadius: '0 8px 8px 0', marginBottom: '12px', fontSize: '13px', color: 'var(--brown-dark)' }}>
                  <strong>Your reply:</strong> {r.adminReply}
                </div>
              )}

              {/* Reply input */}
              {replyId === r._id && (
                <div style={{ marginBottom: '12px' }}>
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} placeholder="Write your reply to this review…"
                    style={{ width: '100%', background: '#faf7f2', border: '1.5px solid var(--stone-light)', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', fontFamily: 'Outfit, sans-serif', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button onClick={() => submitReply(r._id)} style={{ background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Post Reply</button>
                    <button onClick={() => setReplyId(null)} style={{ background: 'var(--stone-light)', color: 'var(--brown-dark)', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {r.status !== 'approved' && (
                  <button onClick={() => action(r._id, 'approve')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                    <CheckCircle size={13} /> Approve
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button onClick={() => action(r._id, 'reject')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                    <XCircle size={13} /> Reject
                  </button>
                )}
                <button onClick={() => action(r._id, r.featured ? 'unfeature' : 'feature')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #fde68a', background: r.featured ? '#fef3c7' : 'white', color: '#92400e', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  <Star size={13} fill={r.featured ? 'currentColor' : 'none'} /> {r.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button onClick={() => { setReplyId(r._id === replyId ? null : r._id); setReplyText(r.adminReply || ''); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--stone-light)', background: 'white', color: 'var(--brown-mid)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  <MessageSquare size={13} /> Reply
                </button>
                <button onClick={() => deleteReview(r._id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca', background: 'white', color: '#dc2626', fontSize: '12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', marginLeft: 'auto' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
