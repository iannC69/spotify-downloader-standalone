import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Package, Search, Plus, Trash2, Copy,
  Download, RefreshCw, Box, Crosshair, ChevronLeft, ChevronRight,
  Check, Settings, ListChecks, FileJson, X, Save,
  Image, Upload, FolderOpen, Globe, Folder
} from 'lucide-react';
import JSZip from 'jszip';
import Navbar from '../components/Navbar';
import './ToolStudio.css';
import './CaseCreator.css';

/* ═══ Rarity map — maps API rarity ids to our case format ═══ */
const RARITY_MAP = {
  rarity_common_weapon: { label: 'Consumer', value: 'consumer', color: '#b0c3d9', num: 1 },
  rarity_uncommon_weapon: { label: 'Industrial', value: 'industrial', color: '#5e98d9', num: 2 },
  rarity_rare_weapon: { label: 'Mil-Spec', value: 'mil-spec', color: '#4b69ff', num: 3 },
  rarity_mythical_weapon: { label: 'Restricted', value: 'restricted', color: '#8847ff', num: 4 },
  rarity_legendary_weapon: { label: 'Classified', value: 'classified', color: '#d32ce6', num: 5 },
  rarity_ancient_weapon: { label: 'Covert', value: 'covert', color: '#eb4b4b', num: 6 },
  rarity_contraband_weapon: { label: 'Contraband', value: 'contraband', color: '#e4ae39', num: 7 },
  rarity_contraband: { label: 'Contraband', value: 'contraband', color: '#e4ae39', num: 7 },
  rarity_ancient: { label: 'Covert', value: 'covert', color: '#eb4b4b', num: 6 },
  rarity_legendary: { label: 'Classified', value: 'classified', color: '#d32ce6', num: 5 },
  rarity_mythical: { label: 'Restricted', value: 'restricted', color: '#8847ff', num: 4 },
  rarity_rare: { label: 'Mil-Spec', value: 'mil-spec', color: '#4b69ff', num: 3 },
  rarity_uncommon: { label: 'Industrial', value: 'industrial', color: '#5e98d9', num: 2 },
  rarity_common: { label: 'Consumer', value: 'consumer', color: '#b0c3d9', num: 1 },
};

const RARITY_NUM = {
  consumer: 1, industrial: 2, 'mil-spec': 3,
  restricted: 4, classified: 5, covert: 6, contraband: 7,
};

const RARITY_OPTIONS = [
  'consumer', 'industrial', 'mil-spec', 'restricted', 'classified', 'covert', 'contraband',
];

const WEAR_TIERS = [
  { value: 0, label: 'Default (0)' },
  { value: 1, label: 'Factory New' },
  { value: 2, label: 'Minimal Wear' },
  { value: 3, label: 'Field-Tested' },
  { value: 4, label: 'Well-Worn' },
  { value: 5, label: 'Battle-Scarred' },
];

const ITEMS_PER_PAGE = 60;
const API_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';

/* ═══ Default case template ═══ */
const createDefaultCase = (index = 0) => ({
  id: `new_case_${index}`,
  name: `New Case #${index + 1}`,
  price: 100,
  color: '#ccff00',
  enabled: true,
  cooldownSeconds: 30,
  maxOpensPerRound: 3,
  /* Site fields */
  description: '',
  rarityColor: '#ccff00',
  caseImage: null,
  featuredImage: null,
  items: [],
});

/* ═══ Helper: read File as ArrayBuffer ═══ */
const readFileAsArrayBuffer = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });

export default function CaseCreator() {
  const [allSkins, setAllSkins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [weaponFilter, setWeaponFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [cases, setCases] = useState(() => {
    try {
      const saved = localStorage.getItem('case_creator_save');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [createDefaultCase(0)];
  });
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);

  useEffect(() => {
    const toSave = cases.map(c => ({ ...c, caseImage: null, featuredImage: null }));
    localStorage.setItem('case_creator_save', JSON.stringify(toSave));
  }, [cases]);

  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTab, setPreviewTab] = useState('server'); // 'server' | 'site'

  const caseImgRef = useRef(null);
  const featImgRef = useRef(null);
  const importFileRef = useRef(null);

  const activeCase = cases[activeCaseIdx] || cases[0];

  /* ── Folder name from case name ── */
  const folderName = useMemo(
    () => `CASE_${activeCase.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/_+$/, '')}`,
    [activeCase.name]
  );

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  /* ── Fetch skins ── */
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => {
        const filtered = data.filter(
          (s) => s.weapon?.weapon_id && s.paint_index && s.image
        );
        setAllSkins(filtered);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const categoryNames = useMemo(() => {
    const names = new Set();
    allSkins.forEach((s) => s.category?.name && names.add(s.category.name));
    return [...names].sort();
  }, [allSkins]);

  const weaponNames = useMemo(() => {
    const names = new Set();
    allSkins.forEach((s) => s.weapon?.name && names.add(s.weapon.name));
    return [...names].sort();
  }, [allSkins]);

  const filteredSkins = useMemo(() => {
    let result = allSkins;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.weapon?.name?.toLowerCase().includes(q) ||
          s.pattern?.name?.toLowerCase().includes(q)
      );
    }
    if (rarityFilter !== 'all') {
      result = result.filter((s) => RARITY_MAP[s.rarity?.id]?.value === rarityFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter((s) => s.category?.name === categoryFilter);
    }
    if (weaponFilter !== 'all') {
      result = result.filter((s) => s.weapon?.name === weaponFilter);
    }
    return result;
  }, [allSkins, search, rarityFilter, categoryFilter, weaponFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSkins.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedSkins = filteredSkins.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => setPage(1), [search, rarityFilter, categoryFilter, weaponFilter]);

  /* ── CRUD helpers ── */
  const addSkinToCase = useCallback(
    (skin) => {
      setCases((prev) => {
        const next = [...prev];
        const currentCase = next[activeCaseIdx];
        
        const existingIdx = currentCase.items.findIndex(
          (i) => i.weaponIndex === skin.weapon?.weapon_id && i.paintkitIndex === parseInt(skin.paint_index, 10)
        );

        if (existingIdx !== -1) {
          next[activeCaseIdx] = {
            ...currentCase,
            items: currentCase.items.filter((_, idx) => idx !== existingIdx)
          };
          // Cannot call showToast easily inside setCases without breaking the pure function rule for state updates,
          // but showToast isn't strictly necessary for removal if the visual feedback is instant.
          // Wait, showToast can be called here because we are in an event handler, but React setState might run twice in StrictMode.
          // It's safe enough for a toast.
          setTimeout(() => showToast(`Removed ${skin.name}`), 0);
        } else {
          const rarityEntry = RARITY_MAP[skin.rarity?.id] || { value: 'mil-spec', color: '#4b69ff', num: 3 };
          const newItem = {
            _uid: `${skin.weapon.weapon_id}_${skin.paint_index}_${Date.now()}`,
            _name: skin.name,
            _image: skin.image,
            _rarityColor: rarityEntry.color,
            category: 'weapon',
            weaponIndex: skin.weapon.weapon_id,
            paintkitIndex: parseInt(skin.paint_index, 10),
            wearTier: 0,
            rarity: rarityEntry.value,
            weight: 10,
          };
          next[activeCaseIdx] = {
            ...currentCase,
            items: [...currentCase.items, newItem]
          };
          setTimeout(() => showToast(`Added ${skin.name}`), 0);
        }
        return next;
      });
    },
    [activeCaseIdx, showToast]
  );

  const removeItem = useCallback(
    (uid) => {
      setCases((prev) => {
        const next = [...prev];
        next[activeCaseIdx] = {
          ...next[activeCaseIdx],
          items: next[activeCaseIdx].items.filter((i) => i._uid !== uid),
        };
        return next;
      });
    },
    [activeCaseIdx]
  );

  const updateItem = useCallback(
    (uid, key, value) => {
      setCases((prev) => {
        const next = [...prev];
        next[activeCaseIdx] = {
          ...next[activeCaseIdx],
          items: next[activeCaseIdx].items.map((i) =>
            i._uid === uid ? { ...i, [key]: value } : i
          ),
        };
        return next;
      });
    },
    [activeCaseIdx]
  );

  const updateCase = useCallback(
    (key, value) => {
      setCases((prev) => {
        const next = [...prev];
        next[activeCaseIdx] = { ...next[activeCaseIdx], [key]: value };
        return next;
      });
    },
    [activeCaseIdx]
  );

  const addCase = () => {
    setCases((prev) => [...prev, createDefaultCase(prev.length)]);
    setActiveCaseIdx(cases.length);
  };

  const deleteCase = (idx) => {
    if (cases.length <= 1) return;
    setCases((prev) => prev.filter((_, i) => i !== idx));
    setActiveCaseIdx((prev) => Math.min(prev, cases.length - 2));
  };

  const importCase = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const newCase = createDefaultCase(cases.length);
        
        newCase.id = data.id || newCase.id;
        newCase.name = data.name || newCase.name;
        newCase.price = data.price || newCase.price;
        newCase.color = data.color || newCase.color;
        newCase.enabled = data.enabled !== false;
        newCase.cooldownSeconds = data.cooldownSeconds || 30;
        newCase.maxOpensPerRound = data.maxOpensPerRound || 3;
        
        if (data.items && Array.isArray(data.items)) {
          newCase.items = data.items.map(item => {
            const skin = allSkins.find(s => s.weapon?.weapon_id == item.weaponIndex && s.paint_index == item.paintkitIndex);
            return {
              ...item,
              _uid: `${item.weaponIndex}_${item.paintkitIndex}_${Date.now()}_${Math.random()}`,
              _name: skin ? skin.name : `Weapon ${item.weaponIndex} | Paint ${item.paintkitIndex}`,
              _image: skin ? skin.image : '',
              _rarityColor: skin ? (RARITY_MAP[skin.rarity?.id]?.color || '#94a3b8') : '#94a3b8',
            };
          });
        }
        
        setCases((prev) => [...prev, newCase]);
        setActiveCaseIdx(cases.length);
        showToast('Case imported!');
      } catch (err) {
        showToast('Invalid JSON file');
      }
      e.target.value = null; // Reset input
    };
    reader.readAsText(file);
  }, [cases.length, allSkins, showToast]);

  /* ═══ Generate SERVER JSON (Trapi format) ═══ */
  const generateServerJSON = useCallback((c) => {
    const clean = {
      id: c.id,
      name: c.name,
      price: Number(c.price),
      color: c.color.replace('#', ''),
      enabled: c.enabled,
      cooldownSeconds: Number(c.cooldownSeconds),
      maxOpensPerRound: Number(c.maxOpensPerRound),
      items: c.items.map((item) => ({
        category: item.category,
        weaponIndex: Number(item.weaponIndex),
        paintkitIndex: Number(item.paintkitIndex),
        wearTier: Number(item.wearTier),
        rarity: item.rarity,
        weight: Number(item.weight),
      })),
    };
    return JSON.stringify(clean, null, 4);
  }, []);

  /* ═══ Generate SITE PHP format ═══ */
  const generateSitePHP = useCallback((c, cIdx) => {
    const fname = `CASE_${c.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/_+$/, '')}`;
    const caseImgPath = `/cases/${fname}/case_${c.id}.png`;
    const featPath = `/cases/${fname}/featured_${c.id}.png`;
    const colorHex = c.rarityColor || c.color;

    const lines = [];
    lines.push(`[`);
    lines.push(`    'id' => ${cIdx + 1},`);
    lines.push(`    'name' => '${c.name.replace(/'/g, "\\'")}',`);
    lines.push(`    'description' => '${(c.description || '').replace(/'/g, "\\'")}',`);
    lines.push(`    'price' => ${Number(c.price)},`);
    lines.push(`    'image' => '${caseImgPath}',`);
    lines.push(`    'rarity_color' => '${colorHex}',`);
    lines.push(`    'featured_weapon' => '${featPath}',`);
    lines.push(`    'contents' => [`);

    const rarityGroups = {};
    c.items.forEach((item) => {
      const r = item.rarity || 'mil-spec';
      if (!rarityGroups[r]) rarityGroups[r] = [];
      rarityGroups[r].push(item);
    });

    const rarityOrder = ['consumer', 'industrial', 'mil-spec', 'restricted', 'classified', 'covert', 'contraband'];
    const rarityComments = {
      consumer: 'Consumer Grade',
      industrial: 'Industrial Grade',
      'mil-spec': 'Mil-Spec Blue',
      restricted: 'Restricted Purple',
      classified: 'Classified Pink',
      covert: 'Covert Red',
      contraband: 'Contraband / Exceedingly Rare Gold',
    };

    rarityOrder.forEach((rarity) => {
      const items = rarityGroups[rarity];
      if (!items || items.length === 0) return;
      const rarityNum = RARITY_NUM[rarity] || 3;
      lines.push(`        // ${rarityComments[rarity] || rarity}`);
      items.forEach((item) => {
        const label = (item._name || `Weapon ${item.weaponIndex} | Paint ${item.paintkitIndex}`).replace(/'/g, "\\'");
        lines.push(`        ['weapon_defindex' => ${Number(item.weaponIndex)}, 'paintkit_index' => ${Number(item.paintkitIndex)}, 'wear_tier' => ${Number(item.wearTier)}, 'rarity' => ${rarityNum}, 'weight' => ${Number(item.weight)}, 'label' => '${label}'],`);
      });
    });

    lines.push(`    ],`);
    lines.push(`],`);
    return lines.join('\n');
  }, []);

  /* ═══ SAVE — creates ZIP with folder: server.json + site.php + images ═══ */
  const saveCase = useCallback(async () => {
    const c = activeCase;
    if (c.items.length === 0) {
      showToast('Add some skins first!');
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder(folderName);

    /* 1. server.json */
    folder.file('server.json', generateServerJSON(c));

    /* 2. site.php */
    const phpContent = `<?php\n// Site case config for: ${c.name}\n// Generated by Case Creator\n\nreturn ${generateSitePHP(c, activeCaseIdx)};\n`;
    folder.file('site.php', phpContent);

    /* 3. Case image */
    if (c.caseImage) {
      const buf = await readFileAsArrayBuffer(c.caseImage);
      const ext = c.caseImage.name?.split('.').pop() || 'png';
      folder.file(`case_${c.id}.${ext}`, buf);
    }

    /* 4. Featured weapon image */
    if (c.featuredImage) {
      const buf = await readFileAsArrayBuffer(c.featuredImage);
      const ext = c.featuredImage.name?.split('.').pop() || 'png';
      folder.file(`featured_${c.id}.${ext}`, buf);
    }

    /* Generate and download ZIP */
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Saved ${folderName}.zip — server.json + site.php + images`);
  }, [activeCase, activeCaseIdx, folderName, generateServerJSON, generateSitePHP, showToast]);

  /* ── Helpers ── */
  const isSkinInCase = useCallback(
    (skin) =>
      activeCase.items.some(
        (i) =>
          i.weaponIndex === skin.weapon?.weapon_id &&
          i.paintkitIndex === parseInt(skin.paint_index, 10)
      ),
    [activeCase]
  );

  const getRarityColor = (skin) =>
    RARITY_MAP[skin.rarity?.id]?.color || skin.rarity?.color || '#94a3b8';
  const getRarityLabel = (skin) =>
    RARITY_MAP[skin.rarity?.id]?.label || skin.rarity?.name || 'Unknown';

  const shortenFileName = (name) => {
    if (!name) return '';
    const parts = name.split('.');
    const ext = parts.length > 1 ? '.' + parts.pop() : '';
    const base = parts.join('.');
    if (base.length <= 8) return name;
    return base.substring(0, 6) + '...' + ext;
  };

  const caseImagePreview = activeCase.caseImage ? URL.createObjectURL(activeCase.caseImage) : null;
  const featuredImagePreview = activeCase.featuredImage ? URL.createObjectURL(activeCase.featuredImage) : null;

  return (
    <>
      <Navbar />
      <main className="case-creator-page" data-lenis-prevent>
        <div className="case-creator-shell">
          {/* ── Hero ── */}
          <div className="case-creator-hero">
            <div>
              <span className="tool-studio-kicker">
                <Package size={15} /> CS2 Case Creator
              </span>
              <h1>Case Creator</h1>
              <p>
                Browse all CS2 skins, build your case, and save a complete folder with
                server.json + site.php + images.
              </p>
            </div>
            <Link className="tool-btn" to="/">
              <ArrowLeft size={16} /> Back
            </Link>
          </div>

          {/* ── Case tabs ── */}
          <div className="cc-case-tabs">
            {cases.map((c, idx) => (
              <button
                key={idx}
                className={`cc-case-tab ${idx === activeCaseIdx ? 'active' : ''}`}
                onClick={() => setActiveCaseIdx(idx)}
              >
                <Box size={13} />
                {c.name || `Case #${idx + 1}`}
                {cases.length > 1 && (
                  <span
                    style={{ marginLeft: 4, opacity: 0.6 }}
                    onClick={(e) => { e.stopPropagation(); deleteCase(idx); }}
                  >
                    <X size={12} />
                  </span>
                )}
              </button>
            ))}
            <button className="cc-case-tab-add" onClick={addCase} title="Add new case">
            <Plus size={16} />
          </button>
          <button className="cc-case-tab-add" onClick={() => importFileRef.current?.click()} title="Import JSON Case">
            <Upload size={14} />
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={importCase}
          />
          </div>

          {/* ── 3-column grid ── */}
          <div className="case-creator-grid">
            {/* ═══ LEFT: All Case Settings ═══ */}
            <div className="cc-panel">
              <h2 className="cc-panel-title">
                <Settings size={16} /> Case Settings
              </h2>

              {/* ── Basic info ── */}
              <div className="cc-field">
                <label>Case ID</label>
                <input
                  value={activeCase.id}
                  onChange={(e) => updateCase('id', e.target.value)}
                  placeholder="e.g. weapon_case_1"
                />
              </div>

              <div className="cc-field">
                <label>Case Name</label>
                <input
                  value={activeCase.name}
                  onChange={(e) => updateCase('name', e.target.value)}
                  placeholder="e.g. Weapon Case #1"
                />
              </div>

              <div className="cc-field">
                <label>Description (site)</label>
                <textarea
                  className="cc-textarea"
                  value={activeCase.description}
                  onChange={(e) => updateCase('description', e.target.value)}
                  placeholder="Legendary contraband collection..."
                  rows={2}
                />
              </div>

              <div className="cc-inline">
                <div className="cc-field">
                  <label>Price</label>
                  <input
                    type="number"
                    value={activeCase.price}
                    onChange={(e) => updateCase('price', e.target.value)}
                  />
                </div>
                <div className="cc-field">
                  <label>Color (server)</label>
                  <div className="cc-color-preview">
                    <input
                      type="color"
                      value={activeCase.color.startsWith('#') ? activeCase.color : `#${activeCase.color}`}
                      onChange={(e) => updateCase('color', e.target.value)}
                    />
                    <input
                      value={activeCase.color}
                      onChange={(e) => updateCase('color', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div className="cc-inline">
                <div className="cc-field">
                  <label>Cooldown (sec)</label>
                  <input
                    type="number"
                    value={activeCase.cooldownSeconds}
                    onChange={(e) => updateCase('cooldownSeconds', e.target.value)}
                  />
                </div>
                <div className="cc-field">
                  <label>Max Opens/Round</label>
                  <input
                    type="number"
                    value={activeCase.maxOpensPerRound}
                    onChange={(e) => updateCase('maxOpensPerRound', e.target.value)}
                  />
                </div>
              </div>

              <div className="cc-inline">
                <div className="cc-field">
                  <label>Rarity Color (site)</label>
                  <div className="cc-color-preview">
                    <input
                      type="color"
                      value={activeCase.rarityColor?.startsWith('#') ? activeCase.rarityColor : `#${activeCase.rarityColor || '#ccff00'}`}
                      onChange={(e) => updateCase('rarityColor', e.target.value)}
                    />
                    <input
                      value={activeCase.rarityColor || ''}
                      onChange={(e) => updateCase('rarityColor', e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div className="cc-toggle-row">
                  <label>Enabled</label>
                  <div
                    className={`cc-toggle ${activeCase.enabled ? 'active' : ''}`}
                    onClick={() => updateCase('enabled', !activeCase.enabled)}
                  />
                </div>
              </div>

              {/* ── Images ── */}
              <div className="cc-section-divider">
                <Image size={13} /> Images
              </div>

              <div className="cc-field">
                <label>Case Image</label>
                <div className="cc-image-upload-area">
                  {caseImagePreview ? (
                    <div className="cc-image-preview-box">
                      <img src={caseImagePreview} alt="Case" className="cc-image-thumb" />
                      <div className="cc-image-preview-info">
                        <span className="cc-image-path" title={activeCase.caseImage?.name}>
                          {shortenFileName(activeCase.caseImage?.name)}
                        </span>
                        <button className="cc-remove-btn" onClick={() => updateCase('caseImage', null)}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="cc-upload-btn" onClick={() => caseImgRef.current?.click()}>
                      <Upload size={16} /> Upload Case Image
                    </button>
                  )}
                  <input
                    ref={caseImgRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) updateCase('caseImage', e.target.files[0]);
                    }}
                  />
                </div>
              </div>

              <div className="cc-field">
                <label>Featured Weapon Image</label>
                <div className="cc-image-upload-area">
                  {featuredImagePreview ? (
                    <div className="cc-image-preview-box">
                      <img src={featuredImagePreview} alt="Featured" className="cc-image-thumb" />
                      <div className="cc-image-preview-info">
                        <span className="cc-image-path" title={activeCase.featuredImage?.name}>
                          {shortenFileName(activeCase.featuredImage?.name)}
                        </span>
                        <button className="cc-remove-btn" onClick={() => updateCase('featuredImage', null)}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="cc-upload-btn" onClick={() => featImgRef.current?.click()}>
                      <Upload size={16} /> Upload Featured Weapon
                    </button>
                  )}
                  <input
                    ref={featImgRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) updateCase('featuredImage', e.target.files[0]);
                    }}
                  />
                </div>
              </div>

              {/* ── Folder preview ── */}
              <div className="cc-folder-info">
                <FolderOpen size={14} />
                <span>Folder: <strong>{folderName}</strong></span>
              </div>
              <div className="cc-folder-tree">
                <div className="cc-tree-line"><Folder size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} /> {folderName}/</div>
                <div className="cc-tree-line sub">├── server.json</div>
                <div className="cc-tree-line sub">├── site.php</div>
                {activeCase.caseImage && <div className="cc-tree-line sub">├── case_{activeCase.id}.{activeCase.caseImage.name?.split('.').pop() || 'png'}</div>}
                {activeCase.featuredImage && <div className="cc-tree-line sub">└── featured_{activeCase.id}.{activeCase.featuredImage.name?.split('.').pop() || 'png'}</div>}
              </div>

              {/* ── Actions ── */}
              <div className="cc-actions">
                <button className="cc-btn primary cc-btn-save" onClick={saveCase}>
                  <Save size={15} /> Save Case
                </button>
                <button className="cc-btn" onClick={() => setShowPreview(!showPreview)}>
                  <FileJson size={15} /> {showPreview ? 'Hide' : 'Preview'}
                </button>
                <button
                  className="cc-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(generateServerJSON(activeCase));
                      showToast('Server JSON copied!');
                    } catch { showToast('Failed to copy'); }
                  }}
                >
                  <Copy size={15} /> Copy JSON
                </button>
              </div>

              {/* ── Preview ── */}
              {showPreview && (
                <div className="cc-preview-section">
                  <div className="cc-preview-tabs">
                    <button
                      className={`cc-preview-tab ${previewTab === 'server' ? 'active' : ''}`}
                      onClick={() => setPreviewTab('server')}
                    >
                      <Box size={14} /> Server JSON
                    </button>
                    <button
                      className={`cc-preview-tab ${previewTab === 'site' ? 'active' : ''}`}
                      onClick={() => setPreviewTab('site')}
                    >
                      <Globe size={14} /> Site PHP
                    </button>
                  </div>
                  <div className="cc-json-output">
                    {previewTab === 'server'
                      ? generateServerJSON(activeCase)
                      : generateSitePHP(activeCase, activeCaseIdx)}
                  </div>
                </div>
              )}
            </div>

            {/* ═══ CENTER: Skin Browser ═══ */}
            <div className="cc-panel">
              <h2 className="cc-panel-title">
                <Crosshair size={16} /> Skin Browser
                <span className="cc-count-badge">{filteredSkins.length}</span>
              </h2>

              <div className="cc-browser-header">
                <input
                  className="cc-search"
                  placeholder="Search skins by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="cc-filter-select"
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                >
                  <option value="all">All Rarities</option>
                  {Object.entries(RARITY_MAP)
                    .filter(([id], i, arr) => arr.findIndex(([, r2]) => r2.label === RARITY_MAP[id].label) === i)
                    .map(([id, r]) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <select
                  className="cc-filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {categoryNames.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  className="cc-filter-select"
                  value={weaponFilter}
                  onChange={(e) => setWeaponFilter(e.target.value)}
                >
                  <option value="all">All Weapons</option>
                  {weaponNames.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="cc-loading">
                  <div className="cc-loading-spinner" />
                  <p style={{ marginTop: '0.75rem' }}>Loading skins from API…</p>
                </div>
              ) : error ? (
                <div className="cc-empty">
                  <p>Error loading skins: {error}</p>
                  <button className="cc-btn" onClick={() => window.location.reload()}>
                    <RefreshCw size={15} /> Retry
                  </button>
                </div>
              ) : paginatedSkins.length === 0 ? (
                <div className="cc-empty">
                  <Search size={32} />
                  <p>No skins found matching your filters</p>
                </div>
              ) : (
                <>
                  <div className="cc-skins-scroll">
                    <div className="cc-skins-grid">
                      {paginatedSkins.map((skin) => {
                        const selected = isSkinInCase(skin);
                        const rarityColor = getRarityColor(skin);
                        return (
                          <div
                            key={skin.id}
                            className={`cc-skin-card ${selected ? 'selected' : ''}`}
                            style={{ '--rarity-color': rarityColor }}
                            onClick={() => addSkinToCase(skin)}
                            title={selected ? `Remove ${skin.name}` : `Add ${skin.name}`}
                          >
                            {selected && (
                              <div style={{
                                position: 'absolute', top: 8, right: 8,
                                width: 22, height: 22, borderRadius: '50%',
                                background: 'var(--color-primary, #ccff00)',
                                display: 'grid', placeItems: 'center', zIndex: 2,
                              }}>
                                <Check size={13} color="#071008" strokeWidth={3} />
                              </div>
                            )}
                            <img className="cc-skin-img" src={skin.image} alt={skin.name} loading="lazy" />
                            <span className="cc-skin-name" title={skin.name}>
                              {skin.pattern?.name || skin.name}
                            </span>
                            <span className="cc-skin-weapon">
                              {skin.weapon?.name} • ID:{skin.weapon?.weapon_id} / PK:{skin.paint_index}
                            </span>
                            <span className="cc-skin-rarity-badge" style={{ '--rarity-color': rarityColor }}>
                              <span className="cc-skin-rarity-dot" />
                              {getRarityLabel(skin)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="cc-pagination">
                    <button disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft size={16} />
                    </button>
                    <span>{currentPage} / {totalPages}</span>
                    <button disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ═══ RIGHT: Case Items ═══ */}
            <div className="cc-panel">
              <h2 className="cc-panel-title">
                <ListChecks size={16} /> Case Items
                <span className="cc-count-badge">{activeCase.items.length}</span>
              </h2>

              {activeCase.items.length > 0 && (
                <div className="cc-stats">
                  <div className="cc-stat">
                    <span className="cc-stat-value">{activeCase.items.length}</span>
                    <span className="cc-stat-label">Items</span>
                  </div>
                  <div className="cc-stat">
                    <span className="cc-stat-value">
                      {activeCase.items.reduce((sum, i) => sum + Number(i.weight), 0)}
                    </span>
                    <span className="cc-stat-label">Total Weight</span>
                  </div>
                  <div className="cc-stat">
                    <span className="cc-stat-value">
                      {[...new Set(activeCase.items.map((i) => i.rarity))].length}
                    </span>
                    <span className="cc-stat-label">Rarities</span>
                  </div>
                </div>
              )}

              {activeCase.items.length === 0 ? (
                <div className="cc-empty">
                  <Package size={32} />
                  <p>No items yet.<br />Click skins in the browser to add them.</p>
                </div>
              ) : (
                <div className="cc-case-items-scroll" data-lenis-prevent>
                  {activeCase.items.map((item) => (
                    <div
                      key={item._uid}
                      className="cc-case-item"
                      style={{ '--rarity-color': item._rarityColor || '#94a3b8' }}
                    >
                      <img className="cc-case-item-img" src={item._image} alt={item._name} loading="lazy" />
                      <div className="cc-case-item-info">
                        <strong title={item._name}>
                          {item._name?.split('|').pop()?.trim() || item._name}
                        </strong>
                        <span>WI:{item.weaponIndex} / PK:{item.paintkitIndex}</span>
                      </div>
                      <div className="cc-case-item-meta">
                        <select
                          className="cc-wear-select"
                          value={item.wearTier}
                          onChange={(e) => updateItem(item._uid, 'wearTier', parseInt(e.target.value, 10))}
                        >
                          {WEAR_TIERS.map((w) => (
                            <option key={w.value} value={w.value}>{w.label}</option>
                          ))}
                        </select>
                        <div className="cc-case-item-weight" title="Chance / Weight">
                          <label>Chance</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.weight}
                            onChange={(e) => updateItem(item._uid, 'weight', parseFloat(e.target.value) || 1)}
                          />
                        </div>
                        <button className="cc-remove-btn" onClick={() => removeItem(item._uid)} title="Remove">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`cc-toast ${toast ? 'visible' : ''}`}>
          <Check size={16} /> {toast}
        </div>
      </main>
    </>
  );
}
