'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { StarPicker } from './StarRating';
import { Send, X, CheckCircle, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_TAGS = [
  'Great food', 'Fast service', 'Good value', 'Authentic flavours',
  'Generous portions', 'Friendly staff', 'Clean & tidy', 'Will return',
  'Great for family', 'Best Korean in Adelaide',
];

interface ReviewFormProps {
  type?: 'restaurant' | 'dish';
  menuItemId?: string;
  menuItemName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ type = 'restaurant', menuItemId, menuItemName, onSuccess, onCancel }: ReviewFormProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    if (!title.trim()) { toast.error('Please add a title'); return; }
    if (body.trim().length < 10) { toast.error('Review must be at least 10 characters'); return; }
    if (!session && (!name.trim() || !email.trim())) { toast.error('Please enter your name and email'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, body, customerName: name, customerEmail: email, type, menuItemId, menuItemName, tags }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to submit'); setLoading(false); return; }
      setDone(true);
      onSuccess?.();
    } catch { toast.error('Something went wrong'); }
    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width: '100%', background: '#faf7f2', border: '1.5px solid var(--stone-light)',
    borderRadius: '12px', padding: '11px 14px', fontSize: '14px', color: 'var(--brown-dark)',
    outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box',
  };

  if (done) return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ width: '60px', height: '60px', background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <CheckCircle size={30} color="#2e7d32" />
      </div>
      <h3 className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '8px' }}>Thank You!</h3>
      <p style={{ fontSize: '14px', color: 'var(--brown-mid)', lineHeight: 1.6 }}>
        Your review has been submitted and is awaiting approval.<br />It will appear publicly once reviewed by our team.
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {onCancel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brown-dark)' }}>
            {type === 'dish' ? `Review: ${menuItemName}` : "Write a Review"}
          </h3>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown-mid)' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Star picker */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '12px', fontWeight: 500 }}>
          How would you rate your experience?
        </p>
        <StarPicker value={rating} onChange={setRating} size={36} />
        {rating > 0 && (
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginTop: '8px' }}>
            {RATING_LABELS[rating]}
          </p>
        )}
      </div>

      {/* Title */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Review Title *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Summarise your experience" maxLength={120} style={inp} />
      </div>

      {/* Body */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>
          Your Review * <span style={{ color: 'rgba(107,58,31,0.4)' }}>({body.length}/1000)</span>
        </label>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Tell others about the food, service, atmosphere..." maxLength={1000} rows={4}
          style={{ ...inp, resize: 'none' }} />
      </div>

      {/* Quick tags */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '8px' }}>Quick Tags (optional)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {QUICK_TAGS.map(tag => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}
              style={{ padding: '5px 12px', borderRadius: '20px', border: '1.5px solid', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', transition: 'all 0.15s', borderColor: tags.includes(tag) ? 'var(--red-korean)' : 'var(--stone-light)', background: tags.includes(tag) ? '#fdf0ee' : 'white', color: tags.includes(tag) ? 'var(--red-korean)' : 'var(--brown-mid)' }}>
              {tags.includes(tag) ? '✓ ' : ''}{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Name + email if not logged in */}
      {!session && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[['Your Name *', 'name', 'text', name, setName], ['Email *', 'email', 'email', email, setEmail]].map(([label, , type2, val, setter]: any) => (
            <div key={String(label)}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>{label}</label>
              <input type={type2} value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value)} style={inp} />
            </div>
          ))}
        </div>
      )}

      {session && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f0f9ff', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--red-korean)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
            {session.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span style={{ color: 'var(--brown-mid)' }}>Posting as <strong style={{ color: 'var(--brown-dark)' }}>{session.user?.name}</strong></span>
        </div>
      )}

      <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Send size={16} /> {loading ? 'Submitting…' : 'Submit Review'}
      </button>
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--brown-mid)', marginTop: '10px' }}>
        Reviews are moderated before appearing publicly.
      </p>
    </form>
  );
}
