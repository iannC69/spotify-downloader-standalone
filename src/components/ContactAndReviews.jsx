import { useEffect, useState } from 'react';
import { Mail, MessageSquare, Check, Copy, Send, Star, UserPlus, Sparkles, ShieldCheck } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import './ContactAndReviews.css';

export default function ContactAndReviews() {
  const { user } = useUser();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [formStatus, setFormStatus] = useState(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchReviews = async () => {
    try {
      const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(reviewsQuery);
      const fetchedReviews = querySnapshot.docs
        .map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() }))
        .filter((review) => review.status === 'approved');

      setReviews(fetchedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
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

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormStatus('submitting');

    const formData = new FormData(event.target);
    const payload = Object.fromEntries(formData);
    payload.access_key = 'c57558e4-33b0-4400-8560-748494e0d84f';
    payload.subject = 'Mesaj nou de pe iannc.ro!';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setFormStatus('success');
        event.target.reset();
        setTimeout(() => setFormStatus(null), 5000);
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      setFormStatus('error');
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user || !reviewText.trim()) return;

    setSubmittingReview(true);
    setReviewError('');

    try {
      await addDoc(collection(db, 'reviews'), {
        userId: user.id,
        userName: user.fullName || user.firstName || 'Anonymous',
        userImage: user.imageUrl,
        text: reviewText,
        rating,
        createdAt: serverTimestamp(),
        status: 'pending',
      });

      setReviewText('');
      setRating(5);
      fetchReviews();
    } catch (error) {
      console.error('Error adding review:', error);
      setReviewError(error.message || 'Eroare la baza de date.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const copyValue = (value, setter) => {
    navigator.clipboard.writeText(value);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <section id="contact" className="story-section cr-section">
      <div className="section-container cr-container">
        <div className="cr-section-heading">
          <span className="cr-kicker"><Sparkles size={15} /> Contact & community</span>
          <div className="cr-heading-row">
            <div>
              <h2>Hai sa construim ceva bun.</h2>
              <p>Mesaje rapide, colaborari, feedback si review-uri intr-o zona mai curata pentru comunitate.</p>
            </div>
            <div className="cr-trust-row" aria-label="Contact highlights">
              <span><ShieldCheck size={16} /> Moderare Firebase</span>
              <span><Mail size={16} /> contact@iannc.ro</span>
            </div>
          </div>
        </div>

        <div className="cr-split-layout">
          <div className="cr-panel cr-contact-panel">
            <div className="cr-header">
              <span className="cr-panel-label">Mesaj direct</span>
              <h3>Let's Talk</h3>
              <p>Trimite-mi un mesaj rapid pentru colaborari, idei sau intrebari.</p>
            </div>

            <form className="contact-form inline-form" onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Nume</label>
                <input type="text" name="name" placeholder="Numele tau" required disabled={formStatus === 'submitting'} />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" name="email" placeholder="nume@example.com" required disabled={formStatus === 'submitting'} />
              </div>
              <div className="form-group">
                <label>Mesaj</label>
                <textarea name="message" placeholder="Salut, vreau sa discutam despre..." rows="4" required disabled={formStatus === 'submitting'} />
              </div>

              {formStatus === 'success' ? (
                <div className="form-success-message cr-alert">
                  <Check size={20} /> Mesaj trimis cu succes!
                </div>
              ) : formStatus === 'error' ? (
                <div className="form-error-message cr-alert error">
                  A aparut o eroare. Incearca din nou.
                </div>
              ) : (
                <button type="submit" className="submit-btn" disabled={formStatus === 'submitting'}>
                  {formStatus === 'submitting' ? 'Se trimite...' : <>Trimite <Send size={16} /></>}
                </button>
              )}
            </form>

            <div className="cr-quick-methods">
              <button type="button" className="cr-quick-card" onClick={() => copyValue('contact@iannc.ro', setEmailCopied)}>
                <div className="cr-quick-icon"><Mail size={18} /></div>
                <span>contact@iannc.ro</span>
                {emailCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
              <button type="button" className="cr-quick-card" onClick={() => copyValue('iannc.', setDiscordCopied)}>
                <div className="cr-quick-icon discord"><MessageSquare size={18} /></div>
                <span>iannc.</span>
                {discordCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="cr-panel cr-reviews-panel">
            <div className="cr-header reviews-header">
              <div>
                <span className="cr-panel-label">Community proof</span>
                <h3>Wall of Love</h3>
                <p>Pareri de la colaboratori si vizitatori.</p>
              </div>
              <SignedIn>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'cr-user-btn' } }} />
              </SignedIn>
            </div>

            <div className="cr-write-review">
              <SignedOut>
                <div className="cr-auth-prompt">
                  <p>Vrei sa lasi o parere?</p>
                  <Link to="/sign-in" className="cr-auth-btn">
                    <UserPlus size={18} /> Creeaza cont / Logheaza-te
                  </Link>
                </div>
              </SignedOut>

              <SignedIn>
                <form className="cr-review-form" onSubmit={submitReview}>
                  <div className="cr-rating-select">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={24}
                        className={star <= rating ? 'star-active' : 'star-inactive'}
                        onClick={() => setRating(star)}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    placeholder="Cum a fost experienta ta?"
                    rows="3"
                    required
                    disabled={submittingReview}
                  />
                  {reviewError && <div className="cr-review-error">Eroare: {reviewError}</div>}
                  <button type="submit" className="submit-btn review-submit" disabled={submittingReview}>
                    {submittingReview ? 'Se adauga...' : 'Publica parerea'}
                  </button>
                </form>
              </SignedIn>
            </div>

            <div className="cr-reviews-list">
              {loadingReviews ? (
                <div className="cr-loading">Se incarca parerile...</div>
              ) : reviews.length === 0 ? (
                <div className="cr-empty">Fii primul care lasa un review!</div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="cr-review-card">
                    <div className="cr-review-header">
                      <img src={review.userImage || 'https://ui-avatars.com/api/?name=User'} alt={review.userName} className="cr-review-avatar" />
                      <div className="cr-review-meta">
                        <strong>{review.userName}</strong>
                        <div className="cr-stars">
                          {[...Array(5)].map((_, index) => (
                            <Star key={index} size={12} className={index < review.rating ? 'star-active' : 'star-inactive'} />
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
