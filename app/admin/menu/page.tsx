'use client';
import { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, X, Check, Upload, Images, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
const EMPTY = { name:'', description:'', price:'', category:'snack', cuisine:'korean', tags:'', images:[] as string[], primaryImage:'', isAvailable:true, isFeatured:false, sizes:'' };
const CATS = ['snack','rice-bowl','noodle','bibimbap','soup','fried-chicken','side','drink','set-menu','bangladeshi-main','bangladeshi-snack','biryani','curry'];
export default function AdminMenuPage() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false); const [editing, setEditing] = useState<any>(null); const [form, setForm] = useState<any>(EMPTY); const [uploading, setUploading] = useState(false); const [syncing, setSyncing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const load = () => fetch('/api/menu').then(r=>r.json()).then(d=>{ setItems(Array.isArray(d)?d:[]); setLoading(false); });

  const syncEpos = async () => {
    setSyncing(true);
    try {
      const res  = await fetch('/api/epos/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); load(); }
      else toast.error(data.error || 'Sync failed');
    } catch { toast.error('Sync failed — check EPOSNOW_API_TOKEN in .env.local'); }
    setSyncing(false);
  };
  useEffect(()=>{ load(); },[]);
  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ ...item, price:item.price.toString(), tags:item.tags?.join(', ')||'', sizes:item.sizes?.map((s:any)=>`${s.label}:${s.price}`).join(', ')||'' }); setModal(true); };

  // Multi-image upload
  const handleImages = async (files: FileList) => {
    setUploading(true);
    const base64s: string[] = [];
    for (const f of Array.from(files)) {
      const b64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
      base64s.push(b64);
    }
    const r = await fetch('/api/upload', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ images:base64s }) });
    const data = await r.json();
    if (data.urls) {
      setForm((f:any) => ({ ...f, images:[...f.images, ...data.urls], primaryImage: f.primaryImage || data.urls[0] }));
      toast.success(`${data.urls.length} image(s) uploaded`);
    }
    setUploading(false);
  };

  const save = async () => {
    const sizes = form.sizes ? form.sizes.split(',').map((s:string) => { const [label, price] = s.trim().split(':'); return { label: label?.trim(), price: parseFloat(price) }; }).filter((s:any) => s.label && !isNaN(s.price)) : [];
    const body = { ...form, price: parseFloat(form.price), tags: form.tags.split(',').map((t:string)=>t.trim()).filter(Boolean), sizes, primaryImage: form.images[0] || form.primaryImage };
    const url = editing ? `/api/menu/${editing._id}` : '/api/menu';
    const r = await fetch(url, { method: editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (!r.ok) { toast.error('Failed to save'); return; }
    toast.success(editing?'Updated!':'Added!'); setModal(false); load();
  };

  const remove = async (id:string) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/menu/${id}`, { method:'DELETE' }); toast.success('Deleted'); load();
  };
  const toggle = async (item:any) => { await fetch(`/api/menu/${item._id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ isAvailable:!item.isAvailable }) }); load(); };

  const inp: React.CSSProperties = { width:'100%', background:'#f9f5f0', border:'1px solid var(--stone-light)', borderRadius:'10px', padding:'9px 12px', fontSize:'13px', color:'var(--brown-dark)', outline:'none', fontFamily:'Outfit, sans-serif', boxSizing:'border-box' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div><h1 className="font-display" style={{ fontSize:'28px', fontWeight:700, color:'var(--brown-dark)' }}>Menu Items</h1><p style={{ fontSize:'13px', color:'var(--brown-mid)' }}>{items.length} items · {items.filter(i=>i.syncedFromEpos).length} from Epos Now</p></div>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={syncEpos} disabled={syncing} style={{ display:'flex', alignItems:'center', gap:'6px', background:'var(--brown-dark)', color:'white', border:'none', borderRadius:'12px', padding:'10px 16px', cursor:syncing?'wait':'pointer', fontFamily:'Outfit, sans-serif', fontSize:'13px', fontWeight:500, opacity:syncing?0.7:1 }}>
            <RefreshCw size={14} style={{ animation:syncing?'spin 1s linear infinite':'none' }}/>{syncing?'Syncing…':'Sync from Epos'}
          </button>
          <button onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:'6px', background:'var(--red-korean)', color:'white', border:'none', borderRadius:'12px', padding:'10px 20px', cursor:'pointer', fontFamily:'Outfit, sans-serif', fontSize:'13px', fontWeight:600 }}><Plus size={15}/>Add Item</button>
        </div>
      </div>

      {loading?<p style={{color:'var(--brown-mid)'}}>Loading…</p>:(
        <div className="table-scroll" style={{ background:'white', borderRadius:'14px', border:'1px solid var(--stone-light)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'600px' }}>
            <thead style={{ background:'#f9f5f0' }}>
              <tr>{['Item','Category','Price','Images','Available','Actions'].map(h=><th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:'11px', fontWeight:600, color:'var(--brown-mid)', letterSpacing:'0.06em', textTransform:'uppercase' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.map(item=>(
                <tr key={item._id} style={{ borderTop:'1px solid var(--stone-light)' }}>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      {item.primaryImage&&<img src={item.primaryImage} alt={item.name} style={{ width:'40px', height:'40px', borderRadius:'8px', objectFit:'cover', flexShrink:0 }}/>}
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <span style={{ fontWeight:500, color:'var(--brown-dark)' }}>{item.name}</span>
                          {item.syncedFromEpos && <span style={{ fontSize:'9px', fontWeight:600, background:'#eff6ff', color:'#1d4ed8', padding:'2px 5px', borderRadius:'4px', letterSpacing:'0.04em', flexShrink:0 }}>EPOS</span>}
                        </div>
                        <div style={{ fontSize:'11px', color:'var(--brown-mid)', maxWidth:'260px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 14px', color:'var(--brown-mid)', textTransform:'capitalize' }}>{item.category}</td>
                  <td style={{ padding:'12px 14px', fontWeight:700, color:'var(--red-korean)' }}>${item.price.toFixed(2)}</td>
                  <td style={{ padding:'12px 14px' }}><span style={{ display:'flex', alignItems:'center', gap:'4px', color:'var(--brown-mid)', fontSize:'12px' }}><Images size={13}/>{item.images?.length||0} photo{item.images?.length!==1?'s':''}</span></td>
                  <td style={{ padding:'12px 14px' }}>
                    <button onClick={()=>toggle(item)} style={{ width:'38px', height:'22px', borderRadius:'11px', background:item.isAvailable?'#22c55e':'var(--stone-light)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
                      <div style={{ position:'absolute', top:'3px', left:item.isAvailable?'19px':'3px', width:'16px', height:'16px', borderRadius:'50%', background:'white', transition:'left 0.2s' }}/>
                    </button>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', gap:'4px' }}>
                      <button onClick={()=>openEdit(item)} style={{ padding:'6px', background:'none', border:'1px solid var(--stone-light)', borderRadius:'8px', cursor:'pointer', color:'var(--brown-mid)' }}><Edit size={13}/></button>
                      <button onClick={()=>remove(item._id)} style={{ padding:'6px', background:'none', border:'1px solid var(--stone-light)', borderRadius:'8px', cursor:'pointer', color:'#ef4444' }}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(44,26,14,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={()=>setModal(false)}>
          <div style={{ background:'white', borderRadius:'20px', padding:'24px', width:'100%', maxWidth:'560px', maxHeight:'90vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h2 className="font-display" style={{ fontSize:'20px', fontWeight:700, color:'var(--brown-dark)' }}>{editing?'Edit Item':'Add Menu Item'}</h2>
              <button onClick={()=>setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--brown-mid)' }}><X size={18}/></button>
            </div>

            {/* Multi-image uploader */}
            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'8px' }}>Food Images (multiple supported)</label>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'8px' }}>
                {form.images?.map((url: string, i: number) => (
                  <div key={i} style={{ position:'relative' }}>
                    <img src={url} alt="" style={{ width:'60px', height:'60px', borderRadius:'8px', objectFit:'cover', border: i===0?'2px solid var(--red-korean)':'2px solid var(--stone-light)' }}/>
                    <button onClick={()=>setForm((f:any)=>({...f, images:f.images.filter((_:string,j:number)=>j!==i), primaryImage:f.images.filter((_:string,j:number)=>j!==i)[0]||''}))} style={{ position:'absolute', top:'-6px', right:'-6px', width:'18px', height:'18px', borderRadius:'50%', background:'#ef4444', border:'none', cursor:'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px' }}>×</button>
                    {i===0&&<div style={{ position:'absolute', bottom:'-4px', left:'50%', transform:'translateX(-50%)', background:'var(--red-korean)', color:'white', fontSize:'8px', padding:'1px 4px', borderRadius:'3px', whiteSpace:'nowrap' }}>Main</div>}
                  </div>
                ))}
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e=>e.target.files&&handleImages(e.target.files)}/>
                <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{ width:'60px', height:'60px', borderRadius:'8px', border:'2px dashed var(--stone-light)', background:'#f9f5f0', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2px', color:'var(--brown-mid)', fontSize:'10px' }}>
                  {uploading?<span style={{ fontSize:'9px' }}>…</span>:<><Upload size={14}/><span>Upload</span></>}
                </button>
              </div>
              <p style={{ fontSize:'11px', color:'var(--brown-mid)' }}>First image = main display. Upload multiple photos of the same dish.</p>
            </div>

            {/* Or paste URL */}
            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'5px' }}>Or paste image URL</label>
              <div style={{ display:'flex', gap:'6px' }}>
                <input type="text" placeholder="https://..." id="img-url-inp" style={{...inp, flex:1}}/>
                <button onClick={()=>{ const v=(document.getElementById('img-url-inp') as HTMLInputElement)?.value; if(v) setForm((f:any)=>({...f,images:[...f.images,v],primaryImage:f.primaryImage||v})); (document.getElementById('img-url-inp') as HTMLInputElement).value=''; }} style={{ background:'var(--brown-dark)', color:'white', border:'none', borderRadius:'10px', padding:'9px 14px', cursor:'pointer', fontSize:'12px', fontFamily:'Outfit, sans-serif' }}>Add</button>
              </div>
            </div>

            {/* Form fields */}
            {([['Item Name','name','text'],['Description','description','text'],['Tags (comma separated — halal, spicy, vegan, vegetarian, gluten-free)','tags','text'],['Sizes (e.g. Small:19, Large:29 — leave blank if no sizes)','sizes','text']] as [string,string,string][]).map(([label,field,type])=>(
              <div key={field} style={{ marginBottom:'14px' }}>
                <label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'5px' }}>{label}</label>
                {field==='description'?<textarea value={form[field]} onChange={e=>setForm((f:any)=>({...f,[field]:e.target.value}))} rows={2} style={{...inp,resize:'none'}}/>:<input type={type} value={form[field]} onChange={e=>setForm((f:any)=>({...f,[field]:e.target.value}))} style={inp}/>}
              </div>
            ))}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'14px' }}>
              <div><label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'5px' }}>Price (AUD)</label><input type="number" step="0.01" value={form.price} onChange={e=>setForm((f:any)=>({...f,price:e.target.value}))} style={inp}/></div>
              <div><label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'5px' }}>Category</label><select value={form.category} onChange={e=>setForm((f:any)=>({...f,category:e.target.value}))} style={inp}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'5px' }}>Cuisine</label><select value={form.cuisine} onChange={e=>setForm((f:any)=>({...f,cuisine:e.target.value}))} style={inp}>{['korean','bangladeshi','both'].map(c=><option key={c}>{c}</option>)}</select></div>
            </div>
            <div style={{ display:'flex', gap:'20px', marginBottom:'20px' }}>
              {[['isAvailable','Available'],['isFeatured','Featured on Homepage']].map(([field,label])=>(
                <label key={field} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', cursor:'pointer', color:'var(--brown-dark)' }}>
                  <input type="checkbox" checked={form[field]} onChange={e=>setForm((f:any)=>({...f,[field]:e.target.checked}))} style={{ accentColor:'var(--red-korean)' }}/>{label}
                </label>
              ))}
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={save} style={{ flex:1, background:'var(--brown-dark)', color:'white', border:'none', borderRadius:'12px', padding:'12px', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'Outfit, sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}><Check size={15}/>Save Item</button>
              <button onClick={()=>setModal(false)} style={{ flex:1, background:'var(--stone-light)', color:'var(--brown-dark)', border:'none', borderRadius:'12px', padding:'12px', fontSize:'14px', fontWeight:500, cursor:'pointer', fontFamily:'Outfit, sans-serif' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
