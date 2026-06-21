import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Monitor, Home, Palette, Settings, X } from 'lucide-react';
import { playClickSound } from '../utils/sounds';
import './CommandPalette.css';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (action) => {
    playClickSound();
    action();
    setOpen(false);
  };

  const changeTheme = (themeId) => {
    localStorage.setItem('iannc-theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu" className="command-dialog-wrapper">
      <div className="command-dialog-overlay" onClick={() => setOpen(false)} />
      <div className="command-dialog-content">
        <div className="command-input-wrapper">
          <Command.Input placeholder="Type a command or search..." autoFocus />
          <button className="command-close" onClick={() => setOpen(false)}><X size={16} /></button>
        </div>
        
        <Command.List className="command-list">
          <Command.Empty className="command-empty">No results found.</Command.Empty>

          <Command.Group heading="Navigation">
            <Command.Item onSelect={() => handleSelect(() => navigate('/'))}>
              <Home size={16} /> Home
            </Command.Item>
            <Command.Item onSelect={() => handleSelect(() => navigate('/admin'))}>
              <Settings size={16} /> Admin Command Center
            </Command.Item>
            <Command.Item onSelect={() => handleSelect(() => { navigate('/'); setTimeout(() => window.location.href = '#proiecte', 100); })}>
              <Monitor size={16} /> Projects
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Themes">
            <Command.Item onSelect={() => handleSelect(() => changeTheme('lime'))}>
              <Palette size={16} style={{color: '#D2FF00'}} /> Neon Lime
            </Command.Item>
            <Command.Item onSelect={() => handleSelect(() => changeTheme('gold'))}>
              <Palette size={16} style={{color: '#FFD700'}} /> Royal Gold
            </Command.Item>
            <Command.Item onSelect={() => handleSelect(() => changeTheme('red'))}>
              <Palette size={16} style={{color: '#EF4444'}} /> Cyber Red
            </Command.Item>
            <Command.Item onSelect={() => handleSelect(() => changeTheme('purple'))}>
              <Palette size={16} style={{color: '#A855F7'}} /> Deep Purple
            </Command.Item>
            <Command.Item onSelect={() => handleSelect(() => changeTheme('blue'))}>
              <Palette size={16} style={{color: '#3B82F6'}} /> Electric Blue
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
