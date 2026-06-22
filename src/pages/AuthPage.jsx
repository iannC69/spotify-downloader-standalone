import { useEffect, useState } from 'react';
import { useSignIn, useSignUp, useUser } from '@clerk/clerk-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft, Mail, Lock, User, KeyRound, Loader2, Code, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './AuthPage.css';

const showcaseFeatures = [
  {
    icon: <Code size={56} className="showcase-icon" />,
    title: 'Ecosistem Digital Premium',
    description: 'Acces rapid la tool-uri, reviews si zona ta de comunitate intr-un spatiu curat si sigur.',
  },
  {
    icon: <ShieldCheck size={56} className="showcase-icon" />,
    title: 'Securitate reala',
    description: 'Autentificare prin IANNC Auth, sesiuni protejate si review-uri moderate inainte sa apara public.',
  },
  {
    icon: <Zap size={56} className="showcase-icon" />,
    title: 'Experienta fluida',
    description: 'Login rapid, formulare clare si tranzitii fine pentru o experienta fara frecare.',
  },
];

export default function AuthPage() {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState(location.pathname.includes('/sign-in') ? 'login' : 'register');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % showcaseFeatures.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      navigate('/');
    }
  }, [isSignedIn, navigate]);

  if (isSignedIn) {
    return (
      <div className="auth-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0a0c' }}>
        <Loader2 className="spinner" size={48} style={{ color: '#D2FF00', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!isSignUpLoaded) return;

    setLoading(true);
    setError('');

    try {
      await signUp.create({ username, firstName, emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setAuthMode('verify');
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || err.message || 'A aparut o eroare la inregistrare.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!isSignUpLoaded) return;

    setLoading(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });

      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        navigate('/');
      } else {
        setError(`Eroare de securitate (${completeSignUp.status}). Verifica datele si incearca din nou.`);
      }
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || err.message || 'Codul este invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async (event) => {
    event.preventDefault();
    if (!isSignInLoaded) return;

    setLoading(true);
    setError('');

    try {
      let completeSignIn;
      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
        completeSignIn = await signIn.attemptSecondFactor({ strategy: 'email_code', code });
      } else if (signIn.status === 'needs_first_factor') {
        completeSignIn = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
      }

      if (completeSignIn && completeSignIn.status === 'complete') {
        await setSignInActive({ session: completeSignIn.createdSessionId });
        navigate('/');
      } else {
        setError(`Eroare de verificare (${completeSignIn?.status}). Verifica codul si incearca din nou.`);
      }
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || err.message || 'Codul este invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!isSignInLoaded) return;

    setLoading(true);
    setError('');

    try {
      const signInAttempt = await signIn.create({ identifier: emailAddress, password });

      if (signInAttempt.status === 'complete') {
        await setSignInActive({ session: signInAttempt.createdSessionId });
        navigate('/');
      } else if (signInAttempt.status === 'needs_first_factor') {
        await signInAttempt.prepareFirstFactor({ strategy: 'email_code' });
        setAuthMode('verify-login');
      } else if (signInAttempt.status === 'needs_client_trust' || signInAttempt.status === 'needs_second_factor') {
        await signInAttempt.prepareSecondFactor({ strategy: 'email_code' });
        setAuthMode('verify-login');
      } else {
        setError(`Eroare de autentificare (${signInAttempt.status}).`);
      }
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || err.message || 'Email sau parola incorecta.');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (authMode === 'login') {
      return (
        <motion.form
          key="login"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleLogin}
          className="ca-form"
        >
          <div className="ca-input-group">
            <label>E-mail</label>
            <div className="ca-input-wrapper">
              <Mail size={18} className="ca-icon" />
              <input type="email" placeholder="nume@exemplu.ro" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} required />
            </div>
          </div>
          <div className="ca-input-group">
            <label>Parola</label>
            <div className="ca-input-wrapper">
              <Lock size={18} className="ca-icon" />
              <input type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <div className="forgot-password">
              <button type="button">Ai uitat parola?</button>
            </div>
          </div>
          <button type="submit" className="ca-submit-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : 'Intra in cont'}
          </button>
        </motion.form>
      );
    }

    if (authMode === 'register') {
      return (
        <motion.form
          key="register"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleRegister}
          className="ca-form"
        >
          <div className="ca-input-group">
            <label>Username</label>
            <div className="ca-input-wrapper">
              <User size={18} className="ca-icon" />
              <input type="text" placeholder="iannc_user" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </div>
          </div>
          <div className="ca-input-group">
            <label>Nume complet</label>
            <div className="ca-input-wrapper">
              <User size={18} className="ca-icon" />
              <input type="text" placeholder="Numele tau" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
            </div>
          </div>
          <div className="ca-input-group">
            <label>E-mail</label>
            <div className="ca-input-wrapper">
              <Mail size={18} className="ca-icon" />
              <input type="email" placeholder="nume@exemplu.ro" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} required />
            </div>
          </div>
          <div className="ca-input-group">
            <label>Parola</label>
            <div className="ca-input-wrapper">
              <Lock size={18} className="ca-icon" />
              <input type="password" placeholder="Minim 8 caractere" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
          </div>
          <button type="submit" className="ca-submit-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : 'Creeaza contul'}
          </button>
        </motion.form>
      );
    }

    if (authMode === 'verify') {
      return (
        <motion.form
          key="verify"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleVerify}
          className="ca-form"
        >
          <div className="ca-input-group">
            <label>Cod de verificare</label>
            <div className="ca-input-wrapper">
              <KeyRound size={18} className="ca-icon" />
              <input type="text" placeholder="123456" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} required style={{ letterSpacing: '0.5em', fontWeight: '800' }} />
            </div>
          </div>
          <button type="submit" className="ca-submit-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : 'Verifica contul'}
          </button>
        </motion.form>
      );
    }

    if (authMode === 'verify-login') {
      return (
        <motion.form
          key="verify-login"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleVerifyLogin}
          className="ca-form"
        >
          <div className="ca-input-group">
            <label>Cod de securitate (Email)</label>
            <div className="ca-input-wrapper">
              <KeyRound size={18} className="ca-icon" />
              <input type="text" placeholder="123456" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} required style={{ letterSpacing: '0.5em', fontWeight: '800' }} />
            </div>
          </div>
          <button type="submit" className="ca-submit-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : 'Confirma Autentificarea'}
          </button>
        </motion.form>
      );
    }

    return null;
  };

  return (
    <div className="auth-page-container">
      <div className="auth-starfield" />
      <div className="auth-backdrop-grid" />
      <div className="auth-lime-path path-one" />
      <div className="auth-lime-path path-two" />
      <div className="auth-bg-glow glow-1" />
      <div className="auth-bg-glow glow-2" />
      <div className="auth-floating-chip chip-one">Firebase synced</div>
      <div className="auth-floating-chip chip-two">IANNC secured</div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="auth-split-card"
      >
        <div className="auth-form-side">
          <Link to="/" className="auth-back-btn">
            <ArrowLeft size={16} /> Inapoi la site
          </Link>

          <div className="auth-form-content">
            {authMode !== 'verify' && authMode !== 'verify-login' && (
              <div className="auth-mode-switch" aria-label="Auth mode">
                <button
                  type="button"
                  className={authMode === 'login' ? 'active' : ''}
                  onClick={() => { setAuthMode('login'); setError(''); }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={authMode === 'register' ? 'active' : ''}
                  onClick={() => { setAuthMode('register'); setError(''); }}
                >
                  Register
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="ca-header"
              >
                <span className="ca-kicker">Member access</span>
                <h2>
                  {authMode === 'login' && 'Bine ai revenit'}
                  {authMode === 'register' && 'Creeaza un cont'}
                  {authMode === 'verify' && 'Verifica e-mail-ul'}
                  {authMode === 'verify-login' && 'Securitate Cont'}
                </h2>
                <p>
                  {authMode === 'login' && 'Intra in cont pentru a lasa review-uri si feedback.'}
                  {authMode === 'register' && 'Alatura-te comunitatii si pastreaza-ti activitatea sincronizata.'}
                  {authMode === 'verify' && `Am trimis un cod pe ${emailAddress}.`}
                  {authMode === 'verify-login' && `Sistemul de securitate a detectat o activitate neobisnuita. Am trimis un cod de verificare pe ${emailAddress}.`}
                </p>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="ca-error-box"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div id="clerk-captcha" />

            <AnimatePresence mode="wait">
              {renderForm()}
            </AnimatePresence>

            {authMode !== 'verify' && authMode !== 'verify-login' && (
              <div className="ca-footer">
                {authMode === 'login' ? (
                  <span>Nu ai cont? <button type="button" className="text-primary" onClick={() => { setAuthMode('register'); setError(''); }}>Inregistreaza-te</button></span>
                ) : (
                  <span>Ai deja cont? <button type="button" className="text-primary" onClick={() => { setAuthMode('login'); setError(''); }}>Logheaza-te</button></span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="auth-showcase-side">
          <div className="showcase-content">
            <div className="showcase-orbit orbit-one" />
            <div className="showcase-orbit orbit-two" />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="showcase-logo"
            >
              <Layers size={32} className="text-primary" />
              <span>IANNC<span className="text-primary">.RO</span></span>
            </motion.div>

            <div className="showcase-live-card">
              <span className="live-dot" />
              <div>
                <strong>Secure workspace</strong>
                <small>Reviews, community si tools sincronizate</small>
              </div>
            </div>

            <div className="showcase-illustration">
              <div className="abstract-shape shape-1" />
              <div className="abstract-shape shape-2" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: -8 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                  transition={{ duration: 0.5, ease: 'backOut' }}
                  className="showcase-icon-wrapper"
                >
                  {showcaseFeatures[currentSlide].icon}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="showcase-text-container">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="showcase-text"
                >
                  <h3>{showcaseFeatures[currentSlide].title}</h3>
                  <p>{showcaseFeatures[currentSlide].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="showcase-dots">
              {showcaseFeatures.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>

            <div className="showcase-security-strip">
              <span><ShieldCheck size={15} /> IANNC Auth</span>
              <span><Zap size={15} /> Fast access</span>
              <span><Code size={15} /> IANNC Tools</span>
            </div>

            <div className="showcase-mini-terminal" aria-label="Auth status preview">
              <div className="terminal-dots"><i /><i /><i /></div>
              <code>auth.session: verified</code>
              <code>reviews.queue: protected</code>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
