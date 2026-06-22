import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import './index.css'
import App from './App.jsx'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#D2FF00',
          colorBackground: '#0a0a0c',
          colorText: '#ffffff',
          colorInputBackground: 'rgba(255,255,255,0.05)',
          colorInputText: '#ffffff',
          borderRadius: '16px',
        },
        elements: {
          card: {
            background: 'rgba(9, 9, 11, 0.75)',
            backdropFilter: 'blur(60px) saturate(180%)',
            border: '1px solid rgba(210, 255, 0, 0.15)',
            borderTop: '1px solid rgba(210, 255, 0, 0.3)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 40px rgba(210, 255, 0, 0.05) inset',
            borderRadius: '30px',
          },
          modalBackdrop: {
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)',
          },
          modalContent: {
            background: 'rgba(9, 9, 11, 0.8)',
            backdropFilter: 'blur(80px) saturate(200%)',
            border: '1px solid rgba(210, 255, 0, 0.2)',
            borderTop: '1px solid rgba(210, 255, 0, 0.4)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 60px rgba(210, 255, 0, 0.08) inset',
            borderRadius: '30px',
          },
          userButtonPopoverCard: {
            background: 'rgba(9, 9, 11, 0.85)',
            backdropFilter: 'blur(60px) saturate(200%)',
            border: '1px solid rgba(210, 255, 0, 0.2)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(210, 255, 0, 0.05) inset',
            borderRadius: '24px',
            padding: '4px',
          },
          userButtonPopoverActionButton: {
            borderRadius: '16px',
            margin: '4px',
            padding: '12px 16px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { background: 'rgba(210, 255, 0, 0.1)', transform: 'translateX(6px)' }
          },
          userButtonPopoverActionButtonIcon: {
            color: '#D2FF00',
            width: '1.2rem',
            height: '1.2rem',
          },
          userButtonPopoverActionButtonText: {
            color: '#fff',
            fontWeight: '600',
          },
          navbar: { 
            background: 'rgba(0,0,0,0.3)', 
            borderRight: '1px solid rgba(210, 255, 0, 0.1)' 
          },
          navbarButton: { 
            borderRadius: '16px',
            margin: '4px 12px',
            padding: '12px 16px',
            color: '#94a3b8', 
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { color: '#D2FF00', background: 'rgba(210, 255, 0, 0.05)', transform: 'translateX(6px)' } 
          },
          scrollBox: { background: 'transparent' },
          pageScrollBox: { padding: '3rem' },
          profileSection: { 
            background: 'rgba(255,255,255,0.01)',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid rgba(255,255,255,0.03)',
            marginBottom: '1.5rem',
            transition: 'all 0.3s ease',
            '&:hover': { border: '1px solid rgba(210, 255, 0, 0.1)', background: 'rgba(210, 255, 0, 0.01)', transform: 'translateY(-2px)' }
          },
          profileSectionTitle: { color: '#ffffff', fontWeight: '900', fontSize: '1.3rem', borderBottom: 'none', marginBottom: '1rem' },
          profileSectionTitleText: { color: '#ffffff' },
          profileSectionPrimaryButton: { color: '#D2FF00', fontWeight: 'bold', transition: 'all 0.2s ease', '&:hover': { transform: 'scale(1.05)' } },
          avatarImageActionsUpload: { color: '#000', background: '#D2FF00', border: 'none', '&:hover': { background: '#bde600' } },
          badge: { background: 'rgba(210, 255, 0, 0.15)', color: '#D2FF00', border: '1px solid rgba(210, 255, 0, 0.3)', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '8px' },
          formButtonPrimary: { 
            background: '#D2FF00', 
            color: '#000', 
            fontWeight: '900',
            borderRadius: '12px',
            padding: '0.8rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 10px 20px rgba(210, 255, 0, 0.15)',
            '&:hover': { background: '#bde600', transform: 'translateY(-2px)', boxShadow: '0 15px 25px rgba(210, 255, 0, 0.25)' }
          },
          headerTitle: { color: '#ffffff', fontWeight: '900', fontSize: '1.8rem', letterSpacing: '-0.02em' },
          headerSubtitle: { color: '#94a3b8', fontSize: '0.95rem' },
          socialButtonsBlockButton: { 
            border: '1px solid rgba(255,255,255,0.08)', 
            background: 'rgba(255,255,255,0.02)', 
            color: '#fff', 
            borderRadius: '12px',
            transition: 'all 0.2s ease', 
            '&:hover': { background: 'rgba(255,255,255,0.08)', transform: 'translateY(-2px)' } 
          },
          formFieldInput: { 
            border: '1px solid rgba(255,255,255,0.1)', 
            background: 'rgba(0,0,0,0.3)', 
            color: '#fff', 
            borderRadius: '12px',
            padding: '0.8rem 1rem',
            transition: 'all 0.2s ease',
            '&:focus': { borderColor: '#D2FF00', boxShadow: '0 0 0 2px rgba(210, 255, 0, 0.1)', background: 'rgba(255,255,255,0.05)' } 
          },
          formFieldLabel: { color: '#cbd5e1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' },
          dividerLine: { background: 'rgba(255,255,255,0.08)' },
          dividerText: { color: '#64748b' },
          footerActionText: { color: '#94a3b8' },
          footerActionLink: { color: '#D2FF00', fontWeight: '800', '&:hover': { textDecoration: 'none', color: '#bde600' } },
          userButtonPopoverFooter: { display: 'none' },
          watermark: { display: 'none', opacity: 0, visibility: 'hidden' },
          footer: { display: 'none' }
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
