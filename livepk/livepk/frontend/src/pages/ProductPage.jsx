import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCartStore, useAuthStore } from '../store';
import ProductReviews from '../components/product/ProductReviews';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Login to save to wishlist'); return; }
    try {
      await api.post('/wishlist', { productId: product._id });
      toast.success('❤️ Added to wishlist!');
    } catch (err) {
      if (err.response?.status === 409) toast('Already in wishlist', { icon: '❤️' });
      else toast.error('Failed to add to wishlist');
    }
  };

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(r => { setProduct(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><div className="spinner" /></div>;
  if (!product) return <div className="main-content" style={{textAlign:'center',padding:'6rem 2rem'}}><h2>Product not found</h2><Link to="/" className="btn btn-primary" style={{marginTop:'1rem'}}>Go Home</Link></div>;

  const price = product.salePrice || product.price;
  const discountPct = product.salePrice ? Math.round(((product.price - product.salePrice)/product.price)*100) : 0;

  return (
    <div className="main-content container" style={{paddingBottom:'4rem',maxWidth:1000}}>
      <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'1.5rem',fontSize:'0.82rem',color:'#7BA897'}}>
        <Link to="/" style={{color:'#7BA897',textDecoration:'none'}}>Home</Link>
        <span>›</span><span style={{textTransform:'capitalize'}}>{product.category}</span>
        <span>›</span><span style={{color:'#E8F5F0'}}>{product.name}</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2.5rem',alignItems:'start'}}>
        <div>
          <div style={{aspectRatio:'1',background:'#0D1F19',borderRadius:'0.75rem',overflow:'hidden',position:'relative'}}>
            {product.thumbnail ? <img src={product.thumbnail} alt={product.name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:'5rem'}}>🛍️</div>}
            {discountPct>0 && <div style={{position:'absolute',top:12,left:12,background:'#ff4444',color:'#fff',fontWeight:700,fontSize:'0.8rem',padding:'0.25rem 0.6rem',borderRadius:'0.35rem',fontFamily:'monospace'}}>-{discountPct}%</div>}
          </div>
          {product.images?.length>0 && <div style={{display:'flex',gap:'0.5rem',marginTop:'0.75rem'}}>{product.images.slice(0,4).map((img,i)=><div key={i} style={{width:64,height:64,background:'#0D1F19',borderRadius:'0.4rem',overflow:'hidden',border:'1px solid rgba(0,194,124,0.2)',flexShrink:0}}><img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /></div>)}</div>}
        </div>

        <div>
          <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.75rem',flexWrap:'wrap'}}>
            <span className="badge badge-green" style={{textTransform:'capitalize'}}>{product.category}</span>
            {product.codAvailable && <span className="badge badge-gold">💵 COD</span>}
            {product.freeShipping && <span className="badge badge-green">🚚 Free Shipping</span>}
          </div>
          <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'1.6rem',fontWeight:700,lineHeight:1.3,marginBottom:'0.4rem'}}>{product.name}</h1>
          {product.nameUrdu && <div style={{fontSize:'1rem',color:'#7BA897',marginBottom:'0.75rem',direction:'rtl',fontFamily:'sans-serif'}}>{product.nameUrdu}</div>}

          <div style={{display:'flex',alignItems:'baseline',gap:'0.75rem',marginBottom:'1rem'}}>
            <span style={{fontSize:'1.8rem',fontWeight:800,color:'#00C27C',fontFamily:'Playfair Display,serif'}}>PKR {price?.toLocaleString()}</span>
            {product.salePrice && <span style={{fontSize:'1.1rem',textDecoration:'line-through',color:'#4A7A6A'}}>PKR {product.price?.toLocaleString()}</span>}
          </div>

          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.25rem'}}>
            <div>{[1,2,3,4,5].map(s=><span key={s} style={{color:s<=Math.round(product.rating||0)?'#F5A623':'#163028',fontSize:'1rem'}}>★</span>)}</div>
            <span style={{fontSize:'0.82rem',color:'#7BA897'}}>{product.rating?.toFixed(1)||'0'} ({product.reviewCount||0}) · {product.totalSold||0} sold</span>
          </div>

          <div style={{display:'flex',gap:'0.75rem',alignItems:'center',background:'#0D1F19',border:'1px solid rgba(0,194,124,0.15)',borderRadius:'0.5rem',padding:'0.75rem',marginBottom:'1.25rem'}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'#00C27C',color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}}>{product.seller?.name?.charAt(0)}</div>
            <div>
              <div style={{fontWeight:600,fontSize:'0.88rem'}}>{product.seller?.sellerProfile?.storeName||product.seller?.name}</div>
              <div style={{fontSize:'0.75rem',color:'#7BA897'}}>📍 {product.seller?.city} · ⭐ {product.seller?.sellerProfile?.rating?.toFixed(1)||'4.5'}</div>
            </div>
          </div>

          {product.variants?.map(v=>(
            <div key={v.name} style={{marginBottom:'1rem'}}>
              <div style={{fontSize:'0.82rem',fontWeight:600,marginBottom:'0.4rem',color:'#7BA897'}}>{v.name}</div>
              <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                {v.options?.map(opt=><button key={opt.value} onClick={()=>setSelectedVariant({name:v.name,value:opt.value})} style={{background:selectedVariant?.value===opt.value?'rgba(0,194,124,0.2)':'#0D1F19',border:`1px solid ${selectedVariant?.value===opt.value?'#00C27C':'rgba(0,194,124,0.2)'}`,color:selectedVariant?.value===opt.value?'#00C27C':'#7BA897',padding:'0.3rem 0.7rem',borderRadius:'0.35rem',fontSize:'0.82rem',cursor:'pointer'}}>{opt.value}</button>)}
              </div>
            </div>
          ))}

          <div style={{display:'flex',gap:'0.75rem',alignItems:'center',marginBottom:'1.25rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.4rem',background:'#0D1F19',border:'1px solid rgba(0,194,124,0.2)',borderRadius:'0.5rem',padding:'0.2rem 0.4rem'}}>
              <button onClick={()=>setQty(Math.max(1,qty-1))} style={{background:'#163028',border:'none',color:'#E8F5F0',width:28,height:28,borderRadius:'0.3rem',cursor:'pointer',fontSize:'1.1rem'}}>−</button>
              <span style={{minWidth:28,textAlign:'center',fontWeight:600}}>{qty}</span>
              <button onClick={()=>setQty(Math.min(product.stock||99,qty+1))} style={{background:'#163028',border:'none',color:'#E8F5F0',width:28,height:28,borderRadius:'0.3rem',cursor:'pointer',fontSize:'1.1rem'}}>+</button>
            </div>
            <span style={{fontSize:'0.8rem',color:'#4A7A6A'}}>{product.stock||0} in stock</span>
          </div>

          <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',marginBottom:'1.5rem'}}>
            <button className="btn btn-primary btn-lg" style={{flex:1,minWidth:150}} onClick={()=>{addItem(product,qty,selectedVariant);toast.success(`Added to cart!`);}}>🛒 Add to Cart</button>
            <Link to="/checkout" className="btn btn-outline btn-lg" style={{flex:1,minWidth:150}} onClick={()=>addItem(product,qty,selectedVariant)}>⚡ Buy Now</Link>
            <button
              onClick={handleWishlist}
              style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#ff6b6b', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
            >
              ❤️ Save to Wishlist
            </button>
            <a
              href={`https://wa.me/?text=Check out ${product?.name} on LivePK for PKR ${(product?.salePrice || product?.price)?.toLocaleString()}! ${window.location.href}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#25D366', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.5rem' }}
            >
              📱 Share on WhatsApp
            </a>
          </div>

          <div style={{background:'#0D1F19',borderRadius:'0.5rem',padding:'0.5rem 0.85rem'}}>
            {[['🚚','Delivery','2–5 days in major cities'],['💵','COD','Available nationwide'],['🔄','Returns','7-day easy returns']].map(([icon,title,desc])=>(
              <div key={title} style={{display:'flex',gap:'0.75rem',padding:'0.5rem 0',borderBottom:'1px solid rgba(0,194,124,0.08)'}}>
                <span>{icon}</span><div style={{fontSize:'0.83rem'}}><strong>{title}:</strong> <span style={{color:'#7BA897'}}>{desc}</span></div>
              </div>
            ))}
          </div>
          {product.influencerCommission>0 && <div style={{background:'rgba(245,166,35,0.08)',border:'1px solid rgba(245,166,35,0.2)',borderRadius:'0.5rem',padding:'0.7rem',marginTop:'1rem',fontSize:'0.8rem',color:'#F5A623'}}>🎥 Influencers earn <strong>{product.influencerCommission}%</strong> commission on this product</div>}
        </div>
      </div>

      <div className="card" style={{marginTop:'2rem'}}>
        <h3 style={{fontWeight:700,marginBottom:'1rem'}}>Product Description</h3>
        <p style={{color:'#7BA897',lineHeight:1.8,fontSize:'0.9rem'}}>{product.description}</p>
        {product.descriptionUrdu && <div style={{marginTop:'1rem',padding:'1rem',background:'#0D1F19',borderRadius:'0.5rem',direction:'rtl',color:'#7BA897',lineHeight:2,fontSize:'0.9rem',fontFamily:'sans-serif'}}>{product.descriptionUrdu}</div>}
        {product.aiQualityScore && <div style={{marginTop:'1rem',fontSize:'0.72rem',color:'#4A7A6A',fontFamily:'monospace'}}>🤖 AI Quality Score: {product.aiQualityScore}/100</div>}
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <ProductReviews productId={id} sellerId={product.seller?._id} />
      </div>
    </div>
  );
}
