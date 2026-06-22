import { useState, useEffect } from 'react';
import { useSignIn, useSignUp, useUser } from '@clerk/clerk-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft, Mail, Lock, User, KeyRound, Loader2, Code, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './AuthPage.css';

const showcaseFeatures = [
  {
    icon: <Code size={56} className="showcase-icon" />,
    title: "Ecosistem Digital Premium",
    description: "Construiește, gestionează și urmărește proiectele tale într-un ecosistem complet. Fii la curent cu ultimele noutăți."
  },
  {
    icon: <ShieldCheck size={56} className="showcase-icon" />,
    title: "Securitate la nivel bancar",
    description: "Datele tale sunt protejate de standarde criptografice. Autentificare securizată prin OTP și sesiuni monitorizate constant."
  },
  {
    icon: <Zap size={56} className="showcase-icon" />,
    title: "Experiență Fluidă",
    description: "Interfețe optimizate pentru performanță extremă. Fiecare interacțiune este gândită să economisească timpul tău prețios."
  }
];

export default function AuthPage() {
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState(location.pathname.includes('/sign-in') ? 'login' : 'register');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Form State
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-slide showcase
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
    return null;
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isSignUpLoaded) return;
    setLoading(true);
    setError('');
    try {
      await signUp.create({ username, firstName, emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setAuthMode('verify');
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || err.message || "A apărut o eroare la înregistrare.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isSignUpLoaded) return;
    setLoading(true);
    setError('');
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        navigate('/');
      } else {
        console.log("Incomplete signup:", completeSignUp);
        setError(`Eroare Clerk (${completeSignUp.status}). Detalii: ${JSON.stringify({ missing: completeSignUp.missingFields, unverified: completeSignUp.unverifiedFields })}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || err.message || "Codul este invalid.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isSignInLoaded) return;
    setLoading(true);
    setError('');
    try {
      const signInAttempt = await signIn.create({ identifier: emailAddress, password });
      if (signInAttempt.status === 'complete') {
        await setSignInActive({ session: signInAttempt.createdSessionId });
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || err.message || "Email sau parolă incorectă.");
    } finally {
      setLoading(false);
    }
  };

  // Form rendering block based on authMode
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
              <input type="email" placeholder="nume@exemplu.ro" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} required />
            </div>
          </div>
          <div className="ca-input-group">
            <label>Parolă</label>
            <div className="ca-input-wrapper">
              <Lock size={18} className="ca-icon" />
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="forgot-password">
              <button type="button">Ai uitat parola?</button>
            </div>
          </div>
          <button type="submit" className="ca-submit-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : 'Intră în cont'}
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
            <label>Nume utilizator (Username)</label>
            <div className="ca-input-wrapper">
              <User size={18} className="ca-icon" />
              <input type="text" placeholder="ion_popescu" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
          </div>
          <div className="ca-input-group">
            <label>Nume complet</label>
            <div className="ca-input-wrapper">
              <User size={18} className="ca-icon" />
              <input type="text" placeholder="Ion Popescu" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
          </div>
          <div className="ca-input-group">
            <label>E-mail</label>
            <div className="ca-input-wrapper">
              <Mail size={18} className="ca-icon" />
              <input type="email" placeholder="nume@exemplu.ro" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} required />
            </div>
          </div>
          <div className="ca-input-group">
            <label>Parolă</label>
            <div className="ca-input-wrapper">
              <Lock size={18} className="ca-icon" />
              <input type="password" placeholder="Minim 8 caractere" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="ca-submit-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : 'Creează contul'}
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
            <label>Cod de verificare (6 cifre)</label>
            <div className="ca-input-wrapper">
              <KeyRound size={18} className="ca-icon" />
              <input type="text" placeholder="123456" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required style={{ letterSpacing: '0.5em', fontWeight: '800' }} />
            </div>
          </div>
          <button type="submit" className="ca-submit-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : 'Verifică contul'}
          </button>
        </motion.form>
      );
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-bg-glow glow-1"></div>
      <div className="auth-bg-glow glow-2"></div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="auth-split-card"
      >
        {/* LEFT SIDE: FORM */}
        <div className="auth-form-side">
          <Link to="/" className="auth-back-btn">
            <ArrowLeft size={16} /> Înapoi la site
          </Link>
          
          <div className="auth-form-content">
            <AnimatePresence mode="wait">
              <motion.div 
                key={authMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="ca-header"
              >
                <h2>
                  {authMode === 'login' && 'Bine ai revenit'}
                  {authMode === 'register' && 'Creează un cont'}
                  {authMode === 'verify' && 'Verifică e-mail-ul'}
                </h2>
                <p>
                  {authMode === 'login' && 'Intră în cont pentru a lăsa review-uri.'}
                  {authMode === 'register' && 'Alătură-te comunității noastre digitale.'}
                  {authMode === 'verify' && `Am trimis un cod pe ${emailAddress}.`}
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

            <div id="clerk-captcha"></div>

            <AnimatePresence mode="wait">
              {renderForm()}
            </AnimatePresence>

            {authMode !== 'verify' && (
              <div className="ca-footer">
                {authMode === 'login' ? (
                  <span>Nu ai cont? <button type="button" className="text-primary" onClick={() => { setAuthMode('register'); setError(''); }}>Înregistrează-te</button></span>
                ) : (
                  <span>Ai deja cont? <button type="button" className="text-primary" onClick={() => { setAuthMode('login'); setError(''); }}>Loghează-te</button></span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: SHOWCASE */}
        <div className="auth-showcase-side">
          <div className="showcase-content">
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="showcase-logo"
            >
              <Layers size={32} className="text-primary" />
              <span>IANNC<span className="text-primary">.RO</span></span>
            </motion.div>
            
            <div className="showcase-illustration">
               <div className="abstract-shape shape-1"></div>
               <div className="abstract-shape shape-2"></div>
               <AnimatePresence mode="wait">
                 <motion.div 
                   key={currentSlide}
                   initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                   animate={{ opacity: 1, scale: 1, rotate: -10 }}
                   exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                   transition={{ duration: 0.5, ease: "backOut" }}
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
                ></span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
