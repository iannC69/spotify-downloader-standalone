import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Check, Copy, Send, Star, UserPlus } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './ContactAndReviews.css';

export default function ContactAndReviews() {
  const { user } = useUser();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // Contact form state
  const [formStatus, setFormStatus] = useState(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);

  // Review form state
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReviews = async () => {
    try {
      const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedReviews = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchReviews();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    const formData = new FormData(e.target);
    const object = Object.fromEntries(formData);
    object.access_key = "c57558e4-33b0-4400-8560-748494e0d84f";
    object.subject = "Mesaj nou de pe iannc.ro!";
    const json = JSON.stringify(object);
    
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: json
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormStatus('success');
        e.target.reset();
        setTimeout(() => setFormStatus(null), 5000);
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setFormStatus('error');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user || !reviewText.trim()) return;
    
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, "reviews"), {
        userId: user.id,
        userName: user.fullName || user.firstName || "Anonymous",
        userImage: user.imageUrl,
        text: reviewText,
        rating: rating,
        createdAt: serverTimestamp()
      });
      
      setReviewText('');
      setRating(5);
      fetchReviews(); // Refresh reviews
    } catch (error) {
      console.error("Error adding review:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <section id="contact" className="story-section cr-section">
      <div className="section-container cr-container">
        
        <div className="cr-split-layout">
          
          {/* LEFT: CONTACT FORM */}
          <div className="cr-panel cr-contact-panel">
            <div className="cr-header">
              <h2>Let's Talk</h2>
              <p>Trimite-mi un mesaj rapid pentru colaborări.</p>
            </div>
            
            <form className="contact-form inline-form" onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Nume</label>
                <input type="text" name="name" placeholder="John Doe" required disabled={formStatus === 'submitting'} />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" name="email" placeholder="john@example.com" required disabled={formStatus === 'submitting'} />
              </div>
              <div className="form-group">
                <label>Mesaj</label>
                <textarea name="message" placeholder="Salut..." rows="4" required disabled={formStatus === 'submitting'}></textarea>
              </div>
              
              {formStatus === 'success' ? (
                <div className="form-success-message cr-alert">
                  <Check size={20} /> Mesaj trimis cu succes!
                </div>
              ) : formStatus === 'error' ? (
                <div className="form-error-message cr-alert error">
                  A apărut o eroare.
                </div>
              ) : (
                <button type="submit" className="submit-btn" disabled={formStatus === 'submitting'}>
                  {formStatus === 'submitting' ? 'Se trimite...' : <>Trimite <Send size={16} /></>}
                </button>
              )}
            </form>

            {/* Quick Copy Methods */}
            <div className="cr-quick-methods">
              <div className="cr-quick-card" onClick={() => {
                navigator.clipboard.writeText('contact@iannc.ro');
                setEmailCopied(true);
                setTimeout(() => setEmailCopied(false), 2000);
              }}>
                <div className="cr-quick-icon"><Mail size={18} /></div>
                <span>contact@iannc.ro</span>
                {emailCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </div>
              <div className="cr-quick-card" onClick={() => {
                navigator.clipboard.writeText('iannc.');
                setDiscordCopied(true);
                setTimeout(() => setDiscordCopied(false), 2000);
              }}>
                <div className="cr-quick-icon discord"><MessageSquare size={18} /></div>
                <span>iannc.</span>
                {discordCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </div>
            </div>
          </div>

          {/* RIGHT: REVIEWS */}
          <div className="cr-panel cr-reviews-panel">
            <div className="cr-header reviews-header">
              <div>
                <h2>Wall of Love</h2>
                <p>Păreri de la colaboratori și vizitatori.</p>
              </div>
              <SignedIn>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "cr-user-btn" } }} />
              </SignedIn>
            </div>

            {/* Write Review Box */}
            <div className="cr-write-review">
              <SignedOut>
                <div className="cr-auth-prompt">
                  <p>Vrei să lași o părere?</p>
                  <SignInButton mode="modal">
                    <button className="cr-auth-btn"><UserPlus size={18} /> Crează cont / Loghează-te</button>
                  </SignInButton>
                </div>
              </SignedOut>

              <SignedIn>
                <form className="cr-review-form" onSubmit={submitReview}>
                  <div className="cr-rating-select">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={24} 
                        className={star <= rating ? "star-active" : "star-inactive"} 
                        onClick={() => setRating(star)}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                  <textarea 
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Cum a fost experiența ta?" 
                    rows="3" 
                    required 
                    disabled={submittingReview}
                  ></textarea>
                  <button type="submit" className="submit-btn review-submit" disabled={submittingReview}>
                    {submittingReview ? 'Se adaugă...' : 'Publică Părerea'}
                  </button>
                </form>
              </SignedIn>
            </div>

            {/* Reviews List */}
            <div className="cr-reviews-list">
              {loadingReviews ? (
                <div className="cr-loading">Se încarcă părerile...</div>
              ) : reviews.length === 0 ? (
                <div className="cr-empty">Fii primul care lasă un review!</div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="cr-review-card">
                    <div className="cr-review-header">
                      <img src={review.userImage || "https://ui-avatars.com/api/?name=User"} alt={review.userName} className="cr-review-avatar" />
                      <div className="cr-review-meta">
                        <strong>{review.userName}</strong>
                        <div className="cr-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < review.rating ? "star-active" : "star-inactive"} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="cr-review-text">{review.text}</p>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
