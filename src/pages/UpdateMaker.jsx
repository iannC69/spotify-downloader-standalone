import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Plus, Trash2, Copy, Check, ChevronDown, ChevronUp, Image as ImageIcon, Link as LinkIcon, User as UserIcon, X, Upload, Download, Sparkles, FolderOpen, Save, FileCode2, Minimize, Maximize, ZoomIn, ZoomOut, Hash, Undo2, Redo2, RotateCcw, ImageDown, MessageSquare, ScrollText, Languages, ArrowLeft, Bold, Italic, Underline, Strikethrough, Quote, Code, List, Heading, AtSign, Clock, Smile } from 'lucide-react';
import html2canvas from 'html2canvas';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import '../index.css';

const DEFAULT_CATEGORIES = [
  {
    id: 'cat-1',
    title: '🚀 Noutăți & Funcționalități Noi (New Features)',
    description: '- Am adăugat un nou sistem de...\n- Funcționalitatea X este acum disponibilă pentru toată lumea.',
    descriptionEn: '- Added a new system for...\n- Feature X is now available for everyone.'
  },
  {
    id: 'cat-2',
    title: '✨ Modificări & Îmbunătățiri (Improvements)',
    description: '- Am îmbunătățit performanța și fluiditatea pentru...\n- Au fost ajustate prețurile la...',
    descriptionEn: '- Improved performance and fluidity for...\n- Prices have been adjusted for...'
  }
];

const DEFAULT_FOOTER_TEXT = '<────────────────────────────────────────────────────────>\n\n**Părerea voastră contează enorm pentru noi!** Lasă o reacție mai jos:\n🧑‍💻 ➔ Am citit tot patch-ul de azi.\n✅ ➔ Îmi place la nebunie ce ați băgat!\n❌ ➔ Nu îmi place / Consider că trebuie modificat.\n\n*Mulțumim pentru feedback și spor la joc!* 🏆\n|| @everyone ||';

const TEMPLATE_2_CATEGORIES = [
  {
    id: 't2-c1',
    title: ':globe_with_meridians: Website & Management',
    description: '- Sistem nou de discuții pe dashboard pentru cererile de unban.\n- Jucătorii pot trimite mai multe mesaje în ticket pentru a se justifica pe bune.\n- Interfața (UI) a primit un upgrade major, fiind mult mai ușor de folosit.\n- Staff-ul are acum full acces la panel și site (control VIP, pachete MVP și sancțiuni).',
    descriptionEn: ''
  },
  {
    id: 't2-c2',
    title: ':chart_with_upwards_trend: Leaderboard & Sezoane',
    description: '- Am introdus un sistem lunar de sezoane pentru a menține serverul competitiv.\n- Topul se va reseta automat la fiecare început de lună.\n- Cei mai buni jucători de la finalul fiecărei luni vor primi premii exclusive.',
    descriptionEn: ''
  },
  {
    id: 't2-c3',
    title: ':coin: Economie & Credite',
    description: '- Am modificat sistemul de obținere al creditelor folosite în !shop.\n- Jucătorii sunt de acum răsplătiți cu credite la fiecare kill realizat.\n- Bonus automat: primiți 50 de credite garantat la fiecare 5 minute de playtime.',
    descriptionEn: ''
  },
  {
    id: 't2-c4',
    title: ':shopping_cart: Shop & Fixuri',
    description: '- Secțiunea de Shop este acum permanentă la features, cu valabilitatea itemelor setată la 7 zile.\n- A fost eliminată opțiunea de wear reroll de la MVP tokens.\n- Am rezolvat bug-ul la custom tags (echipările nu își mai dau unequip automat la map change sau la deconectarea de pe serverul de Counter-Strike 2).',
    descriptionEn: ''
  }
];

const TEMPLATE_2_FOOTER_TEXT = '--------------------------------------------------------------------\n\n**:bar_chart: FEEDBACK UPDATE**\nAșteptăm părerea voastră folosind reacțiile de mai jos:\n:technologist: `Am citit tot`  |  :white_check_mark: `Super update`  |  :x: `Mai trebuie ajustat`\n\nVă mulțumim că alegeți să jucați aici zi de zi. Distracție plăcută tuturor! :trophy:';

const INITIAL_STATE = {
  version: 'v1.0.0',
  headerText: '```yaml\n──────── ⧼ UPDATE `v1.0.0` ⧽ ────────\n```',
  useBlockquote: false,
  showDate: false,
  introText: '',
  showIntro: false,
  categories: DEFAULT_CATEGORIES,
  showBugFixes: true,
  bugFixesText: '```fix\n- S-a rezolvat bug-ul care cauza prăbușirea la...\n- Corectat un text afișat greșit în meniu.\n```',
  bugFixesTextEn: '```fix\n- Fixed a bug that caused crashing at...\n- Corrected a misspelled text in the menu.\n```',
  showFooter: true,
  footerText: DEFAULT_FOOTER_TEXT,
  imageUrl: '',
  webhookUrl: '',
  embedColor: '#5865F2',
  drafts: '',
  isDualLanguage: false,
  avatarUrl: 'https://avatars.fastly.steamstatic.com/78d9eb012e4c8938dac68a4cd9edbad08b782a67_full.jpg'
};

const PRESET_TEMPLATE_2 = {
  ...INITIAL_STATE,
  headerText: '```yaml\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n                                       /// UPDATE PATCH v1.0.0 ///               \n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n```',
  useBlockquote: true,
  categories: TEMPLATE_2_CATEGORIES,
  showBugFixes: false,
  bugFixesText: '',
  footerText: TEMPLATE_2_FOOTER_TEXT
};

const SNIPPETS = [
  "S-a rezolvat bug-ul care cauza...",
  "Am îmbunătățit performanța pentru...",
  "Am adăugat un nou sistem de...",
  "A fost refăcut de la zero...",
  "Am modificat economia pentru..."
];

function TextareaWithToolbar({ value, onChange, placeholder, style, isInput = false }) {
  const textareaRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);

  const closeAllDropdowns = () => {
    setShowEmojiPicker(false);
    setShowSnippets(false);
    setShowHeaders(false);
    setShowMentions(false);
    setShowTimestamps(false);
  };

  const insertAtCursor = (textToInsert, offset = textToInsert.length) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const newText = text.substring(0, start) + textToInsert + text.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + offset, start + offset);
    }, 0);
  };

  const applyMarkdown = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const applyListFormat = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    if (start === end) {
      const textBeforeCursor = text.substring(0, start);
      const isNewLine = start === 0 || textBeforeCursor.endsWith('\n');
      const prefix = isNewLine ? '- ' : '\n- ';
      const newText = text.substring(0, start) + prefix + text.substring(start);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    } else {
      const selectedText = text.substring(start, end);
      const lines = selectedText.split('\n');
      const newSelectedText = lines.map(line => line.trim().startsWith('-') ? line : `- ${line}`).join('\n');
      
      const newText = text.substring(0, start) + newSelectedText + text.substring(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + newSelectedText.length);
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (isInput) return;
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const text = textarea.value;
      const textBeforeCursor = text.substring(0, start);
      
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      if (currentLine.trim().startsWith('- ') || currentLine.trim().startsWith('* ')) {
        e.preventDefault();
        const prefix = currentLine.substring(0, currentLine.indexOf(' ') + 1);
        
        if (currentLine.trim() === prefix.trim()) {
           const newText = text.substring(0, start - prefix.length) + '\n' + text.substring(start);
           onChange(newText);
           setTimeout(() => {
             textarea.focus();
             textarea.setSelectionRange(start - prefix.length + 1, start - prefix.length + 1);
           }, 0);
           return;
        }

        const newText = textBeforeCursor + '\n' + prefix + text.substring(start);
        onChange(newText);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 1 + prefix.length, start + 1 + prefix.length);
        }, 0);
      }
    }
  };

  const Component = isInput ? 'input' : 'textarea';

  return (
    <div className="textarea-with-toolbar" style={{ position: 'relative' }}>
      <div className="md-toolbar" style={{ marginBottom: '0.5rem' }}>
        <button type="button" className="md-toolbar-btn" onClick={() => applyMarkdown('**', '**')} title="Bold">
          <Bold size={18} />
        </button>
        <button type="button" className="md-toolbar-btn" onClick={() => applyMarkdown('*', '*')} title="Italic">
          <Italic size={18} />
        </button>
        <button type="button" className="md-toolbar-btn" onClick={() => applyMarkdown('__', '__')} title="Underline">
          <Underline size={18} />
        </button>
        <button type="button" className="md-toolbar-btn" onClick={() => applyMarkdown('~~', '~~')} title="Strikethrough">
          <Strikethrough size={18} />
        </button>
        
        <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', margin: '0 0.3rem' }}></div>
        
        <button type="button" className="md-toolbar-btn" onClick={applyListFormat} title="Listă cu Puncte">
          <List size={18} />
        </button>
        <button type="button" className="md-toolbar-btn" onClick={() => applyMarkdown('> ')} title="Quote">
          <Quote size={18} />
        </button>
        <button type="button" className="md-toolbar-btn" onClick={() => applyMarkdown('`', '`')} title="Code Inline">
          <Code size={18} />
        </button>
        
        <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', margin: '0 0.3rem' }}></div>
        
        <button type="button" className="md-toolbar-btn" onClick={() => {closeAllDropdowns(); setShowHeaders(!showHeaders);}} title="Titluri">
          <Heading size={18} style={{ color: showHeaders ? 'var(--primary)' : 'inherit' }} />
        </button>

        <button type="button" className="md-toolbar-btn" onClick={() => {closeAllDropdowns(); setShowMentions(!showMentions);}} title="Mențiuni">
          <AtSign size={18} style={{ color: showMentions ? 'var(--primary)' : 'inherit' }} />
        </button>

        <button type="button" className="md-toolbar-btn" onClick={() => {closeAllDropdowns(); setShowTimestamps(!showTimestamps);}} title="Format Dată / Oră">
          <Clock size={18} style={{ color: showTimestamps ? 'var(--primary)' : 'inherit' }} />
        </button>

        <button type="button" className="md-toolbar-btn" onClick={() => {closeAllDropdowns(); setShowEmojiPicker(!showEmojiPicker);}} title="Emoji Picker">
          <Smile size={18} style={{ color: showEmojiPicker ? 'var(--primary)' : 'inherit' }} />
        </button>
        
        <button type="button" className="md-toolbar-btn" onClick={() => {closeAllDropdowns(); setShowSnippets(!showSnippets);}} title="Text Snippets">
          <FileCode2 size={18} style={{ color: showSnippets ? 'var(--primary)' : 'inherit' }} />
        </button>

        <div style={{ flex: 1 }}></div>
        <button type="button" className="md-toolbar-btn ping" onClick={() => insertAtCursor('@everyone')} title="Ping Everyone">@everyone</button>
        <button type="button" className="md-toolbar-btn ping" onClick={() => insertAtCursor('@here')} title="Ping Here">@here</button>
      </div>

      {showEmojiPicker && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50 }}>
          <EmojiPicker 
            theme={Theme.DARK} 
            onEmojiClick={(emoji) => { insertAtCursor(emoji.emoji); setShowEmojiPicker(false); }}
            width={300}
            height={400}
          />
        </div>
      )}

      {showHeaders && (
        <div style={{ position: 'absolute', top: '100%', left: '160px', zIndex: 50, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', width: '200px', backdropFilter: 'blur(10px)' }}>
          <div style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }} onClick={() => { applyMarkdown('# '); closeAllDropdowns(); }}># H1 (Titlu Principal)</div>
          <div style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }} onClick={() => { applyMarkdown('## '); closeAllDropdowns(); }}>## H2 (Subtitlu)</div>
          <div style={{ padding: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => { applyMarkdown('### '); closeAllDropdowns(); }}>### H3 (Titlu Mic)</div>
        </div>
      )}

      {showMentions && (
        <div style={{ position: 'absolute', top: '100%', left: '190px', zIndex: 50, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', width: '200px', backdropFilter: 'blur(10px)' }}>
          <div style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }} onClick={() => { insertAtCursor('<@User_ID>'); closeAllDropdowns(); }}>@ Mențiune User</div>
          <div style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }} onClick={() => { insertAtCursor('<@&Role_ID>'); closeAllDropdowns(); }}>@ Mențiune Rol</div>
          <div style={{ padding: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => { insertAtCursor('<#Channel_ID>'); closeAllDropdowns(); }}># Link Canal</div>
        </div>
      )}

      {showTimestamps && (
        <div style={{ position: 'absolute', top: '100%', left: '220px', zIndex: 50, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', width: '220px', backdropFilter: 'blur(10px)' }}>
          <div style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }} onClick={() => { insertAtCursor(`<t:${Math.floor(Date.now() / 1000)}:R>`); closeAllDropdowns(); }}>Timp Relativ (ex: acum)</div>
          <div style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }} onClick={() => { insertAtCursor(`<t:${Math.floor(Date.now() / 1000)}:t>`); closeAllDropdowns(); }}>Oră Scurtă (ex: 12:00 PM)</div>
          <div style={{ padding: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => { insertAtCursor(`<t:${Math.floor(Date.now() / 1000)}:D>`); closeAllDropdowns(); }}>Dată Lungă (ex: 20 Iun 2026)</div>
        </div>
      )}

      {showSnippets && (
        <div style={{ position: 'absolute', top: '100%', left: '150px', zIndex: 50, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', width: '250px', backdropFilter: 'blur(10px)' }}>
          {SNIPPETS.map((snip, i) => (
            <div 
              key={i} 
              style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              onClick={() => { insertAtCursor(snip); setShowSnippets(false); }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              {snip}
            </div>
          ))}
        </div>
      )}

      <Component
        type={isInput ? "text" : undefined}
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ ...style }}
      />
    </div>
  );
}

function UpdateMaker() {
  const [isDockOpen, setIsDockOpen] = useState(() => {
    const saved = localStorage.getItem('um_isDockOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('um_zoomLevel_v2');
    return saved !== null ? parseInt(saved, 10) : 75;
  });
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('updateMakerState_v5');
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed };
      } catch (err) { console.error('Failed to parse saved state', err); }
    }
    return INITIAL_STATE;
  });

  const [history, setHistory] = useState([state]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isNotepadMode, setIsNotepadMode] = useState(() => {
    return localStorage.getItem('um_isNotepadMode') === 'true';
  });
  const [notepadValue, setNotepadValue] = useState(() => {
    return localStorage.getItem('um_notepadValue') || "";
  });

  const parseTextToState = (text, currentState) => {
    let newState = JSON.parse(JSON.stringify(currentState));
    
    const textLines = text.split('\n');
    const isGloballyQuoted = textLines.filter(l => l.trim() !== '').length > 0 && textLines.filter(l => l.trim() !== '').every(l => l.startsWith('>'));
    let cleanText = text;
    if (isGloballyQuoted) {
      cleanText = textLines.map(l => l.replace(/^>\s?/, '')).join('\n');
      newState.useBlockquote = true;
    } else {
      newState.useBlockquote = false;
    }

    // 1. Parse Footer first
    let mainContent = cleanText;
    const footerMatch = cleanText.match(/(?:<[─-]+>|^─{5,}$|<[-]{5,}>)/m);
    if (footerMatch) {
       const footerIndex = cleanText.indexOf(footerMatch[0]);
       mainContent = cleanText.substring(0, footerIndex);
       newState.footerText = cleanText.substring(footerIndex).trim();
       newState.showFooter = true;
    } else {
       newState.footerText = '';
       newState.showFooter = false;
    }

    // 2. Extract Intro and Header
    let remaining = mainContent;
    const firstCatIndex = remaining.search(/^### /m);
    let introPart = remaining;
    if (firstCatIndex !== -1) {
       introPart = remaining.substring(0, firstCatIndex);
       remaining = remaining.substring(firstCatIndex);
    } else {
       remaining = '';
    }

    const headerMatch = introPart.match(/^\s*(```[\s\S]*?```)\s*/);
    if (headerMatch && headerMatch.index === 0) {
      newState.headerText = headerMatch[1];
      introPart = introPart.substring(headerMatch[0].length);
      
      const vMatch = newState.headerText.match(/v\d+\.\d+(\.\d+)?/i) || newState.headerText.match(/`([^`]+)`/);
      if (vMatch) {
         newState.version = vMatch[0].replace(/`/g, '');
      }
    } else {
      newState.headerText = '';
    }

    newState.introText = introPart.trim();

    // 4. Parse Categories
    newState.showBugFixes = false;
    newState.bugFixesText = '';
    
    if (remaining) {
       const catChunks = remaining.split(/### /).filter(c => c.trim() !== '');
       let normalCats = [];
       
       catChunks.forEach((chunk) => {
          const lines = chunk.split('\n');
          const title = lines[0].trim();
          const desc = lines.slice(1).join('\n').trim();
          
          if (title.includes('Bug Fixes & Rezolvări')) {
             newState.showBugFixes = true;
             newState.bugFixesText = desc;
          } else {
             normalCats.push({ title, desc });
          }
       });
       
       normalCats.forEach((catInfo, index) => {
          if (newState.categories[index]) {
             newState.categories[index].title = catInfo.title;
             newState.categories[index].description = catInfo.desc;
          } else {
             newState.categories.push({
                id: Date.now().toString() + index,
                title: catInfo.title,
                description: catInfo.desc,
                descriptionEn: ''
             });
          }
       });
       
       if (normalCats.length < newState.categories.length) {
          newState.categories = newState.categories.slice(0, normalCats.length);
       }
    }

    return newState;
  };
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    const saved = localStorage.getItem('um_isSettingsOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [isDraftsOpen, setIsDraftsOpen] = useState(() => {
    const saved = localStorage.getItem('um_isDraftsOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [isFooterOpen, setIsFooterOpen] = useState(() => {
    const saved = localStorage.getItem('um_isFooterOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [isBugFixesOpen, setIsBugFixesOpen] = useState(() => {
    const saved = localStorage.getItem('um_isBugFixesOpen');
    return saved !== null ? saved === 'true' : true;
  });

  const [mediaManagerOpen, setMediaManagerOpen] = useState(false);
  const [mediaManagerTarget, setMediaManagerTarget] = useState('avatar');
  const [mediaTab, setMediaTab] = useState('url');
  const [tempMediaUrl, setTempMediaUrl] = useState('');

  const [collapsedCategories, setCollapsedCategories] = useState(() => {
    const saved = localStorage.getItem('um_collapsedCategories');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [savedTemplates, setSavedTemplates] = useState(() => {
    const saved = localStorage.getItem('updateMakerTemplates');
    return saved ? JSON.parse(saved) : {};
  });

  const [savedHeaders, setSavedHeaders] = useState(() => {
    const saved = localStorage.getItem('um_savedHeaders');
    if (saved) {
      try { return JSON.parse(saved); } catch { return {}; }
    }
    return {
      'Clasic': '```yaml\n──────── ⧼ UPDATE `v1.0.0` ⧽ ────────\n```',
      'Modern (Patch)': '```yaml\n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n                                       /// UPDATE PATCH v1.0.0 ///               \n▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n```'
    };
  });
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const currentStateStr = JSON.stringify(state);
      
      // If the current state is the same as the current history step, do nothing
      if (history[historyIndex] && JSON.stringify(history[historyIndex]) === currentStateStr) {
        return;
      }
      
      // Otherwise, add a new step
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(currentStateStr));
      
      if (newHistory.length > 30) newHistory.shift();
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }, 500);
    
    return () => clearTimeout(timerRef.current);
  }, [state, history, historyIndex]);

  useEffect(() => {
    localStorage.setItem('updateMakerState_v5', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('updateMakerTemplates', JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  useEffect(() => {
    localStorage.setItem('um_savedHeaders', JSON.stringify(savedHeaders));
  }, [savedHeaders]);

  useEffect(() => { localStorage.setItem('um_isDockOpen', isDockOpen); }, [isDockOpen]);
  useEffect(() => { localStorage.setItem('um_zoomLevel_v2', zoomLevel); }, [zoomLevel]);
  useEffect(() => { localStorage.setItem('um_isNotepadMode', isNotepadMode); }, [isNotepadMode]);
  useEffect(() => { localStorage.setItem('um_notepadValue', notepadValue); }, [notepadValue]);
  useEffect(() => { localStorage.setItem('um_isSettingsOpen', isSettingsOpen); }, [isSettingsOpen]);
  useEffect(() => { localStorage.setItem('um_isDraftsOpen', isDraftsOpen); }, [isDraftsOpen]);
  useEffect(() => { localStorage.setItem('um_isFooterOpen', isFooterOpen); }, [isFooterOpen]);
  useEffect(() => { localStorage.setItem('um_isBugFixesOpen', isBugFixesOpen); }, [isBugFixesOpen]);
  useEffect(() => { localStorage.setItem('um_collapsedCategories', JSON.stringify(collapsedCategories)); }, [collapsedCategories]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [history, historyIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore global undo/redo if typing inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, isZenMode]);

  const updateState = (key, value) => setState(s => ({ ...s, [key]: value }));

  const addCategory = () => {
    setState(s => ({
      ...s,
      categories: [...s.categories, { id: Date.now().toString(), title: '🆕 Categorie Nouă', description: '', descriptionEn: '' }]
    }));
  };

  const deleteCategory = (id) => {
    setState(s => ({ ...s, categories: s.categories.filter(c => c.id !== id) }));
  };

  const moveCategory = (index, dir) => {
    setState(s => {
      const newCats = [...s.categories];
      if (dir === 'up' && index > 0) {
        [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
      } else if (dir === 'down' && index < newCats.length - 1) {
        [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
      }
      return { ...s, categories: newCats };
    });
  };

  const updateCategory = (id, field, value) => {
    setState(s => ({
      ...s,
      categories: s.categories.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const toggleCategoryCollapse = (id) => {
    setCollapsedCategories(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const saveTemplate = () => {
    const name = prompt("Introdu un nume pentru acest șablon (ex: Wipe Update):");
    if (name) {
      setSavedTemplates(prev => ({ ...prev, [name]: state }));
      alert(`Șablonul "${name}" a fost salvat cu succes!`);
    }
  };

  const loadTemplate = (e) => {
    const name = e.target.value;
    if (name && savedTemplates[name]) {
      if (window.confirm(`Ești sigur că vrei să încarci șablonul "${name}"? Vei pierde modificările nesalvate.`)) {
        setState(savedTemplates[name]);
      }
    }
    e.target.value = "";
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `UpdateMaker_Backup_${state.version}.json`;
    link.click();
  };

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedState = JSON.parse(e.target.result);
          if (importedState && importedState.categories) {
            setState(importedState);
            alert("Date importate cu succes!");
          } else {
            alert("Fișier JSON invalid sau corupt.");
          }
        } catch {
          alert("Eroare la citirea fișierului JSON.");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const openMediaManager = (target) => {
    setMediaManagerTarget(target);
    setTempMediaUrl(target === 'avatar' ? state.avatarUrl : state.imageUrl);
    setMediaTab('url');
    setMediaManagerOpen(true);
  };

  const closeMediaManager = () => {
    setMediaManagerOpen(false);
  };

  const applyMediaManager = () => {
    if (mediaManagerTarget === 'avatar') {
      updateState('avatarUrl', tempMediaUrl);
    } else {
      updateState('imageUrl', tempMediaUrl);
    }
    closeMediaManager();
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setTempMediaUrl(e.target.result);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleSteamFetch = async () => {
    if (tempMediaUrl.includes('steamcommunity.com/id/') || tempMediaUrl.includes('steamcommunity.com/profiles/')) {
      try {
        let proxyUrl = `https://corsproxy.io/?${encodeURIComponent(tempMediaUrl)}`;
        let response = await fetch(proxyUrl).catch(() => null);
        
        if (!response || !response.ok) {
          proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(tempMediaUrl)}`;
          response = await fetch(proxyUrl);
        }
        
        const text = await response.text();
        
        // Sometimes allorigins wraps in JSON, codetabs/corsproxy returns raw text
        let html = text;
        try {
          const json = JSON.parse(text);
          if (json.contents) html = json.contents;
        } catch {
          // Fallback to raw HTML
        }

        const match = html.match(/<meta property="og:image" content="(.*?)"/);
        if (match && match[1]) {
          setTempMediaUrl(match[1]);
        } else {
          alert('Nu am putut găsi imaginea profilului!');
        }
      } catch (err) {
        console.error('Failed to fetch Steam avatar', err);
        alert('Eroare la preluarea profilului. Posibil ca un AdBlocker (ex: uBlock Origin, Brave) să blocheze conexiunea.');
      }
    } else {
      alert('Te rugăm să introduci un link valid de profil Steam (ex: https://steamcommunity.com/id/...)');
    }
  };

  const resetToDefault = () => {
    if (window.confirm("Ești sigur că vrei să resetezi totul la template-ul original? Vei pierde modificările curente.")) {
      setState(INITIAL_STATE);
    }
  };

  const loadPreset = (presetName) => {
    if (window.confirm("Atenție! Încărcarea unui șablon îți va suprascrie textul și categoriile curente. Ești sigur că vrei să continui?")) {
       if (presetName === 'default') {
          setState({ ...INITIAL_STATE, version: state.version });
       } else if (presetName === 'website') {
          setState({ ...PRESET_TEMPLATE_2, version: state.version });
       }
    }
  };

  const getCurrentDateFormatted = () => {
    const d = new Date();
    const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getDiscordTime = () => {
    const d = new Date();
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    return `Today at ${hours}:${minutes} ${ampm}`;
  };

  const generateText = (lang = 'RO') => {
    let result = '';
    if (state.headerText && state.headerText.trim() !== '') {
       result += `${state.headerText}\n`;
    } else {
       result += '```yaml\n──────── ⧼ UPDATE';
       if (state.version) result += ` \`${state.version}\``;
       if (state.showDate) result += ` (${getCurrentDateFormatted()})`;
       result += ` ⧽ ────────\n\`\`\`\n`;
    }

    if (state.showIntro && state.introText.trim() !== '') {
      result += `${state.introText.trim()}\n`;
    }

    state.categories.forEach(cat => {
      const titleText = cat.title.startsWith('#') ? cat.title : `### ${cat.title}`;
      result += `${titleText}\n`;
      const desc = lang === 'EN' ? cat.descriptionEn : cat.description;
      if (desc && desc.trim() !== '') {
        result += `${desc.trim()}\n`;
      }
      result += '\n';
    });

    if (state.showBugFixes) {
      result += `### 🛠️ Bug Fixes & Rezolvări\n`;
      const bugDesc = lang === 'EN' && state.bugFixesTextEn ? state.bugFixesTextEn : state.bugFixesText;
      if (bugDesc && bugDesc.trim() !== '') {
        result += `${bugDesc.trim()}\n`;
      }
      result += '\n';
    }

    if (state.showFooter) result += `${state.footerText}\n\n`;
    if (state.imageUrl) result += `${state.imageUrl}`;

    result = result.trim();
    if (state.useBlockquote) {
      result = result.split('\n').map(line => `> ${line}`).join('\n');
    }

    return result;
  };

  const generatedText = generateText('RO');
  const generatedTextEn = state.isDualLanguage ? generateText('EN') : '';
  const finalDiscordText = state.isDualLanguage ? `${generatedText}\n\n${generatedTextEn}` : generatedText;
  
  useEffect(() => {
    if (!isNotepadMode) {
      // eslint-disable-next-line
      setNotepadValue(finalDiscordText);
    }
  }, [finalDiscordText, isNotepadMode]);

  const handleNotepadChange = (e) => {
    const val = e.target.value;
    setNotepadValue(val);
    try {
      const parsed = parseTextToState(val, state);
      setState(parsed);
    } catch {
      // ignore parsing errors while typing
    }
  };

  const charCount = (isNotepadMode ? notepadValue : finalDiscordText).length;
  const isOverLimit = charCount > 4000;

  const handleCopy = () => {
    navigator.clipboard.writeText(isNotepadMode ? notepadValue : finalDiscordText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportImage = async () => {
    const element = document.querySelector('.preview-box-container');
    if (!element) return;
    
    setExporting(true);
    try {
      const originalRadius = element.style.borderRadius;
      element.style.borderRadius = '0px';
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#06090e',
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      element.style.borderRadius = originalRadius;
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `Update_${state.version}.png`;
      link.click();
    } catch (e) {
      alert("Eroare la generarea imaginii: " + e.message);
    }
    setExporting(false);
  };

  const renderDiscordPreview = (text) => {
    if (!text) return null;

    let isGlobalQuote = false;
    const linesCheck = text.split('\n');
    if (linesCheck.filter(l => l.trim() !== '').length > 0 && linesCheck.filter(l => l.trim() !== '').every(l => l.startsWith('>'))) {
       isGlobalQuote = true;
       text = linesCheck.map(l => l.replace(/^>\s?/, '')).join('\n');
    }

    // Simple code block extraction to not parse inside
    let blocks = [];
    const textWithBlocksReplaced = text.replace(/```([a-z0-9_+\-.]+)?\n?([\s\S]*?)```/gi, (match, lang, code) => {
      blocks.push({ lang: (lang || '').toLowerCase(), code });
      return `\n%%%BLOCK_${blocks.length - 1}%%%\n`;
    });

    const lines = textWithBlocksReplaced.split('\n');
    
    const renderedLines = lines.map((line, lineIdx) => {
      const blockMatch = line.trim().match(/^%%%BLOCK_(\d+)%%%$/);
      if (blockMatch) {
        const blockIndex = parseInt(blockMatch[1]);
        const block = blocks[blockIndex];
        
        let highlighted = block.code.trimEnd();
        if (block.lang && hljs.getLanguage(block.lang)) {
          try {
            highlighted = hljs.highlight(block.code.trimEnd(), { language: block.lang }).value;
          } catch {
             // ignore parsing error
          }
        } else if (block.lang === 'fix') {
           // fallback for fix (yellow text in discord)
           highlighted = `<span style="color: #e2b714">${block.code.trimEnd()}</span>`;
        }
        
        return (
          <div key={lineIdx} className="discord-code-block hljs" dangerouslySetInnerHTML={{ __html: highlighted || ' ' }} />
        );
      }

      if (line.trim() === '') return <div key={lineIdx} style={{ height: '1.375rem' }}></div>;

      let isHeader = false;
      let headerLevel = 0;
      let isBullet = false;
      let parsedLine = line.trim();
      
      const emojis = {
        ':globe_with_meridians:': '🌐',
        ':chart_with_upwards_trend:': '📈',
        ':coin:': '🪙',
        ':shopping_cart:': '🛒',
        ':bar_chart:': '📊',
        ':technologist:': '🧑‍💻',
        ':white_check_mark:': '✅',
        ':x:': '❌',
        ':trophy:': '🏆'
      };
      for (const [shortcode, emoji] of Object.entries(emojis)) {
        parsedLine = parsedLine.replaceAll(shortcode, emoji);
      }

      if (parsedLine.startsWith('- ')) {
        isBullet = true;
        parsedLine = parsedLine.substring(2);
      } else if (parsedLine.startsWith('### ')) { isHeader = true; headerLevel = 3; parsedLine = parsedLine.substring(4); }
      else if (parsedLine.startsWith('## ')) { isHeader = true; headerLevel = 2; parsedLine = parsedLine.substring(3); }
      else if (parsedLine.startsWith('# ')) { isHeader = true; headerLevel = 1; parsedLine = parsedLine.substring(2); }

      let isQuote = false;
      if (parsedLine.startsWith('> ')) {
        isQuote = true;
        parsedLine = parsedLine.substring(2);
      }
      
      const parts = parsedLine.split(/(`.*?`|\*\*.*?\*\*|\*.*?\*|__.*?__|~~.*?~~|\|\|.*?\|\||<@&?\d+>|<#\d+>|@everyone|@here|<t:\d+:[RtdDF]?>)/g);
      
      const renderedParts = parts.map((part, pIdx) => {
        if (!part) return null;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={pIdx}>{part.slice(1, -1)}</code>;
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*')) return <em key={pIdx}>{part.slice(1, -1)}</em>;
        if (part.startsWith('__') && part.endsWith('__')) return <u key={pIdx}>{part.slice(2, -2)}</u>;
        if (part.startsWith('~~') && part.endsWith('~~')) return <s key={pIdx}>{part.slice(2, -2)}</s>;
        if (part.startsWith('||') && part.endsWith('||')) return <span key={pIdx} className="discord-spoiler">{part.slice(2, -2)}</span>;
        if (part.startsWith('@') || part.startsWith('<@') || part.startsWith('<#')) return <span key={pIdx} style={{ color: '#c9cdfb', backgroundColor: 'rgba(88, 101, 242, 0.3)', padding: '0 4px', borderRadius: '3px', fontWeight: 500 }}>{part}</span>;
        if (part.startsWith('<t:')) return <span key={pIdx} style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0 4px', borderRadius: '3px', fontSize: '0.9em' }}>{part}</span>;
        
        if (part.match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/i)) {
          return <span key={pIdx} style={{ color: '#00a8fc' }}>{part}</span>;
        }

        return <span key={pIdx}>{part}</span>;
      });

      const lineContent = <>{renderedParts}</>;
      if (isHeader) {
        const fontSize = headerLevel === 1 ? '1.5rem' : headerLevel === 2 ? '1.25rem' : '1.1rem';
        return <div key={lineIdx} style={{ margin: '0.75rem 0 0.25rem 0', fontWeight: 'bold', fontSize: fontSize, color: '#ffffff' }}>{lineContent}</div>;
      }
      if (isQuote) return <blockquote key={lineIdx}>{lineContent}</blockquote>;
      if (isBullet) return (
        <div key={lineIdx} style={{ display: 'flex', minHeight: '1.375rem', paddingLeft: '0.5rem', marginBottom: '2px' }}>
          <span style={{ marginRight: '0.5rem', color: '#dbdee1' }}>•</span>
          <div>{lineContent}</div>
        </div>
      );
      return <div key={lineIdx} style={{ minHeight: '1.375rem' }}>{lineContent}</div>;
    });

    if (isGlobalQuote) {
      return <blockquote style={{ margin: 0, padding: 0, borderLeft: '4px solid #4e5058', paddingLeft: '0.75rem' }}>{renderedLines}</blockquote>;
    }
    return renderedLines;
  };



  return (
    <div className={`app-container ${isZenMode ? 'zen-mode' : ''}`} style={{ '--embed-color': state.embedColor }}>
      {isZenMode && (
        <button className="zen-toggle-btn" onClick={() => setIsZenMode(false)}>
          <Minimize size={18} /> Ieși din Focus Mode (Esc)
        </button>
      )}

      <div className="editor-section">
        <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
          <Link to="/" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', padding: '0.5rem 0.75rem', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Înapoi Acasă
          </Link>
        </div>
        
        <h1 style={{ marginTop: '0', marginBottom: '0.5rem' }}>Update Maker <Sparkles size={32} style={{ display: 'inline', color: 'var(--accent)' }} /></h1>
        <p style={{ fontSize: '0.85rem', color: '#23a559', marginTop: '0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Check size={14} /> Toate modificările sunt salvate automat local.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button className="btn btn-outline" onClick={() => loadPreset('default')} style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <FileCode2 size={20} /> Șablon Implicit (Clasic)
          </button>
          <button className="btn btn-outline" onClick={() => loadPreset('website')} style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <Sparkles size={20} /> Șablon Nou (Website & Mngmt)
          </button>
        </div>

        <div className="general-settings">
          <h2 className={`section-title ${!isSettingsOpen ? 'closed' : ''}`} onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
            <ChevronDown className="chevron" size={22} /> <Settings size={22} style={{ color: 'var(--primary)' }} /> Setări Generale
          </h2>
          
          <div className={`collapse-wrapper ${isSettingsOpen ? 'open' : ''}`}>
            <div className="collapse-inner">
              <div className="category-card" style={{ marginBottom: '3rem' }}>
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                    <label style={{ marginBottom: 0 }}>Antet (Header / Titlul Update-ului)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select 
                        className="btn btn-outline btn-sm" 
                        onChange={(e) => {
                          if (e.target.value && savedHeaders[e.target.value]) {
                            updateState('headerText', savedHeaders[e.target.value]);
                          }
                          e.target.value = "";
                        }}
                        style={{ padding: '4px 8px', height: 'auto', fontSize: '0.8rem', cursor: 'pointer' }}
                        value=""
                      >
                        <option value="" disabled>Alege șablon...</option>
                        {Object.keys(savedHeaders).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <button 
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px', height: 'auto', fontSize: '0.8rem' }}
                        onClick={() => {
                          const name = prompt("Introdu un nume pentru acest șablon de antet (dacă există deja, va fi suprascris):");
                          if (name && name.trim()) {
                            setSavedHeaders(prev => ({ ...prev, [name.trim()]: state.headerText }));
                            alert(`Șablonul de antet "${name.trim()}" a fost salvat/suprascris!`);
                          }
                        }}
                        title="Salvează textul curent ca șablon pentru a-l refolosi"
                      >
                        <Save size={14} style={{ marginRight: '4px' }} /> Salvează
                      </button>
                    </div>
                  </div>
                  <TextareaWithToolbar 
                    value={state.headerText}
                    onChange={(val) => updateState('headerText', val)}
                    placeholder="Ex: ```yaml&#10;/// UPDATE PATCH v1.0.0 ///&#10;```"
                  />
                </div>

                <div className="input-group flex-row" style={{ marginTop: '1.5rem' }}>
                  <div>
                    <label>Imagine Principală</label>
                    <button className="btn btn-outline" onClick={() => openMediaManager('image')} style={{ width: '100%', height: '43px', display: 'flex', justifyContent: 'center' }}>
                      <ImageIcon size={16} /> Gestionează Imaginea
                    </button>
                  </div>
                  <div>
                    <label>Avatar Server</label>
                    <button className="btn btn-outline" onClick={() => openMediaManager('avatar')} style={{ width: '100%', height: '43px', display: 'flex', justifyContent: 'center' }}>
                      <UserIcon size={16} /> Gestionează Avatarul
                    </button>
                  </div>
                </div>

                <hr style={{ margin: '1.5rem 0' }} />

                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="useBlockquote" 
                    checked={state.useBlockquote} 
                    onChange={(e) => updateState('useBlockquote', e.target.checked)} 
                  />
                  <label htmlFor="useBlockquote">Încadrează tot mesajul într-un citat (Blockquote cu linia gri pe stânga)</label>
                </div>

                <div className="checkbox-group" style={{ marginTop: '0.75rem' }}>
                  <input 
                    type="checkbox" 
                    id="showIntro" 
                    checked={state.showIntro} 
                    onChange={(e) => updateState('showIntro', e.target.checked)} 
                  />
                  <label htmlFor="showIntro">Afișează Mesaj Introductiv</label>
                </div>

                {state.showIntro && (
                  <div className="input-group" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                    <TextareaWithToolbar 
                      value={state.introText}
                      onChange={(val) => updateState('introText', val)}
                      placeholder="Ex: Salutare! Azi venim cu un update masiv care aduce..."
                      style={{ minHeight: '80px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2><MessageSquare size={22} style={{ color: 'var(--primary)' }} /> Categorii Update</h2>
        </div>
        
        <div className="category-list">
          {state.categories.map((cat, index) => (
            <div key={cat.id} className="category-card">
              <div className="category-header">
                <div className="move-btn-group">
                  <button className="btn-move" onClick={() => moveCategory(index, 'up')} disabled={index === 0}><ChevronUp size={20} /></button>
                  <button className="btn-move" onClick={() => moveCategory(index, 'down')} disabled={index === state.categories.length - 1}><ChevronDown size={20} /></button>
                </div>
                <div className="input-group" style={{ flex: 1, margin: 0 }}>
                  <label style={{ marginBottom: '0.2rem' }}>Titlu Categorie {index + 1}</label>
                  <TextareaWithToolbar 
                    isInput={true}
                    value={cat.title} 
                    onChange={(val) => updateCategory(cat.id, 'title', val)}
                    placeholder="Ex: 🌐 Improvement La Website"
                  />
                </div>
                <button className="btn btn-outline btn-icon" onClick={() => toggleCategoryCollapse(cat.id)} title="Ascunde/Arată Categoria" style={{ alignSelf: 'flex-end', marginBottom: '0.2rem', padding: '0.5rem', height: '40px' }}>
                  <ChevronDown size={22} style={{ transform: collapsedCategories.includes(cat.id) ? 'rotate(-90deg)' : 'none', transition: 'transform 0.3s' }} />
                </button>
                <button className="btn btn-danger btn-icon" onClick={() => deleteCategory(cat.id)} title="Șterge Categoria" style={{ alignSelf: 'flex-end', marginBottom: '0.2rem' }}>
                  <Trash2 size={22} />
                </button>
              </div>

              <div className={`collapse-wrapper ${!collapsedCategories.includes(cat.id) ? 'open' : ''}`}>
                <div className="collapse-inner">
                  <div className="change-list">
                    <div className="change-item" style={{ padding: '0.5rem 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: state.isDualLanguage ? 'row' : 'column', gap: '1.5rem' }}>
                      <div className="change-inputs" style={{ flex: 1 }}>
                        {state.isDualLanguage && <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limba Principală (Ex: RO)</label>}
                        <TextareaWithToolbar 
                          placeholder="Descriere detaliată a schimbărilor... (ex: - Am adăugat X)"
                          value={cat.description || ''}
                          onChange={(val) => updateCategory(cat.id, 'description', val)}
                          style={{ minHeight: '120px' }}
                        />
                      </div>
                      {state.isDualLanguage && (
                        <div className="change-inputs" style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limba Secundară (Ex: EN)</label>
                          <TextareaWithToolbar 
                            placeholder="Detailed description... (ex: - Added X)"
                            value={cat.descriptionEn || ''}
                            onChange={(val) => updateCategory(cat.id, 'descriptionEn', val)}
                            style={{ minHeight: '120px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={addCategory} style={{ width: '100%', padding: '1rem', marginBottom: '3rem' }}>
          <Plus size={22} /> ADAUGĂ O NOUĂ CATEGORIE
        </button>

        <div className="bug-fixes-settings">
          <h2 className={`section-title ${!isBugFixesOpen ? 'closed' : ''}`} onClick={() => setIsBugFixesOpen(!isBugFixesOpen)}>
            <ChevronDown className="chevron" size={22} /> <FileCode2 size={22} style={{ color: 'var(--primary)' }} /> Bug Fixes & Rezolvări
          </h2>
          <div className={`collapse-wrapper ${isBugFixesOpen ? 'open' : ''}`}>
            <div className="collapse-inner">
              <div className="category-card" style={{ marginBottom: '3rem' }}>
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="showBugFixes" 
                    checked={state.showBugFixes} 
                    onChange={(e) => updateState('showBugFixes', e.target.checked)} 
                  />
                  <label htmlFor="showBugFixes">Afișează secțiunea de Bug Fixes</label>
                </div>
                
                {state.showBugFixes && (
                  <div className="change-item" style={{ padding: '1.5rem', display: 'flex', flexDirection: state.isDualLanguage ? 'row' : 'column', gap: '1.5rem', marginTop: '1.5rem', background: 'rgba(0,0,0,0.1)' }}>
                    <div className="change-inputs" style={{ flex: 1 }}>
                      {state.isDualLanguage && <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limba Principală (Ex: RO)</label>}
                      <TextareaWithToolbar 
                        value={state.bugFixesText}
                        onChange={(val) => updateState('bugFixesText', val)}
                        style={{ minHeight: '120px' }}
                        placeholder="Ex: ```fix&#10;- Am reparat bug-ul X&#10;```"
                      />
                    </div>
                    {state.isDualLanguage && (
                      <div className="change-inputs" style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limba Secundară (Ex: EN)</label>
                        <TextareaWithToolbar 
                          value={state.bugFixesTextEn || ''}
                          onChange={(val) => updateState('bugFixesTextEn', val)}
                          style={{ minHeight: '120px' }}
                          placeholder="Ex: ```fix&#10;- Fixed bug X&#10;```"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="general-settings">
          <h2 className={`section-title ${!isDraftsOpen ? 'closed' : ''}`} onClick={() => setIsDraftsOpen(!isDraftsOpen)}>
            <ChevronDown className="chevron" size={22} /> <ScrollText size={22} style={{ color: 'var(--primary)' }} /> Idei în Lucru (Drafts / WIP)
          </h2>
          <div className={`collapse-wrapper ${isDraftsOpen ? 'open' : ''}`}>
            <div className="collapse-inner">
              <div className="category-card" style={{ marginBottom: '3rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Notează aici ideile de update-uri în timpul săptămânii, ca să nu le uiți. (Acest text NU apare în mesajul final de Discord).</p>
                <TextareaWithToolbar 
                  value={state.drafts}
                  onChange={(val) => updateState('drafts', val)}
                  placeholder="Ex: De reparat bug-ul X. Am adăugat comanda /test..."
                  style={{ minHeight: '120px', backgroundColor: 'rgba(0,0,0,0.3)' }}
                />
              </div>
            </div>
          </div>
        </div>

        <hr />
        
        <div className="footer-settings">
          <h2 className={`section-title ${!isFooterOpen ? 'closed' : ''}`} onClick={() => setIsFooterOpen(!isFooterOpen)}>
            <ChevronDown className="chevron" size={22} /> <Check size={22} style={{ color: 'var(--primary)' }} /> Încheiere / Footer
          </h2>
          <div className={`collapse-wrapper ${isFooterOpen ? 'open' : ''}`}>
            <div className="collapse-inner">
              <div className="category-card">
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="showFooter" 
                    checked={state.showFooter} 
                    onChange={(e) => updateState('showFooter', e.target.checked)} 
                  />
                  <label htmlFor="showFooter">Afișează textul de încheiere (reacții)</label>
                </div>
                
                {state.showFooter && (
                  <div className="input-group" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                    <TextareaWithToolbar 
                      value={state.footerText}
                      onChange={(val) => updateState('footerText', val)}
                      style={{ minHeight: '150px' }}
                      placeholder="Text de încheiere și reacții..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="preview-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Sparkles size={20} className="text-primary" /> Discord Preview
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className={`char-counter ${isOverLimit ? 'over-limit' : ''}`} style={{ fontWeight: 'bold', color: isOverLimit ? 'var(--danger)' : 'var(--text-muted)' }}>
              {charCount} / 4000 caractere
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`btn btn-sm ${!isNotepadMode ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setIsNotepadMode(false)}
              >
                👁️ Vizual
              </button>
              <button 
                className={`btn btn-sm ${isNotepadMode ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setIsNotepadMode(true)}
              >
                📝 Notepad
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button className="btn btn-primary" onClick={handleCopy} style={{ flex: 1 }}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copiat!' : 'Copiaza Textul'}
          </button>
          <button className="btn btn-outline" onClick={handleExportImage} disabled={exporting} title="Descarcă ca Poza (Hi-Res)">
            <ImageDown size={18} /> {exporting ? 'Se randează...' : 'Exportă Poza'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button className="btn btn-outline btn-icon" onClick={() => setZoomLevel(z => Math.max(50, z - 10))} title="Zoom Out" style={{ border: 'none', background: 'transparent' }}>
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', minWidth: '45px', textAlign: 'center' }}>{zoomLevel}%</span>
            <button className="btn btn-outline btn-icon" onClick={() => setZoomLevel(z => Math.min(150, z + 10))} title="Zoom In" style={{ border: 'none', background: 'transparent' }}>
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        <div className="preview-box-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ zoom: `${zoomLevel}%`, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="discord-mock-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Hash size={20} color="#80848e" /> updates-log
            </div>
          </div>
          
          <div className="discord-message-container" style={{ flex: 1 }}>
            <div className="discord-avatar" style={{ backgroundImage: `url(${state.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'})`, cursor: 'pointer' }} title="Apasă pentru a schimba poza" onClick={() => openMediaManager('avatar')}>
            </div>
            <div className="discord-message-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="discord-author">
                <span className="discord-username">IANNC</span>
                <span className="discord-bot-tag" style={{ background: '#5865F2', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '3px', marginLeft: '6px', display: 'inline-flex', alignItems: 'center' }}><Check size={10} style={{marginRight: '2px'}}/> BOT</span>
                <span className="discord-timestamp" style={{ marginLeft: '0.5rem' }}>{getDiscordTime()}</span>
              </div>
              
              {isNotepadMode ? (
                <textarea
                  className="notepad-textarea"
                  value={notepadValue}
                  onChange={handleNotepadChange}
                  spellCheck="false"
                  style={{
                    flex: 1,
                    width: '100%',
                    background: '#1e1f22',
                    color: '#dbdee1',
                    border: 'none',
                    padding: '1rem',
                    fontFamily: 'Consolas, "Courier New", monospace',
                    fontSize: '0.95rem',
                    resize: 'none',
                    outline: 'none',
                    borderRadius: '4px',
                    marginTop: '0.5rem',
                    minHeight: '600px'
                  }}
                />
              ) : (
                <div className="discord-mock-body">
                  {renderDiscordPreview(generatedText)}
                  
                  {state.isDualLanguage && (
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                      {renderDiscordPreview(generatedTextEn)}
                    </div>
                  )}
                  
                  {state.imageUrl && (state.imageUrl.match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/i) || state.imageUrl.startsWith('data:image')) && (
                    <div style={{ marginTop: '1rem', cursor: 'pointer' }} onClick={() => openMediaManager('image')} title="Click pentru a schimba imaginea atașată">
                      <img src={state.imageUrl} alt="Message Attachment" style={{ borderRadius: '8px', maxWidth: '400px', maxHeight: '400px', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>

      <div className={`macos-dock ${!isDockOpen ? 'collapsed' : ''}`}>
        <button className="dock-item dock-blue" onClick={undo} disabled={historyIndex === 0} data-tooltip="Undo (Ctrl+Z)">
          <Undo2 size={22} />
        </button>
        <button className="dock-item dock-blue" onClick={redo} disabled={historyIndex === history.length - 1} data-tooltip="Redo (Ctrl+Y)">
          <Redo2 size={22} />
        </button>
        
        <div className="dock-divider"></div>
        
        <button className="dock-item dock-purple" onClick={() => setIsZenMode(true)} data-tooltip="Focus Mode">
          <Maximize size={22} />
        </button>
        <button className={`dock-item dock-blue ${state.isDualLanguage ? 'active' : ''}`} onClick={() => updateState('isDualLanguage', !state.isDualLanguage)} data-tooltip="Multi-Language">
          <Languages size={22} />
        </button>
        
        <div className="dock-divider"></div>

        <div className="dock-item dock-orange" data-tooltip="Încarcă Șablon" style={{ position: 'relative' }}>
          <FolderOpen size={22} />
          <select className="hidden-select" onChange={loadTemplate} value="" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}>
            <option value="" disabled>📁 Încarcă...</option>
            {Object.keys(savedTemplates).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <button className="dock-item dock-green" onClick={saveTemplate} data-tooltip="Salvează Șablon curent">
          <Save size={22} />
        </button>
        
        <div className="dock-divider"></div>

        <button className="dock-item dock-teal" onClick={handleExportJson} data-tooltip="Export Proiect (.json)">
          <Download size={22} />
        </button>
        <label className="dock-item dock-teal" data-tooltip="Import Proiect (.json)">
          <Upload size={22} />
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJson} />
        </label>
        
        <div className="dock-divider"></div>
        
        <button className="dock-item dock-red" onClick={resetToDefault} data-tooltip="Reset (Clear all)">
          <RotateCcw size={22} />
        </button>

        <div className="dock-divider"></div>

        <button className="dock-item" onClick={() => setIsDockOpen(false)} data-tooltip="Ascunde">
          <ChevronDown size={22} color="var(--text-muted)" />
        </button>
      </div>

      <button className={`dock-toggle-bringback ${!isDockOpen ? 'visible' : ''}`} onClick={() => setIsDockOpen(true)} title="Afișează Meniul">
        <ChevronUp size={20} />
      </button>

      {mediaManagerOpen && (
        <div className="modal-overlay" onClick={closeMediaManager}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{mediaManagerTarget === 'avatar' ? 'Setări Avatar Server' : 'Setări Imagine Update'}</h2>
              <button className="modal-close" onClick={closeMediaManager}><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              <div className="modal-tabs">
                <button className={`modal-tab ${mediaTab === 'url' ? 'active' : ''}`} onClick={() => setMediaTab('url')}>
                  <LinkIcon size={16} /> Link Direct
                </button>
                <button className={`modal-tab ${mediaTab === 'upload' ? 'active' : ''}`} onClick={() => setMediaTab('upload')}>
                  <Upload size={16} /> PC Upload
                </button>
                {mediaManagerTarget === 'avatar' && (
                  <button className={`modal-tab ${mediaTab === 'steam' ? 'active' : ''}`} onClick={() => setMediaTab('steam')}>
                    <UserIcon size={16} /> Profil Steam
                  </button>
                )}
              </div>

              {mediaTab === 'url' && (
                <div className="input-group">
                  <label>URL Imagine</label>
                  <input type="text" value={tempMediaUrl} onChange={(e) => setTempMediaUrl(e.target.value)} placeholder="Ex: https://i.imgur.com/example.png" />
                </div>
              )}

              {mediaTab === 'upload' && (
                <div className="input-group" style={{ alignItems: 'center', margin: '2rem 0' }}>
                  <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                    <Upload size={18} /> Alege o poză din calculator
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMediaUpload} />
                  </label>
                </div>
              )}

              {mediaTab === 'steam' && (
                <div className="input-group">
                  <label>Link Profil Steam</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={tempMediaUrl} onChange={(e) => setTempMediaUrl(e.target.value)} placeholder="Ex: https://steamcommunity.com/id/1iannc/" style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={handleSteamFetch}>Preia Avatar</button>
                  </div>
                </div>
              )}

              {tempMediaUrl && (
                <div className="modal-preview">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Previzualizare Imagine:</span>
                  {mediaManagerTarget === 'avatar' ? (
                    <img src={tempMediaUrl} alt="Preview" className="modal-preview-avatar" />
                  ) : (
                    <img src={tempMediaUrl} alt="Preview" className="modal-preview-img" />
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', margin: '2rem 0 0 0' }}>
                <button className="btn btn-outline" onClick={closeMediaManager}>Anulează</button>
                <button className="btn btn-primary" onClick={applyMediaManager}><Check size={18} /> Salvează și Aplică</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateMaker;
