import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';

const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Sialkot','Hyderabad','Gujranwala','Other'];
const PROVINCES = ['Punjab','Sindh','KPK','Balochistan','AJK','Gilgit-Baltistan'];

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [address, setAddress] = useState({
    name: user?.name || '', phone: user?.phone || '',
    address: '', city: user?.city || 'Lahore',
    province: 'Punjab', postalCode: '', landmark: ''
  });

  const subtotal = items.reduce((s,i) => s + ((i.product.salePrice || i.product.price) * i.quantity), 0);
  const shipping = subtotal >= 2000 ? 0 : 200;
  const total = Math.max(0, subtotal + shipping - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/validate', { code: couponCode, orderAmount: subtotal });
      const data = res.data.data;
      setCouponData(data);
      setDiscount(data.discount || 0);
      toast.success(`✅ Coupon applied! Saved PKR ${data.discount}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
      setCouponData(null);
      setDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        items: items.map(i => ({ productId: i.product._id, quantity: i.quantity, variant: i.variant })),
        shippingAddress: address,
        paymentMethod,
        couponId: couponData?.couponId
      });
      setPlacedOrder(res.data.data.order);
      clearCart();
      setStep(4);
      toast.success('Order placed! 🎉');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to place order.');
    }
    setLoading(false);
  };

  if (!items.length && !placedOrder) return (
    <div className="main-content" style={{ textAlign:'center', padding:'6rem 2rem' }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🛒</div>
      <h2 style={{ marginBottom:'0.5rem' }}>Cart is empty</h2>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Streams</button>
    </div>
  );

  return (
    <div className="main-content container" style={{ paddingBottom:'4rem', maxWidth:880 }}>
      <h1 style={S.pageTitle}>Checkout</h1>

      {step < 4 && (
        <div style={S.steps}>
          {[['1','Address'],['2','Payment'],['3','Confirm']].map(([n,label]) => (
            <React.Fragment key={n}>
              <div style={S.step}>
                <div style={{...S.dot, ...(parseInt(n)<=step ? S.dotActive : {})}}>
                  {parseInt(n)<step?'✓':n}
                </div>
                <span style={{...S.stepLabel,...(parseInt(n)===step?{color:'#00C27C'}:{})}}>{label}</span>
              </div>
              {n!=='3' && <div style={S.stepLine} />}
            </React.Fragment>
          ))}
        </div>
      )}

      <div style={S.layout}>
        <div style={S.formCol}>

          {/* ── STEP 1: ADDRESS ── */}
          {step===1 && (
            <div className="card">
              <h3 style={S.sectionHead}>📍 Delivery Address</h3>
              <div style={S.grid2}>
                <div className="form-group" style={{gridColumn:'span 2'}}>
                  <label className="form-label">Recipient Name *</label>
                  <input className="form-input" value={address.name} onChange={e=>setAddress({...address,name:e.target.value})} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input className="form-input" value={address.phone} onChange={e=>setAddress({...address,phone:e.target.value})} placeholder="03XXXXXXXXX" />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <select className="form-input form-select" value={address.city} onChange={e=>setAddress({...address,city:e.target.value})}>
                    {CITIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Province *</label>
                  <select className="form-input form-select" value={address.province} onChange={e=>setAddress({...address,province:e.target.value})}>
                    {PROVINCES.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input className="form-input" value={address.postalCode} onChange={e=>setAddress({...address,postalCode:e.target.value})} placeholder="54000" />
                </div>
                <div className="form-group" style={{gridColumn:'span 2'}}>
                  <label className="form-label">Street Address *</label>
                  <input className="form-input" value={address.address} onChange={e=>setAddress({...address,address:e.target.value})} placeholder="House #, Street, Area / Block" />
                </div>
                <div className="form-group" style={{gridColumn:'span 2'}}>
                  <label className="form-label">Nearby Landmark <span style={{color:'#4A7A6A'}}>(helps courier find you)</span></label>
                  <input className="form-input" value={address.landmark} onChange={e=>setAddress({...address,landmark:e.target.value})} placeholder="e.g., Near Habib Bank, Opposite City School" />
                </div>
              </div>
              <button className="btn btn-primary btn-lg" style={{marginTop:'1.5rem'}} onClick={() => {
                if (!address.name||!address.phone||!address.address) { toast.error('Fill required fields'); return; }
                setStep(2);
              }}>Continue to Payment →</button>
            </div>
          )}

          {/* ── STEP 2: PAYMENT ── */}
          {step===2 && (
            <div className="card">
              <h3 style={S.sectionHead}>💳 Choose Payment Method</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',marginBottom:'1.5rem'}}>
                {[
                  {value:'cod',   icon:'💵', label:'Cash on Delivery',   desc:'Pay cash when your package arrives. 100% safe.', badge:'Most Popular'},
                  {value:'jazzcash', icon:'📱', label:'JazzCash',         desc:'Instant payment via JazzCash mobile wallet.', badge:'5% Discount'},
                  {value:'easypaisa', icon:'💚', label:'Easypaisa',       desc:'Pay with Easypaisa wallet or mobile account.', badge:'5% Discount'},
                  {value:'bank_transfer', icon:'🏦', label:'Bank Transfer', desc:'Direct bank deposit. Slightly slower confirmation.', badge:null},
                ].map(pm => (
                  <label key={pm.value} style={{...S.payOption,...(paymentMethod===pm.value?S.payActive:{})}}>
                    <input type="radio" name="payment" value={pm.value} checked={paymentMethod===pm.value} onChange={()=>setPaymentMethod(pm.value)} style={{display:'none'}} />
                    <span style={{fontSize:'1.6rem'}}>{pm.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                        <span style={{fontWeight:600}}>{pm.label}</span>
                        {pm.badge && <span style={{fontSize:'0.65rem',background:'rgba(0,194,124,0.15)',color:'#00C27C',padding:'0.1rem 0.4rem',borderRadius:'2rem',fontFamily:'monospace',fontWeight:600}}>{pm.badge}</span>}
                      </div>
                      <div style={{fontSize:'0.78rem',color:'#7BA897',marginTop:'0.1rem'}}>{pm.desc}</div>
                    </div>
                    {paymentMethod===pm.value && <span style={{color:'#00C27C',fontSize:'1.2rem',fontWeight:700}}>✓</span>}
                  </label>
                ))}
              </div>

              {(paymentMethod==='jazzcash'||paymentMethod==='easypaisa') && (
                <div style={S.infoBox}>
                  <div style={{fontWeight:600,color:'#F5A623',marginBottom:'0.5rem'}}>📱 How to Pay</div>
                  <ol style={{paddingLeft:'1.1rem',fontSize:'0.84rem',color:'#7BA897',lineHeight:2.1}}>
                    <li>Open your {paymentMethod==='jazzcash'?'JazzCash':'Easypaisa'} app</li>
                    <li>Go to "Send Money" → "Mobile Account"</li>
                    <li>Enter number: <strong style={{color:'#00C27C',fontFamily:'monospace'}}>0333-0000000</strong></li>
                    <li>Amount: <strong style={{color:'#00C27C'}}>PKR {total.toLocaleString()}</strong></li>
                    <li>Use your order number as remarks</li>
                    <li>Save your transaction ID for confirmation</li>
                  </ol>
                </div>
              )}
              {paymentMethod==='bank_transfer' && (
                <div style={S.infoBox}>
                  <div style={{fontWeight:600,color:'#F5A623',marginBottom:'0.5rem'}}>🏦 Bank Account Details</div>
                  <div style={{fontSize:'0.85rem',color:'#7BA897',lineHeight:2.1}}>
                    <div>Bank: <strong style={{color:'#E8F5F0'}}>Meezan Bank Limited</strong></div>
                    <div>Title: <strong style={{color:'#E8F5F0'}}>Dikhaao (Pvt.) Ltd.</strong></div>
                    <div>Account: <strong style={{color:'#00C27C',fontFamily:'monospace'}}>0123456789012345</strong></div>
                    <div>IBAN: <strong style={{color:'#00C27C',fontFamily:'monospace'}}>PK36MEZN0001234567890123</strong></div>
                  </div>
                </div>
              )}

              <div style={{display:'flex',gap:'0.75rem',marginTop:'1.5rem'}}>
                <button className="btn btn-ghost" onClick={()=>setStep(1)}>← Back</button>
                <button className="btn btn-primary btn-lg" onClick={()=>setStep(3)}>Review Order →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: CONFIRM ── */}
          {step===3 && (
            <div className="card">
              <h3 style={S.sectionHead}>✅ Review & Place Order</h3>

              <div style={S.confirmBox}>
                <div style={S.confirmTitle}>📍 Delivery Address</div>
                <div style={{fontWeight:600}}>{address.name} · {address.phone}</div>
                <div style={{color:'#7BA897',fontSize:'0.88rem',marginTop:'0.2rem'}}>{address.address}, {address.city}, {address.province}</div>
                {address.landmark && <div style={{color:'#4A7A6A',fontSize:'0.8rem'}}>Near: {address.landmark}</div>}
                <button className="btn btn-ghost btn-sm" style={{marginTop:'0.5rem'}} onClick={()=>setStep(1)}>Edit</button>
              </div>

              <div style={S.confirmBox}>
                <div style={S.confirmTitle}>💳 Payment</div>
                <div style={{fontWeight:600}}>
                  {paymentMethod==='cod'?'💵 Cash on Delivery':paymentMethod==='jazzcash'?'📱 JazzCash':paymentMethod==='easypaisa'?'💚 Easypaisa':'🏦 Bank Transfer'}
                </div>
                {paymentMethod==='cod' && <div style={{fontSize:'0.8rem',color:'#7BA897',marginTop:'0.2rem'}}>You'll pay PKR {total.toLocaleString()} at the door</div>}
                <button className="btn btn-ghost btn-sm" style={{marginTop:'0.5rem'}} onClick={()=>setStep(2)}>Change</button>
              </div>

              <div style={S.confirmBox}>
                <div style={S.confirmTitle}>📦 Order Items</div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.4rem',marginTop:'0.25rem'}}>
                  {items.map(i => (
                    <div key={i.key} style={{display:'flex',justifyContent:'space-between',fontSize:'0.86rem',color:'#7BA897'}}>
                      <span>{i.product.name} × {i.quantity}</span>
                      <span style={{color:'#E8F5F0',fontWeight:500}}>PKR {((i.product.salePrice||i.product.price)*i.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Code */}
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#112219', borderRadius: '0.5rem', border: '1px solid rgba(0,194,124,0.15)' }}>
                <div style={{ fontSize: '0.82rem', color: '#7BA897', marginBottom: '0.5rem', fontWeight: 600 }}>🏷️ Have a coupon?</div>
                {couponData ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ color: '#00C27C', fontWeight: 700, fontFamily: 'monospace' }}>{couponData.code}</span>
                    <span style={{ color: '#00C27C', fontSize: '0.85rem' }}>-PKR {discount.toLocaleString()}</span>
                    <button onClick={() => { setCouponData(null); setDiscount(0); setCouponCode(''); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem' }}>✕ Remove</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      style={{ flex: 1, background: '#0D1F19', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.4rem', padding: '0.5rem 0.75rem', color: '#E8F5F0', fontSize: '0.88rem', fontFamily: 'DM Sans,sans-serif' }}
                    />
                    <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} style={{ background: '#00C27C', border: 'none', color: '#000', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{background:'#0D1F19',borderRadius:'0.6rem',padding:'1rem',marginTop:'1rem'}}>
                {[['Subtotal',`PKR ${subtotal.toLocaleString()}`],['Shipping',shipping===0?'FREE 🎉':`PKR ${shipping}`]].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:'0.88rem',color:'#7BA897',padding:'0.2rem 0'}}><span>{k}</span><span style={{color:v.includes('FREE')?'#00C27C':'inherit'}}>{v}</span></div>
                ))}
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00C27C' }}>
                    <span>Discount ({couponData?.code})</span>
                    <span>-PKR {discount.toLocaleString()}</span>
                  </div>
                )}
                <hr style={{border:'none',borderTop:'1px solid rgba(0,194,124,0.15)',margin:'0.5rem 0'}} />
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:'1rem'}}>
                  <span>Total</span><span style={{color:'#00C27C'}}>PKR {total.toLocaleString()}</span>
                </div>
              </div>

              <div style={{display:'flex',gap:'0.75rem',marginTop:'1.5rem'}}>
                <button className="btn btn-ghost" onClick={()=>setStep(2)}>← Back</button>
                <button className="btn btn-primary btn-lg" style={{flex:1}} onClick={handlePlaceOrder} disabled={loading}>
                  {loading ? '⏳ Placing...' : `🛒 Place Order — PKR ${total.toLocaleString()}`}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: SUCCESS ── */}
          {step===4 && placedOrder && (
            <div className="card" style={{textAlign:'center',padding:'3rem 2rem'}}>
              <div style={{fontSize:'4rem',marginBottom:'1rem',animation:'fadeUp 0.5s ease'}}>🎉</div>
              <h2 style={{fontFamily:'Playfair Display,serif',fontSize:'2rem',marginBottom:'0.5rem'}}>Order Placed!</h2>
              <p style={{color:'#7BA897',marginBottom:'2rem'}}>We'll call to confirm your order shortly.</p>
              <div style={{background:'#0D1F19',border:'1px solid rgba(0,194,124,0.3)',borderRadius:'0.75rem',padding:'1.25rem',marginBottom:'1.5rem',display:'inline-block'}}>
                <div style={{fontSize:'0.72rem',fontFamily:'monospace',letterSpacing:'0.1em',textTransform:'uppercase',color:'#7BA897',marginBottom:'0.3rem'}}>Order Number</div>
                <div style={{fontFamily:'monospace',fontSize:'1.3rem',color:'#00C27C',fontWeight:700}}>{placedOrder.orderNumber}</div>
              </div>
              <div style={S.infoBox}>
                <div style={{fontWeight:600,color:'#F5A623',marginBottom:'0.5rem'}}>📞 What Happens Next?</div>
                <div style={{fontSize:'0.85rem',color:'#7BA897',lineHeight:2,textAlign:'left'}}>
                  {paymentMethod==='cod'?(
                    <>1. Team calls within 2 hours to confirm<br/>2. Dispatched within 24 hours<br/>3. Delivered in 2–5 days (major cities)<br/>4. Pay PKR {placedOrder.totalAmount?.toLocaleString()} to courier on delivery</>
                  ):(
                    <>1. Payment verified within 2 hours<br/>2. Order dispatched within 24 hours<br/>3. Delivered in 2–5 days (major cities)</>
                  )}
                </div>
              </div>
              <div style={{display:'flex',gap:'0.75rem',marginTop:'2rem',justifyContent:'center',flexWrap:'wrap'}}>
                <button className="btn btn-primary" onClick={()=>navigate('/orders')}>Track My Order 📦</button>
                <button className="btn btn-ghost" onClick={()=>navigate('/')}>Continue Shopping</button>
              </div>
            </div>
          )}
        </div>

        {/* ── ORDER SUMMARY SIDEBAR ── */}
        {step < 4 && (
          <div style={{position:'sticky',top:80}}>
            <div className="card">
              <h4 style={{fontWeight:700,marginBottom:'1rem'}}>Your Order ({items.length} items)</h4>
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',marginBottom:'1rem'}}>
                {items.map(i=>(
                  <div key={i.key} style={{display:'flex',gap:'0.6rem',alignItems:'center'}}>
                    <div style={{width:42,height:42,background:'#0D1F19',borderRadius:'0.35rem',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',overflow:'hidden'}}>
                      {i.product.thumbnail?<img src={i.product.thumbnail} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />:'🛍️'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'0.8rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.product.name}</div>
                      <div style={{fontSize:'0.73rem',color:'#7BA897'}}>Qty: {i.quantity}</div>
                    </div>
                    <div style={{fontSize:'0.82rem',fontWeight:600,color:'#00C27C',flexShrink:0}}>PKR {((i.product.salePrice||i.product.price)*i.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <hr style={{border:'none',borderTop:'1px solid rgba(0,194,124,0.1)',marginBottom:'0.75rem'}} />
              <div style={{display:'flex',flexDirection:'column',gap:'0.3rem',fontSize:'0.86rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',color:'#7BA897'}}><span>Subtotal</span><span>PKR {subtotal.toLocaleString()}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',color:'#7BA897'}}><span>Shipping</span><span style={{color:shipping===0?'#00C27C':'inherit'}}>{shipping===0?'FREE':` PKR ${shipping}`}</span></div>
                <hr style={{border:'none',borderTop:'1px solid rgba(0,194,124,0.1)',margin:'0.25rem 0'}} />
                <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:'0.95rem'}}><span>Total</span><span style={{color:'#00C27C'}}>PKR {total.toLocaleString()}</span></div>
              </div>
              {shipping>0&&<div style={{marginTop:'0.6rem',fontSize:'0.72rem',color:'#4A7A6A',background:'rgba(0,194,124,0.05)',borderRadius:'0.35rem',padding:'0.4rem 0.6rem'}}>Add PKR {(2000-subtotal).toLocaleString()} more for FREE shipping</div>}
            </div>
            <div className="card card-sm" style={{marginTop:'0.75rem'}}>
              {[['✅','Secure Checkout'],['🚚','Nationwide COD'],['🔄','7-Day Easy Returns'],['📞','Order Confirmation Call']].map(([icon,label])=>(
                <div key={label} style={{display:'flex',gap:'0.6rem',padding:'0.3rem 0',fontSize:'0.8rem',color:'#7BA897'}}><span>{icon}</span><span>{label}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  pageTitle:{fontFamily:'Playfair Display,serif',fontSize:'2rem',fontWeight:700,marginBottom:'1.5rem',letterSpacing:'-0.5px'},
  steps:{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'2rem'},
  step:{display:'flex',alignItems:'center',gap:'0.5rem'},
  dot:{width:30,height:30,borderRadius:'50%',background:'#163028',border:'2px solid rgba(0,194,124,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.78rem',fontFamily:'monospace',fontWeight:700,color:'#7BA897'},
  dotActive:{background:'#00C27C',borderColor:'#00C27C',color:'#000'},
  stepLabel:{fontSize:'0.85rem',color:'#7BA897',fontWeight:500},
  stepLine:{flex:1,height:1,background:'rgba(0,194,124,0.2)',maxWidth:40},
  layout:{display:'grid',gridTemplateColumns:'1fr 280px',gap:'1.5rem',alignItems:'start'},
  formCol:{display:'flex',flexDirection:'column',gap:'1rem'},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.85rem'},
  sectionHead:{fontWeight:700,fontSize:'1.05rem',marginBottom:'1.25rem'},
  payOption:{display:'flex',gap:'0.85rem',alignItems:'center',background:'#0D1F19',border:'1px solid rgba(0,194,124,0.2)',borderRadius:'0.6rem',padding:'0.9rem 1rem',cursor:'pointer',transition:'all 0.15s'},
  payActive:{background:'rgba(0,194,124,0.1)',borderColor:'#00C27C'},
  infoBox:{background:'#0D1F19',border:'1px solid rgba(245,166,35,0.25)',borderRadius:'0.6rem',padding:'1rem 1.1rem',marginTop:'0.75rem'},
  confirmBox:{padding:'0.85rem 0',borderBottom:'1px solid rgba(0,194,124,0.08)'},
  confirmTitle:{fontSize:'0.7rem',fontFamily:'monospace',letterSpacing:'0.12em',textTransform:'uppercase',color:'#00C27C',marginBottom:'0.3rem'},
};
