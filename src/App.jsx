import React, { useState, useMemo, useEffect } from 'react';
import { 
  Terminal, Search, Copy, Check, ExternalLink, Sliders, 
  Sun, Moon, Database, Sparkles, BookOpen, Layers,
  ChevronRight, Hash, Cpu, ArrowUpRight, Filter, ShieldCheck,
  CheckCircle2, Folder, Megaphone, Globe, Code2, Palette,
  ShoppingBag, PenTool, BarChart3, HelpCircle, FileCode, CheckCheck
} from 'lucide-react';
import promptsData from './data/prompts.json';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedModel, setSelectedModel] = useState('Tous');
  const [activePromptId, setActivePromptId] = useState(promptsData[0]?.id || '');
  const [variableInputs, setVariableInputs] = useState({});
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState('customized'); // 'customized' | 'original'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Categories list with icons and counts
  const categories = [
    { id: 'Tous', label: 'Toutes les catégories', icon: Layers, count: promptsData.length },
    { id: 'Marketing', label: 'Marketing & Croissance', icon: Megaphone, count: promptsData.filter(p => p.category === 'Marketing').length },
    { id: 'SEO', label: 'SEO & Visibilité', icon: Globe, count: 0 },
    { id: 'Coding', label: 'Code & Développement', icon: Code2, count: 0 },
    { id: 'Design', label: 'Design & Visuels', icon: Palette, count: 0 },
    { id: 'Sales', label: 'Vente & Conversion', icon: ShoppingBag, count: 0 },
    { id: 'Copywriting', label: 'Copywriting & Écriture', icon: PenTool, count: 0 },
  ];

  const modelsList = ['Tous', 'ChatGPT', 'Claude', 'Gemini', 'DeepSeek'];

  // Active prompt item
  const activePrompt = useMemo(() => {
    return promptsData.find(p => p.id === activePromptId) || promptsData[0];
  }, [activePromptId]);

  // Reset variables inputs when selecting a new prompt
  useEffect(() => {
    if (activePrompt) {
      const initial = {};
      if (activePrompt.variables_list) {
        activePrompt.variables_list.forEach(v => {
          initial[v.name] = '';
        });
      }
      setVariableInputs(initial);
      setCopied(false);
    }
  }, [activePromptId]);

  // Filtered prompt list
  const filteredPrompts = useMemo(() => {
    return promptsData.filter(p => {
      const matchCat = selectedCategory === 'Tous' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchModel = selectedModel === 'Tous' || (p.models && p.models.includes(selectedModel));
      const matchSearch = 
        p.title_fr.toLowerCase().includes(search.toLowerCase()) ||
        p.description_fr.toLowerCase().includes(search.toLowerCase()) ||
        (p.variables_fr && p.variables_fr.toLowerCase().includes(search.toLowerCase()));

      return matchCat && matchModel && matchSearch;
    });
  }, [selectedCategory, selectedModel, search]);

  // Dynamic live prompt calculation
  const computedPrompt = useMemo(() => {
    if (!activePrompt) return '';
    let text = activePrompt.optimized_prompt;
    if (activePrompt.variables_list) {
      activePrompt.variables_list.forEach(v => {
        const val = variableInputs[v.name];
        if (val && val.trim() !== '') {
          const escaped = v.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, 'g');
          text = text.replace(regex, val.trim());
        }
      });
    }
    return text;
  }, [activePrompt, variableInputs]);

  // Copy handler
  const handleCopy = () => {
    const text = activeView === 'customized' ? computedPrompt : (activePrompt.original_prompt || computedPrompt);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-core)',
      overflow: 'hidden'
    }}>

      {/* 1. LEFT COLUMN: CATEGORIES & WORKSPACE SIDEBAR (~220px) */}
      <nav style={{
        width: '230px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-hairline)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        userSelect: 'none'
      }}>
        <div>
          {/* Logo & App Name */}
          <div style={{
            padding: '1.1rem 1.1rem 0.9rem',
            borderBottom: '1px solid var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 900,
              fontSize: '0.95rem'
            }}>
              ⌘
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-bright)' }}>
                Prompt Studio
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Atelier Pro
              </div>
            </div>
          </div>

          {/* Categories Nav Header */}
          <div style={{ padding: '0.85rem 0.9rem 0.35rem', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Catégories
          </div>

          {/* Categories list */}
          <div style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {categories.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const hasPrompts = cat.count > 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 700 : 500,
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--bg-highlight)' : 'transparent',
                    color: isSelected ? 'var(--accent-gold)' : (hasPrompts ? 'var(--text-normal)' : 'var(--text-faint)'),
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--border-hairline)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <Icon size={14} color={isSelected ? 'var(--accent-gold)' : (hasPrompts ? 'var(--text-muted)' : 'var(--text-faint)')} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '135px' }}>
                      {cat.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? 'var(--accent-gold-subtle)' : 'var(--border-hairline)',
                    color: isSelected ? 'var(--accent-gold)' : 'var(--text-faint)',
                    fontFamily: 'monospace'
                  }}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Model Filter Section */}
          <div style={{ padding: '1.25rem 0.9rem 0.35rem', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Modèle IA
          </div>
          <div style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {modelsList.map(m => {
              const isSelected = selectedModel === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--bg-highlight)' : 'transparent',
                    color: isSelected ? 'var(--accent-gold)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <Cpu size={13} style={{ marginRight: '0.5rem', opacity: isSelected ? 1 : 0.6 }} />
                  <span>{m}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer: Notion status & theme toggle */}
        <div style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', boxShadow: '0 0 5px var(--accent-emerald)' }} />
            <span>Notion Synced</span>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-hairline)',
              borderRadius: '6px',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            title="Changer de thème"
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </nav>

      {/* 2. MIDDLE COLUMN: MODULES FEED (~320px) */}
      <section style={{
        width: '320px',
        backgroundColor: 'var(--bg-feed)',
        borderRight: '1px solid var(--border-hairline)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Search header */}
        <div style={{
          padding: '0.75rem',
          borderBottom: '1px solid var(--border-hairline)'
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={14} color="var(--text-faint)" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Filtrer les prompts (⌘K)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid var(--border-hairline)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-bright)',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-faint)', padding: '0 2px' }}>
            <span>{selectedCategory === 'Tous' ? 'Tous les modules' : selectedCategory}</span>
            <span>{filteredPrompts.length} résultat{filteredPrompts.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Modules list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem' }}>
          {filteredPrompts.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.82rem' }}>
              Aucun prompt disponible dans cette sélection.
            </div>
          ) : (
            filteredPrompts.map((p, idx) => {
              const isActive = p.id === activePromptId;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePromptId(p.id)}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    marginBottom: '0.3rem',
                    cursor: 'pointer',
                    border: isActive ? '1px solid var(--border-focus)' : '1px solid transparent',
                    backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--border-hairline)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: isActive ? 'var(--accent-gold)' : 'var(--text-faint)', fontWeight: 700 }}>
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>
                      {p.models?.[0]}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? 'var(--text-bright)' : 'var(--text-normal)',
                    marginBottom: '0.25rem',
                    lineHeight: 1.3
                  }}>
                    {p.title_fr}
                  </div>

                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {p.description_fr}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. RIGHT COLUMN: WORKBENCH CANVAS (Full Screen Atelier) */}
      <main style={{
        flex: 1,
        backgroundColor: 'var(--bg-workbench)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        {activePrompt ? (
          <div style={{ padding: '2rem 3rem', maxWidth: '1040px', width: '100%', margin: '0 auto' }}>
            
            {/* Module header */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--accent-gold)',
                  backgroundColor: 'var(--accent-gold-subtle)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {activePrompt.category}
                </span>
                <span style={{ color: 'var(--text-faint)' }}>•</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  IA supportées : {activePrompt.models?.join(', ')}
                </span>
              </div>

              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: 'var(--text-bright)',
                marginBottom: '0.5rem',
                lineHeight: 1.2
              }}>
                {activePrompt.title_fr}
              </h1>

              <p style={{
                fontSize: '0.92rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6
              }}>
                {activePrompt.description_fr}
              </p>
            </div>

            {/* TAB SELECTOR & ACTIONS BAR */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '10px',
              border: '1px solid var(--border-hairline)',
              marginBottom: '1.5rem'
            }}>
              {/* Tab Switcher */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setActiveView('customized')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: 'none',
                    backgroundColor: activeView === 'customized' ? 'var(--border-card)' : 'transparent',
                    color: activeView === 'customized' ? 'var(--text-bright)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Prompt Optimisé & Personnalisé
                </button>
                <button
                  onClick={() => setActiveView('original')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: 'none',
                    backgroundColor: activeView === 'original' ? 'var(--border-card)' : 'transparent',
                    color: activeView === 'original' ? 'var(--text-bright)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  📜 Prompt Source Brut (Référence)
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '6px 14px',
                    borderRadius: '7px',
                    border: 'none',
                    backgroundColor: copied ? 'var(--accent-emerald)' : 'var(--accent-gold)',
                    color: '#000000',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copié !' : 'Copier le Prompt'}</span>
                </button>

                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-bright)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                  title="Copie et ouvre ChatGPT"
                >
                  <span>ChatGPT</span>
                  <ArrowUpRight size={12} color="var(--text-faint)" />
                </a>

                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-bright)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                  title="Copie et ouvre Claude"
                >
                  <span>Claude</span>
                  <ArrowUpRight size={12} color="var(--text-faint)" />
                </a>
              </div>
            </div>

            {/* DYNAMIC VARIABLES INPUTS (Only in customized view) */}
            {activeView === 'customized' && activePrompt.variables_list && activePrompt.variables_list.length > 0 && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-hairline)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--accent-gold)',
                  marginBottom: '0.85rem'
                }}>
                  <Sliders size={14} />
                  <span>Variables Interactives (Remplissage en direct)</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: activePrompt.variables_list.length > 2 ? 'repeat(2, 1fr)' : '1fr',
                  gap: '0.85rem'
                }}>
                  {activePrompt.variables_list.map(v => (
                    <div key={v.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                          {v.name}
                        </label>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                          {v.placeholder}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder={v.desc_fr}
                        value={variableInputs[v.name] || ''}
                        onChange={e => setVariableInputs({ ...variableInputs, [v.name]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-hairline)',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-bright)',
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CODE PREVIEW BOX */}
            <div style={{
              borderRadius: '12px',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-input)',
              overflow: 'hidden',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                padding: '6px 12px',
                borderBottom: '1px solid var(--border-hairline)',
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-faint)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileCode size={13} />
                  <span style={{ fontFamily: 'monospace' }}>
                    {activeView === 'customized' ? 'prompt_optimise.md' : 'prompt_source_brut.md'}
                  </span>
                </div>
                <span>
                  {activeView === 'customized' ? 'Génération dynamique' : 'Texte original brut'}
                </span>
              </div>

              <pre style={{
                padding: '1.25rem',
                fontSize: '0.82rem',
                lineHeight: 1.65,
                color: 'var(--text-normal)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '440px',
                overflowY: 'auto'
              }}>
                <code>
                  {activeView === 'customized' 
                    ? computedPrompt 
                    : (activePrompt.original_prompt || 'Structure source non disponible pour ce module.')}
                </code>
              </pre>
            </div>

            {/* STRATEGIC NOTE (EXECUTIVE BRIEF) */}
            {activePrompt.guide_fr && (
              <div style={{
                padding: '1.1rem 1.25rem',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card)',
                borderLeft: '3px solid var(--accent-gold)',
                borderTop: '1px solid var(--border-hairline)',
                borderRight: '1px solid var(--border-hairline)',
                borderBottom: '1px solid var(--border-hairline)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: 'var(--accent-gold)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.35rem'
                }}>
                  <BookOpen size={14} />
                  <span>Directive Stratégique d'Exécution</span>
                </div>
                <p style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.55
                }}>
                  {activePrompt.guide_fr}
                </p>
              </div>
            )}

          </div>
        ) : (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-faint)' }}>
            Sélectionnez un prompt à gauche.
          </div>
        )}
      </main>

    </div>
  );
}
