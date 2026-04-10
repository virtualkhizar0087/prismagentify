import React, { useState, useEffect } from 'react';
import { reviewAPI, wishlistAPI } from '../../services/api';

const Stars = ({ rating, size = 16, interactive = false, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(star => (
        <span
          key={star}
          style={{
            fontSize: size,
            cursor: interactive ? 'pointer' : 'default',
            color: star <= (interactive ? (hover || rating) : rating) ? '#F59E0B' : '#D1D5DB',
            transition: 'color 0.1s'
          }}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange && onChange(star)}
        >★</span>
      ))}
    </div>
  );
};

const ProductReviews = ({ productId, sellerId }) => {
  const [reviews, setReviews] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterRating, setFilterRating] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [page, filterRating]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewAPI.getForProduct(productId, {
        page, limit: 5,
        ...(filterRating && { rating: filterRating })
      });
      setReviews(res.data.data);
      setTotal(res.data.total);
      setBreakdown(res.data.breakdown || []);
    } catch (err) {
      console.error('Reviews error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const res = await reviewAPI.create({ productId, ...form });
      setSubmitMsg('✅ Review submitted!');
      setShowForm(false);
      setForm({ rating: 5, title: '', comment: '' });
      fetchReviews();
    } catch (err) {
      setSubmitMsg(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingCount = (r) => breakdown.find(b => b._id === r)?.count || 0;
  const totalReviews = breakdown.reduce((sum, b) => sum + b.count, 0);
  const avgRating = totalReviews > 0
    ? breakdown.reduce((sum, b) => sum + b._id * b.count, 0) / totalReviews
    : 0;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Customer Reviews</h2>

      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div style={styles.summary}>
          <div style={styles.avgBox}>
            <div style={styles.avgNum}>{avgRating.toFixed(1)}</div>
            <Stars rating={Math.round(avgRating)} size={20} />
            <div style={styles.avgCount}>{totalReviews} reviews</div>
          </div>
          <div style={styles.breakdown}>
            {[5,4,3,2,1].map(r => (
              <div key={r} style={styles.barRow} onClick={() => setFilterRating(filterRating === String(r) ? '' : String(r))}>
                <span style={styles.barLabel}>{r}★</span>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: totalReviews ? `${(getRatingCount(r) / totalReviews) * 100}%` : '0%' }} />
                </div>
                <span style={styles.barCount}>{getRatingCount(r)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review Button */}
      <button style={styles.writeBtn} onClick={() => setShowForm(!showForm)}>
        {showForm ? '✕ Cancel' : '✍️ Write a Review'}
      </button>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmitReview} style={styles.form}>
          <div>
            <label style={styles.label}>Your Rating *</label>
            <Stars rating={form.rating} size={28} interactive onChange={r => setForm({...form, rating: r})} />
          </div>
          <input
            style={styles.input}
            placeholder="Review title (optional)"
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
            maxLength={100}
          />
          <textarea
            style={{ ...styles.input, minHeight: 100, resize: 'vertical' }}
            placeholder="Share your experience with this product..."
            value={form.comment}
            onChange={e => setForm({...form, comment: e.target.value})}
            maxLength={1000}
          />
          {submitMsg && <div style={submitMsg.startsWith('✅') ? styles.success : styles.error}>{submitMsg}</div>}
          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Filter */}
      {filterRating && (
        <div style={styles.filterTag}>
          Showing {filterRating}★ reviews
          <button style={styles.clearFilter} onClick={() => setFilterRating('')}>✕ Clear</button>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div style={styles.loading}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={styles.empty}>No reviews yet. Be the first to review!</div>
      ) : (
        <>
          {reviews.map(review => (
            <div key={review._id} style={styles.reviewCard}>
              <div style={styles.reviewHeader}>
                <div style={styles.avatar}>{review.buyer?.name?.[0] || '?'}</div>
                <div>
                  <div style={styles.reviewerName}>{review.buyer?.name || 'Anonymous'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Stars rating={review.rating} size={14} />
                    {review.isVerifiedPurchase && (
                      <span style={styles.verified}>✅ Verified Purchase</span>
                    )}
                  </div>
                </div>
                <div style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString('en-PK')}
                </div>
              </div>

              {review.title && <h4 style={styles.reviewTitle}>{review.title}</h4>}
              {review.comment && <p style={styles.reviewComment}>{review.comment}</p>}

              {/* Seller Reply */}
              {review.sellerReply?.comment && (
                <div style={styles.sellerReply}>
                  <strong>Seller Reply:</strong> {review.sellerReply.comment}
                </div>
              )}

              <div style={styles.reviewFooter}>
                <button
                  style={styles.helpfulBtn}
                  onClick={async () => {
                    await reviewAPI.markHelpful(review._id);
                    fetchReviews();
                  }}
                >
                  👍 Helpful ({review.helpfulCount})
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {total > 5 && (
            <div style={styles.pagination}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={styles.pageBtn}>← Prev</button>
              <span style={{ fontSize: 13, color: '#666' }}>Page {page} of {Math.ceil(total / 5)}</span>
              <button disabled={page * 5 >= total} onClick={() => setPage(p => p + 1)} style={styles.pageBtn}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '24px 0' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1a1a1a' },
  summary: { display: 'flex', gap: 32, marginBottom: 24, padding: 20, background: '#f8f8f8', borderRadius: 12 },
  avgBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 100 },
  avgNum: { fontSize: 48, fontWeight: 'bold', color: '#1a1a1a', lineHeight: 1 },
  avgCount: { fontSize: 12, color: '#888' },
  breakdown: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  barRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  barLabel: { fontSize: 12, color: '#666', minWidth: 20, textAlign: 'right' },
  barTrack: { flex: 1, height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', background: '#F59E0B', borderRadius: 4, transition: 'width 0.3s' },
  barCount: { fontSize: 12, color: '#666', minWidth: 20 },
  writeBtn: { marginBottom: 16, padding: '10px 20px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: '600' },
  form: { background: '#f8f8f8', padding: 20, borderRadius: 12, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  label: { display: 'block', fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#333' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  submitBtn: { padding: '10px 24px', background: '#E53E3E', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 },
  success: { color: '#276749', background: '#C6F6D5', padding: '8px 12px', borderRadius: 6, fontSize: 13 },
  error: { color: '#C53030', background: '#FEE2E2', padding: '8px 12px', borderRadius: 6, fontSize: 13 },
  filterTag: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '6px 12px', background: '#FFF5F5', borderRadius: 6, fontSize: 13, color: '#E53E3E' },
  clearFilter: { background: 'none', border: 'none', cursor: 'pointer', color: '#E53E3E', fontSize: 13 },
  loading: { textAlign: 'center', padding: 40, color: '#888' },
  empty: { textAlign: 'center', padding: 40, color: '#888', background: '#f8f8f8', borderRadius: 12 },
  reviewCard: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, marginBottom: 12 },
  reviewHeader: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#E53E3E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16, flexShrink: 0 },
  reviewerName: { fontWeight: '600', fontSize: 14, color: '#1a1a1a', marginBottom: 2 },
  verified: { fontSize: 11, color: '#276749', background: '#C6F6D5', padding: '1px 6px', borderRadius: 4 },
  reviewDate: { marginLeft: 'auto', fontSize: 12, color: '#aaa' },
  reviewTitle: { fontWeight: '600', fontSize: 14, color: '#1a1a1a', marginBottom: 4 },
  reviewComment: { fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 8 },
  sellerReply: { background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#276749', marginTop: 8 },
  reviewFooter: { marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0' },
  helpfulBtn: { background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: '#666' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20 },
  pageBtn: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff', fontSize: 13 },
};

export default ProductReviews;
