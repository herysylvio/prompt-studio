import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Copy, Check, Sliders, Sun, Moon, Sparkles, BookOpen, Layers,
  Cpu, ArrowUpRight, Megaphone, Globe, Code2, Palette,
  ShoppingBag, PenTool, FileCode, Star, Plus, Download, Link2,
  RotateCcw, PanelLeftClose, PanelLeftOpen, Command, FileText,
  Trash2, Edit3, X, FolderHeart, CheckCircle2, Keyboard, ListFilter,
  Bot, Briefcase, LineChart, UserCheck, Wand2, Upload, Save,
  Compass, ChevronRight, ChevronLeft, Eye
} from 'lucide-react';
import promptsData from './data/prompts.json';
import playbooksData from './data/playbooks.json';

const STORAGE_KEYS = {
  THEME: 'ps_theme_v1',
  FAVORITES: 'ps_favorites_v1',
  CUSTOM_PROMPTS: 'ps_custom_prompts_v1',
  SAVED_VARS: 'ps_saved_vars_v1',
  CONTEXT_PROFILES: 'ps_context_profiles_v1',
  ACTIVE_PROFILE_ID: 'ps_active_profile_id_v1',
  PLAYBOOK_PROGRESS: 'ps_playbook_progress_v1',
};

function safeLoadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Lightweight syntax highlighter for XML tags, Markdown headings, and {{variables}}
function HighlightedPrompt({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  const renderInlineTokens = (line, lineIdx) => {
    // Tokenize XML tags <...> and placeholders {{...}}
    const parts = line.split(/(<\/?[a-zA-Z0-9_:-]+(?:\s+[^>]*)?>|\{\{[^}]+\}\})/g);
    return parts.map((part, i) => {
      if (!part) return null;
      if (/^<\/?[a-zA-Z0-9_:-]+(?:\s+[^>]*)?>$/.test(part)) {
        return (
          <span
            key={`${lineIdx}-${i}`}
            style={{ color: 'var(--accent-gold)', fontWeight: 600 }}
          >
            {part}
          </span>
        );
      }
      if (/^\{\{[^}]+\}\}$/.test(part)) {
        return (
          <span
            key={`${lineIdx}-${i}`}
            style={{
              backgroundColor: 'var(--accent-gold-subtle)',
              color: 'var(--accent-gold)',
              padding: '1px 5px',
              borderRadius: '4px',
              border: '1px solid var(--border-focus)',
              fontWeight: 600
            }}
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={`${lineIdx}-${i}`}>{part}</React.Fragment>;
    });
  };

  return (
    <>
      {lines.map((line, idx) => {
        const isHeading = /^#{1,4}\s/.test(line.trim());
        const isComment = /^<!--.*-->$/.test(line.trim());
        return (
          <div
            key={idx}
            style={{
              color: isHeading
                ? 'var(--text-bright)'
                : isComment
                ? 'var(--text-faint)'
                : 'var(--text-normal)',
              fontWeight: isHeading ? 700 : 400,
              minHeight: line === '' ? '0.85em' : 'auto'
            }}
          >
            {renderInlineTokens(line, idx)}
          </div>
        );
      })}
    </>
  );
}

export default function App() {
  // Persisted states
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.THEME) || 'dark');
  const [favorites, setFavorites] = useState(() => safeLoadJSON(STORAGE_KEYS.FAVORITES, []));
  const [customPrompts, setCustomPrompts] = useState(() => safeLoadJSON(STORAGE_KEYS.CUSTOM_PROMPTS, []));
  const [allSavedVars, setAllSavedVars] = useState(() => safeLoadJSON(STORAGE_KEYS.SAVED_VARS, {}));
  const [contextProfiles, setContextProfiles] = useState(() => safeLoadJSON(STORAGE_KEYS.CONTEXT_PROFILES, []));
  const [activeProfileId, setActiveProfileId] = useState(() => localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID) || '');
  const [playbookProgress, setPlaybookProgress] = useState(() => safeLoadJSON(STORAGE_KEYS.PLAYBOOK_PROGRESS, {}));

  // Navigation & filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedModel, setSelectedModel] = useState('Tous');
  const [activePlaybookId, setActivePlaybookId] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [mobilePane, setMobilePane] = useState('workbench'); // 'sidebar' | 'feed' | 'workbench'

  // Combined prompt catalog (custom prompts first, then built-in prompts)
  const allPrompts = useMemo(() => {
    return [...customPrompts, ...promptsData];
  }, [customPrompts]);

  // Initial prompt ID from URL (?prompt=...) or first prompt
  const [activePromptId, setActivePromptId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('prompt');
    if (fromUrl) return fromUrl;
    return promptsData[0]?.id || '';
  });

  // Workbench UI states
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeView, setActiveView] = useState('customized'); // 'customized' | 'original'
  const [injectProfileBlock, setInjectProfileBlock] = useState(true);
  const [isLiveEditing, setIsLiveEditing] = useState(false);
  const [manualPromptText, setManualPromptText] = useState(null);

  // Custom prompt modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [formState, setFormState] = useState({
    title_fr: '',
    category: 'Marketing',
    description_fr: '',
    optimized_prompt: '',
    guide_fr: '',
    models: ['ChatGPT', 'Claude', 'Gemini']
  });

  // Context Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    company_context: '',
    target_audience: '',
    brand_voice: '',
    tech_or_metrics: ''
  });

  const searchInputRef = useRef(null);
  const activeCardRef = useRef(null);
  const fileImportRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Sync favorites
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  // Sync custom prompts
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PROMPTS, JSON.stringify(customPrompts));
  }, [customPrompts]);

  // Sync saved variable inputs
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVED_VARS, JSON.stringify(allSavedVars));
  }, [allSavedVars]);

  // Sync context profiles
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTEXT_PROFILES, JSON.stringify(contextProfiles));
  }, [contextProfiles]);

  // Sync active profile ID
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, activeProfileId);
  }, [activeProfileId]);

  // Sync playbook progress
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYBOOK_PROGRESS, JSON.stringify(playbookProgress));
  }, [playbookProgress]);

  // Reset live manual edit override when switching prompt
  useEffect(() => {
    setIsLiveEditing(false);
    setManualPromptText(null);
  }, [activePromptId]);

  // Sync activePromptId to URL query param without reloading
  useEffect(() => {
    if (!activePromptId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('prompt', activePromptId);
    window.history.replaceState({}, '', url.toString());
  }, [activePromptId]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const toggleFavorite = useCallback((id, e) => {
    if (e) e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  }, []);

  // Active Context Profile object
  const activeProfile = useMemo(() => {
    if (!activeProfileId) return null;
    return contextProfiles.find(p => p.id === activeProfileId) || null;
  }, [contextProfiles, activeProfileId]);

  // Active Playbook object & current step
  const activePlaybook = useMemo(() => {
    if (!activePlaybookId) return null;
    return playbooksData.find(pb => pb.id === activePlaybookId) || null;
  }, [activePlaybookId]);

  const activePlaybookStep = useMemo(() => {
    if (!activePlaybook) return null;
    return activePlaybook.steps.find(s => s.promptId === activePromptId) || activePlaybook.steps[0];
  }, [activePlaybook, activePromptId]);

  const togglePlaybookStepDone = (playbookId, stepNumber, e) => {
    if (e) e.stopPropagation();
    const key = `${playbookId}:${stepNumber}`;
    setPlaybookProgress(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectPlaybook = (pb) => {
    setActivePlaybookId(pb.id);
    if (pb.steps?.[0]?.promptId) {
      setActivePromptId(pb.steps[0].promptId);
    }
    setMobilePane('feed');
  };

  // Categories list with SVG icons and dynamic counts (9 categories + Favorites + Custom)
  const categories = useMemo(() => [
    { id: 'Tous', label: 'Toutes les catégories', icon: Layers, count: allPrompts.length },
    { id: 'Favoris', label: 'Prompts Favoris', icon: Star, count: allPrompts.filter(p => favorites.includes(p.id)).length },
    ...(customPrompts.length > 0 ? [
      { id: 'Personnalisés', label: 'Mes Prompts Sur-Mesure', icon: FolderHeart, count: customPrompts.length }
    ] : []),
    { id: 'Marketing', label: 'Marketing & Croissance', icon: Megaphone, count: allPrompts.filter(p => p.category?.toLowerCase() === 'marketing').length },
    { id: 'Coding', label: 'Code & Développement', icon: Code2, count: allPrompts.filter(p => p.category?.toLowerCase() === 'coding').length },
    { id: 'Design', label: 'Design & Visuels', icon: Palette, count: allPrompts.filter(p => p.category?.toLowerCase() === 'design').length },
    { id: 'Sales', label: 'Vente & Conversion', icon: ShoppingBag, count: allPrompts.filter(p => p.category?.toLowerCase() === 'sales').length },
    { id: 'Copywriting', label: 'Copywriting & Écriture', icon: PenTool, count: allPrompts.filter(p => p.category?.toLowerCase() === 'copywriting').length },
    { id: 'SEO', label: 'SEO & Visibilité', icon: Globe, count: allPrompts.filter(p => p.category?.toLowerCase() === 'seo').length },
    { id: 'Automation', label: 'Agents IA & Automatisation', icon: Bot, count: allPrompts.filter(p => p.category?.toLowerCase() === 'automation').length },
    { id: 'Business', label: 'Productivité & Stratégie', icon: Briefcase, count: allPrompts.filter(p => p.category?.toLowerCase() === 'business').length },
    { id: 'Finance', label: 'Data, Finance & Analyse', icon: LineChart, count: allPrompts.filter(p => p.category?.toLowerCase() === 'finance').length },
  ], [allPrompts, favorites, customPrompts]);

  const modelsList = ['Tous', 'ChatGPT', 'Claude', 'Gemini', 'DeepSeek'];

  // Active prompt item
  const activePrompt = useMemo(() => {
    return allPrompts.find(p => p.id === activePromptId) || allPrompts[0];
  }, [allPrompts, activePromptId]);

  // Current prompt's variable values from persisted map
  const variableInputs = useMemo(() => {
    if (!activePrompt) return {};
    return allSavedVars[activePrompt.id] || {};
  }, [allSavedVars, activePrompt]);

  const handleVariableChange = (varName, value) => {
    if (!activePrompt) return;
    setManualPromptText(null);
    setAllSavedVars(prev => ({
      ...prev,
      [activePrompt.id]: {
        ...(prev[activePrompt.id] || {}),
        [varName]: value
      }
    }));
  };

  const handleResetVariables = () => {
    if (!activePrompt) return;
    setManualPromptText(null);
    setAllSavedVars(prev => {
      const next = { ...prev };
      delete next[activePrompt.id];
      return next;
    });
  };

  // Smart variable pre-fill from active Context Profile
  const handlePrefillFromProfile = () => {
    if (!activePrompt?.variables_list || !activeProfile) return;
    setManualPromptText(null);
    const mapped = { ...(allSavedVars[activePrompt.id] || {}) };
    activePrompt.variables_list.forEach((v, idx) => {
      const lower = `${v.name} ${v.placeholder}`.toLowerCase();
      if (lower.match(/audience|target|cible|client|icp|persona|recipient|segment/) && activeProfile.target_audience) {
        mapped[v.name] = activeProfile.target_audience;
      } else if (lower.match(/voice|tone|style|brand|marque|ton/) && activeProfile.brand_voice) {
        mapped[v.name] = activeProfile.brand_voice;
      } else if (lower.match(/stack|tech|tool|metric|goal|objectif|kpi|budget|data|language/) && activeProfile.tech_or_metrics) {
        mapped[v.name] = activeProfile.tech_or_metrics;
      } else if (lower.match(/business|company|product|offer|niche|context|entreprise|offre|service|industry|topic/) && activeProfile.company_context) {
        mapped[v.name] = activeProfile.company_context;
      } else if (!mapped[v.name] && idx === 0 && activeProfile.company_context) {
        mapped[v.name] = activeProfile.company_context;
      }
    });
    setAllSavedVars(prev => ({
      ...prev,
      [activePrompt.id]: mapped
    }));
  };

  // Filtered prompt list
  const filteredPrompts = useMemo(() => {
    return allPrompts.filter(p => {
      let matchCat = true;
      if (selectedCategory === 'Favoris') {
        matchCat = favorites.includes(p.id);
      } else if (selectedCategory === 'Personnalisés') {
        matchCat = Boolean(p.isCustom);
      } else if (selectedCategory !== 'Tous') {
        matchCat = p.category?.toLowerCase() === selectedCategory.toLowerCase();
      }

      const matchModel = selectedModel === 'Tous' || (p.models && p.models.includes(selectedModel));
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        p.title_fr?.toLowerCase().includes(q) ||
        p.title_en?.toLowerCase().includes(q) ||
        p.description_fr?.toLowerCase().includes(q) ||
        (p.variables_fr && p.variables_fr.toLowerCase().includes(q));

      return matchCat && matchModel && matchSearch;
    });
  }, [allPrompts, selectedCategory, selectedModel, search, favorites]);

  // Dynamic live prompt calculation (with optional active profile context block)
  const computedPrompt = useMemo(() => {
    if (!activePrompt) return '';
    let text = activePrompt.optimized_prompt || '';
    if (activePrompt.variables_list) {
      activePrompt.variables_list.forEach(v => {
        const val = variableInputs[v.name];
        if (val && val.trim() !== '') {
          const escaped = v.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, 'gi');
          text = text.replace(regex, val.trim());
        }
      });
    }

    if (activeProfile && injectProfileBlock) {
      const profileLines = [
        `<workspace_context_profile name="${activeProfile.name}">`,
        activeProfile.company_context ? `  <company_and_offer>${activeProfile.company_context}</company_and_offer>` : null,
        activeProfile.target_audience ? `  <target_audience_icp>${activeProfile.target_audience}</target_audience_icp>` : null,
        activeProfile.brand_voice ? `  <brand_voice_and_style>${activeProfile.brand_voice}</brand_voice_and_style>` : null,
        activeProfile.tech_or_metrics ? `  <stack_and_constraints>${activeProfile.tech_or_metrics}</stack_and_constraints>` : null,
        `</workspace_context_profile>\n\n`
      ].filter(Boolean).join('\n');
      text = profileLines + text;
    }

    return text;
  }, [activePrompt, variableInputs, activeProfile, injectProfileBlock]);

  // Effective prompt text (manual live edit override or computedPrompt)
  const effectiveCustomizedPrompt = manualPromptText !== null ? manualPromptText : computedPrompt;

  // Displayed code text & estimated tokens
  const displayedPromptText = activeView === 'customized'
    ? effectiveCustomizedPrompt
    : (activePrompt?.original_prompt || 'Structure source non disponible pour ce module.');

  const estimatedTokens = useMemo(() => {
    return Math.max(1, Math.ceil((displayedPromptText || '').length / 3.8));
  }, [displayedPromptText]);

  // Count filled variables
  const filledVariablesCount = useMemo(() => {
    if (!activePrompt?.variables_list) return 0;
    return activePrompt.variables_list.filter(v => (variableInputs[v.name] || '').trim() !== '').length;
  }, [activePrompt, variableInputs]);

  // Copy handler
  const handleCopy = useCallback(() => {
    if (!activePrompt) return;
    const text = activeView === 'customized' ? effectiveCustomizedPrompt : (activePrompt.original_prompt || effectiveCustomizedPrompt);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activePrompt, activeView, effectiveCustomizedPrompt]);

  // Copy direct share link
  const handleCopyLink = () => {
    if (!activePrompt) return;
    const url = new URL(window.location.href);
    url.searchParams.set('prompt', activePrompt.id);
    navigator.clipboard.writeText(url.toString());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Export Markdown (.md)
  const handleExportMarkdown = () => {
    if (!activePrompt) return;
    const mdContent = [
      `# ${activePrompt.title_fr}`,
      ``,
      `> **Catégorie** : ${activePrompt.category} | **Modèles IA** : ${(activePrompt.models || []).join(', ')}`,
      ``,
      `## Objectif & Contexte`,
      activePrompt.description_fr,
      ``,
      `## Prompt Optimisé (Prêt à l'emploi)`,
      '```markdown',
      effectiveCustomizedPrompt,
      '```',
      activePrompt.guide_fr ? `\n## Directive Stratégique d'Exécution\n${activePrompt.guide_fr}\n` : ''
    ].join('\n');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePrompt.id || 'prompt'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Workspace Backup (.json)
  const handleExportWorkspaceJSON = () => {
    const payload = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      favorites,
      customPrompts,
      allSavedVars,
      contextProfiles,
      activeProfileId,
      playbookProgress
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-studio-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import Workspace Backup (.json)
  const handleImportWorkspaceJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (Array.isArray(data.favorites)) setFavorites(data.favorites);
        if (Array.isArray(data.customPrompts)) setCustomPrompts(data.customPrompts);
        if (data.allSavedVars && typeof data.allSavedVars === 'object') setAllSavedVars(data.allSavedVars);
        if (Array.isArray(data.contextProfiles)) setContextProfiles(data.contextProfiles);
        if (typeof data.activeProfileId === 'string') setActiveProfileId(data.activeProfileId);
        if (data.playbookProgress && typeof data.playbookProgress === 'object') setPlaybookProgress(data.playbookProgress);
      } catch {
        alert('Fichier de sauvegarde JSON invalide.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Keyboard shortcuts: Cmd/Ctrl+K (search), Up/Down (navigate), Cmd/Ctrl+Enter (copy), Esc
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (focusMode) setFocusMode(false);
        setActivePlaybookId(null);
        setMobilePane('feed');
        setTimeout(() => searchInputRef.current?.focus(), 20);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isModalOpen && !isProfileModalOpen) {
        e.preventDefault();
        handleCopy();
        return;
      }

      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false);
          return;
        }
        if (isProfileModalOpen) {
          setIsProfileModalOpen(false);
          return;
        }
        if (isLiveEditing) {
          setIsLiveEditing(false);
          return;
        }
        if (document.activeElement === searchInputRef.current) {
          if (search) setSearch('');
          else searchInputRef.current.blur();
        }
        return;
      }

      const tag = document.activeElement?.tagName?.toLowerCase();
      if (!isModalOpen && !isProfileModalOpen && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (activePlaybook) {
            e.preventDefault();
            const steps = activePlaybook.steps;
            const currentIdx = steps.findIndex(s => s.promptId === activePrompt?.id);
            const nextIdx = e.key === 'ArrowDown'
              ? (currentIdx < steps.length - 1 ? currentIdx + 1 : 0)
              : (currentIdx > 0 ? currentIdx - 1 : steps.length - 1);
            setActivePromptId(steps[nextIdx].promptId);
            return;
          }

          if (filteredPrompts.length === 0) return;
          e.preventDefault();
          const currentIndex = filteredPrompts.findIndex(p => p.id === activePrompt?.id);
          let nextIndex = 0;
          if (e.key === 'ArrowDown') {
            nextIndex = currentIndex < filteredPrompts.length - 1 ? currentIndex + 1 : 0;
          } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredPrompts.length - 1;
          }
          setActivePromptId(filteredPrompts[nextIndex].id);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filteredPrompts, activePrompt, activePlaybook, focusMode, isModalOpen, isProfileModalOpen, isLiveEditing, search, handleCopy]);

  // Scroll active card into view on keyboard nav
  useEffect(() => {
    activeCardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activePromptId]);

  // Extract {{variables}} live from custom prompt modal
  const detectedModalVars = useMemo(() => {
    const matches = formState.optimized_prompt.match(/\{\{([^}]+)\}\}/g) || [];
    const unique = Array.from(new Set(matches.map(m => m.replace(/^\{\{|\}\}$/g, '').trim()).filter(Boolean)));
    return unique;
  }, [formState.optimized_prompt]);

  const openNewPromptModal = () => {
    setEditingPromptId(null);
    setFormState({
      title_fr: '',
      category: !['Tous', 'Favoris', 'Personnalisés'].includes(selectedCategory) ? selectedCategory : 'Marketing',
      description_fr: '',
      optimized_prompt: `<system_role>\nYou are a Principal Expert specializing in {{domaine-expertise}}.\n</system_role>\n\n<context_inputs>\n  <objectif>{{objectif-principal}}</objectif>\n</context_inputs>\n\n<execution_guidelines>\n1. Analyze the context thoroughly.\n2. Deliver an actionable, production-ready blueprint.\n</execution_guidelines>`,
      guide_fr: '',
      models: ['ChatGPT', 'Claude', 'Gemini']
    });
    setIsModalOpen(true);
  };

  const openEditPromptModal = (promptItem) => {
    setEditingPromptId(promptItem.id);
    setFormState({
      title_fr: promptItem.title_fr || '',
      category: promptItem.category || 'Marketing',
      description_fr: promptItem.description_fr || '',
      optimized_prompt: promptItem.optimized_prompt || '',
      guide_fr: promptItem.guide_fr || '',
      models: promptItem.models || ['ChatGPT', 'Claude', 'Gemini']
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomPrompt = (e) => {
    e.preventDefault();
    if (!formState.title_fr.trim() || !formState.optimized_prompt.trim()) return;

    const varsList = detectedModalVars.map(v => {
      const cleanName = v.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return {
        name: cleanName,
        placeholder: `{{${v}}}`,
        desc_fr: `Renseignez votre paramètre (${cleanName.toLowerCase()}).`
      };
    });

    const newPromptObj = {
      id: editingPromptId || `custom-${Date.now()}`,
      isCustom: true,
      title_fr: formState.title_fr.trim(),
      title_en: formState.title_fr.trim(),
      category: formState.category,
      models: formState.models.length > 0 ? formState.models : ['ChatGPT', 'Claude'],
      variables_fr: varsList.length > 0 ? varsList.map(v => v.name).join(', ') : 'Aucune variable',
      variables_list: varsList,
      description_fr: formState.description_fr.trim() || 'Prompt personnalisé créé dans votre espace Prompt Studio.',
      optimized_prompt: formState.optimized_prompt,
      original_prompt: formState.optimized_prompt,
      guide_fr: formState.guide_fr.trim() || 'Personnalisez les variables ci-dessus avant de copier votre prompt.'
    };

    setCustomPrompts(prev => {
      if (editingPromptId) {
        return prev.map(p => p.id === editingPromptId ? newPromptObj : p);
      }
      return [newPromptObj, ...prev];
    });

    setActivePromptId(newPromptObj.id);
    setIsModalOpen(false);
  };

  const handleDeleteCustomPrompt = (id) => {
    setCustomPrompts(prev => prev.filter(p => p.id !== id));
    if (activePromptId === id) {
      setActivePromptId(promptsData[0]?.id || '');
    }
  };

  const toggleModelInForm = (modelName) => {
    setFormState(prev => {
      const exists = prev.models.includes(modelName);
      return {
        ...prev,
        models: exists ? prev.models.filter(m => m !== modelName) : [...prev.models, modelName]
      };
    });
  };

  // Context Profile Modal handlers
  const openNewProfileModal = () => {
    setEditingProfileId(null);
    setProfileForm({
      name: '',
      company_context: '',
      target_audience: '',
      brand_voice: '',
      tech_or_metrics: ''
    });
    setIsProfileModalOpen(true);
  };

  const openEditProfileModal = (prof) => {
    setEditingProfileId(prof.id);
    setProfileForm({
      name: prof.name || '',
      company_context: prof.company_context || '',
      target_audience: prof.target_audience || '',
      brand_voice: prof.brand_voice || '',
      tech_or_metrics: prof.tech_or_metrics || ''
    });
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return;
    const newProf = {
      id: editingProfileId || `prof-${Date.now()}`,
      name: profileForm.name.trim(),
      company_context: profileForm.company_context.trim(),
      target_audience: profileForm.target_audience.trim(),
      brand_voice: profileForm.brand_voice.trim(),
      tech_or_metrics: profileForm.tech_or_metrics.trim()
    };
    setContextProfiles(prev => {
      if (editingProfileId) {
        return prev.map(p => p.id === editingProfileId ? newProf : p);
      }
      return [...prev, newProf];
    });
    setActiveProfileId(newProf.id);
    setIsProfileModalOpen(false);
  };

  const handleDeleteProfile = (id) => {
    setContextProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfileId === id) {
      setActiveProfileId('');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-core)',
      overflow: 'hidden'
    }}>

      {/* Hidden file input for JSON workspace restore */}
      <input
        ref={fileImportRef}
        type="file"
        accept=".json"
        onChange={handleImportWorkspaceJSON}
        style={{ display: 'none' }}
      />

      {/* MOBILE / TABLET TOP BAR (< 960px) */}
      <header
        className="ps-mobile-nav"
        style={{
          height: '48px',
          backgroundColor: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-hairline)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0.85rem',
          flexShrink: 0,
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000'
          }}>
            <Command size={13} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-bright)' }}>
            Prompt Studio
          </span>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setMobilePane(mobilePane === 'sidebar' ? 'workbench' : 'sidebar')}
            style={{
              padding: '5px 9px',
              borderRadius: '6px',
              border: '1px solid var(--border-hairline)',
              backgroundColor: mobilePane === 'sidebar' ? 'var(--bg-highlight)' : 'transparent',
              color: mobilePane === 'sidebar' ? 'var(--accent-gold)' : 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ListFilter size={13} />
            <span>Navigation</span>
          </button>
          <button
            onClick={() => setMobilePane('feed')}
            style={{
              padding: '5px 9px',
              borderRadius: '6px',
              border: '1px solid var(--border-hairline)',
              backgroundColor: mobilePane === 'feed' ? 'var(--bg-highlight)' : 'transparent',
              color: mobilePane === 'feed' ? 'var(--accent-gold)' : 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {activePlaybook ? 'Étapes' : `Catalogue (${filteredPrompts.length})`}
          </button>
          <button
            onClick={() => setMobilePane('workbench')}
            style={{
              padding: '5px 9px',
              borderRadius: '6px',
              border: '1px solid var(--border-hairline)',
              backgroundColor: mobilePane === 'workbench' ? 'var(--bg-highlight)' : 'transparent',
              color: mobilePane === 'workbench' ? 'var(--accent-gold)' : 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Atelier
          </button>
        </div>
      </header>

      {/* MAIN 3-COLUMN WORKSPACE */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* 1. LEFT COLUMN: CATEGORIES, PLAYBOOKS & WORKSPACE SIDEBAR (~248px) */}
        {!focusMode && (
          <nav
            className={`ps-col-sidebar ${mobilePane !== 'sidebar' ? 'ps-col-hidden-mobile' : ''}`}
            style={{
              width: '248px',
              backgroundColor: 'var(--bg-sidebar)',
              borderRight: '1px solid var(--border-hairline)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flexShrink: 0,
              userSelect: 'none',
              overflowY: 'auto'
            }}
          >
            <div>
              {/* Logo & App Name */}
              <div style={{
                padding: '0.95rem 1rem 0.8rem',
                borderBottom: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    backgroundColor: 'var(--accent-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000'
                  }}>
                    <Command size={15} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-bright)' }}>
                      Prompt Studio
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Atelier d'Ingénierie IA
                    </div>
                  </div>
                </div>
              </div>

              {/* Action CTAs: New Custom Prompt & Context Profile */}
              <div style={{ padding: '0.6rem 0.65rem 0.2rem', display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                <button
                  onClick={openNewPromptModal}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: '1px solid var(--border-focus)',
                    backgroundColor: 'var(--accent-gold-subtle)',
                    color: 'var(--accent-gold)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                  <span>Nouveau Prompt</span>
                </button>

                {/* Context Profile Quick Selector */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: '7px',
                  padding: '3px 6px'
                }}>
                  <UserCheck size={13} color={activeProfile ? 'var(--accent-emerald)' : 'var(--text-faint)'} style={{ flexShrink: 0 }} />
                  <select
                    value={activeProfileId}
                    onChange={e => setActiveProfileId(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: activeProfile ? 'var(--text-bright)' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title="Sélectionner un Profil de Contexte Global"
                  >
                    <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-normal)' }}>
                      Profil : Aucun actif
                    </option>
                    {contextProfiles.map(prof => (
                      <option key={prof.id} value={prof.id} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-bright)' }}>
                        Profil : {prof.name}
                      </option>
                    ))}
                  </select>
                  {activeProfile ? (
                    <button
                      onClick={() => openEditProfileModal(activeProfile)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex'
                      }}
                      title="Modifier le profil actif"
                    >
                      <Edit3 size={12} />
                    </button>
                  ) : null}
                  <button
                    onClick={openNewProfileModal}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-gold)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex'
                    }}
                    title="Créer un nouveau Profil de Contexte"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* PLAYBOOKS SECTION */}
              <div style={{ padding: '0.6rem 0.9rem 0.25rem', fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Playbooks Multi-Étapes ({playbooksData.length})
              </div>
              <div style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {playbooksData.map(pb => {
                  const isSelected = activePlaybookId === pb.id;
                  const doneCount = pb.steps.filter(s => playbookProgress[`${pb.id}:${s.stepNumber}`]).length;
                  return (
                    <button
                      key={pb.id}
                      onClick={() => handleSelectPlaybook(pb)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 9px',
                        borderRadius: '7px',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        border: 'none',
                        backgroundColor: isSelected ? 'var(--bg-highlight)' : 'transparent',
                        color: isSelected ? 'var(--accent-gold)' : 'var(--text-normal)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                        <Compass size={13} color={isSelected ? 'var(--accent-gold)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pb.title_fr}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.64rem',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: doneCount === pb.steps.length ? 'var(--accent-emerald-subtle)' : 'var(--border-hairline)',
                        color: doneCount === pb.steps.length ? 'var(--accent-emerald)' : 'var(--text-faint)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0
                      }}>
                        {doneCount}/{pb.steps.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Categories Nav Header */}
              <div style={{ padding: '0.65rem 0.9rem 0.25rem', fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Catégories ({allPrompts.length})
              </div>

              {/* Categories list */}
              <div style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = !activePlaybookId && selectedCategory === cat.id;
                  const hasPrompts = cat.count > 0;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActivePlaybookId(null);
                        setSelectedCategory(cat.id);
                        setMobilePane('feed');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 9px',
                        borderRadius: '7px',
                        fontSize: '0.76rem',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icon size={13} color={isSelected ? 'var(--accent-gold)' : (hasPrompts ? 'var(--text-muted)' : 'var(--text-faint)')} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '148px' }}>
                          {cat.label}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? 'var(--accent-gold-subtle)' : 'var(--border-hairline)',
                        color: isSelected ? 'var(--accent-gold)' : 'var(--text-faint)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Model Filter Section */}
              <div style={{ padding: '0.75rem 0.9rem 0.25rem', fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Modèle Cible
              </div>
              <div style={{ padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {modelsList.map(m => {
                  const isSelected = selectedModel === m;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setActivePlaybookId(null);
                        setSelectedModel(m);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 9px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        border: 'none',
                        backgroundColor: isSelected ? 'var(--bg-highlight)' : 'transparent',
                        color: isSelected ? 'var(--accent-gold)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <Cpu size={12} style={{ marginRight: '0.45rem', opacity: isSelected ? 1 : 0.6 }} />
                      <span>{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer: Workspace JSON Backup/Restore, Shortcuts, Notion status & theme */}
            <div style={{
              padding: '0.65rem 0.85rem',
              borderTop: '1px solid var(--border-hairline)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={handleExportWorkspaceJSON}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '4px 6px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Exporter vos favoris, profils, progressions et prompts sur-mesure en JSON"
                >
                  <Save size={11} />
                  <span>Backup .json</span>
                </button>
                <button
                  onClick={() => fileImportRef.current?.click()}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '4px 6px',
                    borderRadius: '5px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Restaurer un fichier de sauvegarde JSON"
                >
                  <Upload size={11} />
                  <span>Importer</span>
                </button>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.65rem',
                color: 'var(--text-faint)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Keyboard size={11} /> Raccourcis
                </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>⌘K • ↑↓ • ⌘↵</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', boxShadow: '0 0 5px var(--accent-emerald)' }} />
                  <span>Notion Sync ({allPrompts.length})</span>
                </div>

                <button
                  onClick={toggleTheme}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '6px',
                    width: '25px',
                    height: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                  title="Basculer le thème Sombre / Clair"
                >
                  {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                </button>
              </div>
            </div>
          </nav>
        )}

        {/* 2. MIDDLE COLUMN: MODULES FEED OR PLAYBOOK STEPS (~328px) */}
        {!focusMode && (
          <section
            className={`ps-col-feed ${mobilePane !== 'feed' ? 'ps-col-hidden-mobile' : ''}`}
            style={{
              width: '328px',
              backgroundColor: 'var(--bg-feed)',
              borderRight: '1px solid var(--border-hairline)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}
          >
            {activePlaybook ? (
              /* PLAYBOOK GUIDED STEPS LIST */
              <>
                <div style={{
                  padding: '0.85rem',
                  borderBottom: '1px solid var(--border-hairline)',
                  backgroundColor: 'var(--bg-card)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--accent-gold-subtle)',
                      color: 'var(--accent-gold)'
                    }}>
                      Playbook • {activePlaybook.badge}
                    </span>
                    <button
                      onClick={() => setActivePlaybookId(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <X size={12} /> Quitter
                    </button>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.25rem' }}>
                    {activePlaybook.title_fr}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {activePlaybook.description_fr}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0.55rem' }}>
                  {activePlaybook.steps.map((step) => {
                    const promptObj = allPrompts.find(p => p.id === step.promptId);
                    const isCurrent = step.promptId === activePrompt?.id;
                    const isDone = Boolean(playbookProgress[`${activePlaybook.id}:${step.stepNumber}`]);
                    return (
                      <div
                        key={step.stepNumber}
                        onClick={() => {
                          setActivePromptId(step.promptId);
                          setMobilePane('workbench');
                        }}
                        style={{
                          padding: '0.8rem 0.85rem',
                          borderRadius: '8px',
                          marginBottom: '0.4rem',
                          cursor: 'pointer',
                          border: isCurrent ? '1px solid var(--border-focus)' : '1px solid var(--border-hairline)',
                          backgroundColor: isCurrent ? 'var(--bg-card)' : 'transparent',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: isCurrent ? 'var(--accent-gold)' : (isDone ? 'var(--accent-emerald)' : 'var(--text-faint)')
                          }}>
                            ÉTAPE {step.stepNumber} / {activePlaybook.steps.length}
                          </span>
                          <button
                            onClick={(e) => togglePlaybookStepDone(activePlaybook.id, step.stepNumber, e)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-hairline)',
                              backgroundColor: isDone ? 'var(--accent-emerald-subtle)' : 'var(--bg-input)',
                              color: isDone ? 'var(--accent-emerald)' : 'var(--text-faint)',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <CheckCircle2 size={11} />
                            <span>{isDone ? 'Terminé' : 'À faire'}</span>
                          </button>
                        </div>

                        <div style={{
                          fontSize: '0.83rem',
                          fontWeight: 700,
                          color: isCurrent ? 'var(--text-bright)' : 'var(--text-normal)',
                          marginBottom: '0.2rem'
                        }}>
                          {step.stepTitle}
                        </div>

                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                          {promptObj?.title_fr}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* STANDARD CATALOG FEED */
              <>
                <div style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--border-hairline)'
                }}>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Search size={14} color="var(--text-faint)" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Rechercher un prompt (⌘K)..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 28px 6px 30px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-hairline)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-bright)',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-faint)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Effacer la recherche"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-faint)', padding: '0 2px' }}>
                    <span>{selectedCategory === 'Tous' ? 'Tous les modules' : selectedCategory}</span>
                    <span>{filteredPrompts.length} module{filteredPrompts.length > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem' }}>
                  {filteredPrompts.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.8rem' }}>
                      Aucun prompt ne correspond à votre sélection.
                    </div>
                  ) : (
                    filteredPrompts.map((p, idx) => {
                      const isActive = p.id === activePrompt?.id;
                      const isFav = favorites.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          ref={isActive ? activeCardRef : null}
                          onClick={() => {
                            setActivePromptId(p.id);
                            setMobilePane('workbench');
                          }}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: isActive ? 'var(--accent-gold)' : 'var(--text-faint)', fontWeight: 700 }}>
                                #{String(idx + 1).padStart(2, '0')}
                              </span>
                              <span style={{
                                fontSize: '0.62rem',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                backgroundColor: 'var(--border-hairline)',
                                color: 'var(--text-muted)',
                                fontWeight: 600
                              }}>
                                {p.category}
                              </span>
                              {p.isCustom && (
                                <span style={{
                                  fontSize: '0.6rem',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  backgroundColor: 'var(--accent-gold-subtle)',
                                  color: 'var(--accent-gold)',
                                  fontWeight: 700
                                }}>
                                  Sur-mesure
                                </span>
                              )}
                            </div>

                            <button
                              onClick={(e) => toggleFavorite(p.id, e)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                color: isFav ? 'var(--accent-gold)' : 'var(--text-faint)'
                              }}
                              title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            >
                              <Star size={13} fill={isFav ? 'var(--accent-gold)' : 'none'} />
                            </button>
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
              </>
            )}
          </section>
        )}

        {/* 3. RIGHT COLUMN: WORKBENCH CANVAS (Full Screen Atelier) */}
        <main
          className={mobilePane !== 'workbench' ? 'ps-col-hidden-mobile' : ''}
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-workbench)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}
        >
          {activePrompt ? (
            <div
              className="ps-workbench-container"
              style={{
                padding: '1.75rem 2.75rem',
                maxWidth: focusMode ? '1180px' : '1040px',
                width: '100%',
                margin: '0 auto',
                transition: 'max-width 0.2s ease'
              }}
            >
              {/* PLAYBOOK STEP BANNER (when a Playbook is active) */}
              {activePlaybook && activePlaybookStep && (
                <div style={{
                  marginBottom: '1.25rem',
                  padding: '0.9rem 1.15rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-focus)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Compass size={15} color="var(--accent-gold)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                        {activePlaybook.title_fr} — {activePlaybookStep.stepTitle}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        disabled={activePlaybookStep.stepNumber <= 1}
                        onClick={() => {
                          const prevStep = activePlaybook.steps.find(s => s.stepNumber === activePlaybookStep.stepNumber - 1);
                          if (prevStep) setActivePromptId(prevStep.promptId);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-hairline)',
                          backgroundColor: 'var(--bg-input)',
                          color: activePlaybookStep.stepNumber <= 1 ? 'var(--text-faint)' : 'var(--text-normal)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: activePlaybookStep.stepNumber <= 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <ChevronLeft size={12} /> Précédent
                      </button>

                      <button
                        onClick={() => {
                          setPlaybookProgress(prev => ({
                            ...prev,
                            [`${activePlaybook.id}:${activePlaybookStep.stepNumber}`]: true
                          }));
                          const nextStep = activePlaybook.steps.find(s => s.stepNumber === activePlaybookStep.stepNumber + 1);
                          if (nextStep) setActivePromptId(nextStep.promptId);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'var(--accent-gold)',
                          color: '#000',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <span>
                          {activePlaybookStep.stepNumber < activePlaybook.steps.length
                            ? 'Valider & Étape suivante'
                            : 'Terminer le Playbook'}
                        </span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-normal)', lineHeight: 1.45 }}>
                    {activePlaybookStep.transitionNote}
                  </div>
                </div>
              )}

              {/* Top utility bar: Focus mode, Favorite, Share Link, Export MD */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-hairline)',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setFocusMode(prev => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: focusMode ? 'var(--bg-highlight)' : 'var(--bg-card)',
                      color: focusMode ? 'var(--accent-gold)' : 'var(--text-muted)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Masquer/Afficher les panneaux latéraux"
                  >
                    {focusMode ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
                    <span>{focusMode ? 'Quitter le Mode Focus' : 'Mode Focus'}</span>
                  </button>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--accent-gold)',
                    backgroundColor: 'var(--accent-gold-subtle)',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    {activePrompt.category}
                  </span>

                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {activePrompt.models?.join(' • ')}
                  </span>
                </div>

                {/* Right utility actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => toggleFavorite(activePrompt.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: favorites.includes(activePrompt.id) ? 'var(--accent-gold-subtle)' : 'var(--bg-card)',
                      color: favorites.includes(activePrompt.id) ? 'var(--accent-gold)' : 'var(--text-muted)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Star size={13} fill={favorites.includes(activePrompt.id) ? 'var(--accent-gold)' : 'none'} />
                    <span>{favorites.includes(activePrompt.id) ? 'Favori' : 'Épingler'}</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-card)',
                      color: linkCopied ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Copier le lien direct vers ce prompt"
                  >
                    {linkCopied ? <Check size={13} /> : <Link2 size={13} />}
                    <span>{linkCopied ? 'Lien copié' : 'Partager'}</span>
                  </button>

                  <button
                    onClick={handleExportMarkdown}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-muted)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Télécharger la fiche complète en Markdown (.md)"
                  >
                    <Download size={13} />
                    <span>Exporter .md</span>
                  </button>

                  {activePrompt.isCustom && (
                    <>
                      <button
                        onClick={() => openEditPromptModal(activePrompt)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '5px 9px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-hairline)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-bright)',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Modifier ce prompt personnalisé"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomPrompt(activePrompt.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '5px 9px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-hairline)',
                          backgroundColor: 'var(--accent-danger-subtle)',
                          color: 'var(--accent-danger)',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Supprimer ce prompt personnalisé"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Module header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: 'var(--text-bright)',
                  marginBottom: '0.5rem',
                  lineHeight: 1.25
                }}>
                  {activePrompt.title_fr}
                </h1>

                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6
                }}>
                  {activePrompt.description_fr}
                </p>
              </div>

              {/* TAB SELECTOR & ACTIONS BAR */}
              <div
                className="ps-toolbar-bar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-hairline)',
                  marginBottom: '1.35rem'
                }}
              >
                {/* Tab Switcher (100% SVG icons, zero decorative emoji) */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setActiveView('customized')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: activeView === 'customized' ? 'var(--border-card)' : 'transparent',
                      color: activeView === 'customized' ? 'var(--text-bright)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={13} color={activeView === 'customized' ? 'var(--accent-gold)' : 'currentColor'} />
                    <span>Prompt Optimisé & Personnalisé</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsLiveEditing(false);
                      setActiveView('original');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: activeView === 'original' ? 'var(--border-card)' : 'transparent',
                      color: activeView === 'original' ? 'var(--text-bright)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <FileText size={13} />
                    <span>Prompt Source Brut (Référence)</span>
                  </button>
                </div>

                {/* Action Buttons & AI Launchers */}
                <div className="ps-toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
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
                      fontSize: '0.79rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Copier le prompt (⌘+Entrée)"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copié !' : 'Copier le Prompt'}</span>
                  </button>

                  {[
                    { name: 'ChatGPT', url: 'https://chatgpt.com' },
                    { name: 'Claude', url: 'https://claude.ai/new' },
                    { name: 'Gemini', url: 'https://gemini.google.com/app' },
                    { name: 'Perplexity', url: 'https://www.perplexity.ai' }
                  ].map(launcher => (
                    <a
                      key={launcher.name}
                      href={launcher.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={handleCopy}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '6px 9px',
                        borderRadius: '7px',
                        border: '1px solid var(--border-hairline)',
                        backgroundColor: 'transparent',
                        color: 'var(--text-bright)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                      title={`Copie automatiquement le prompt et ouvre ${launcher.name}`}
                    >
                      <span>{launcher.name}</span>
                      <ArrowUpRight size={11} color="var(--text-faint)" />
                    </a>
                  ))}
                </div>
              </div>

              {/* ACTIVE CONTEXT PROFILE BAR (When a profile is selected) */}
              {activeView === 'customized' && activeProfile && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.7rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-emerald-subtle)',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.78rem', color: 'var(--text-bright)' }}>
                    <UserCheck size={14} color="var(--accent-emerald)" />
                    <span>Profil de Contexte actif : <strong>{activeProfile.name}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.73rem', color: 'var(--text-normal)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={injectProfileBlock}
                        onChange={e => {
                          setManualPromptText(null);
                          setInjectProfileBlock(e.target.checked);
                        }}
                      />
                      <span>Injecter le bloc XML de profil</span>
                    </label>

                    {activePrompt.variables_list && activePrompt.variables_list.length > 0 && (
                      <button
                        onClick={handlePrefillFromProfile}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-focus)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--accent-gold)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Wand2 size={12} />
                        <span>Pré-remplir les variables</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* DYNAMIC VARIABLES INPUTS (Only in customized view) */}
              {activeView === 'customized' && activePrompt.variables_list && activePrompt.variables_list.length > 0 && (
                <div style={{
                  marginBottom: '1.35rem',
                  padding: '1.15rem 1.25rem',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-hairline)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.85rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--accent-gold)'
                    }}>
                      <Sliders size={14} />
                      <span>Variables Interactives (Injection en direct)</span>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 7px',
                        borderRadius: '99px',
                        backgroundColor: filledVariablesCount === activePrompt.variables_list.length
                          ? 'var(--accent-emerald-subtle)'
                          : 'var(--border-hairline)',
                        color: filledVariablesCount === activePrompt.variables_list.length
                          ? 'var(--accent-emerald)'
                          : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'none'
                      }}>
                        {filledVariablesCount} / {activePrompt.variables_list.length} renseignée{filledVariablesCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {!activeProfile && (
                        <button
                          onClick={openNewProfileModal}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-hairline)',
                            backgroundColor: 'transparent',
                            color: 'var(--accent-gold)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="Créer un profil de contexte réutilisable"
                        >
                          <Wand2 size={12} />
                          <span>Créer un Profil de Contexte</span>
                        </button>
                      )}

                      {filledVariablesCount > 0 && (
                        <button
                          onClick={handleResetVariables}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-hairline)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-muted)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="Vider toutes les variables de ce prompt"
                        >
                          <RotateCcw size={12} />
                          <span>Réinitialiser</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    className="ps-vars-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: activePrompt.variables_list.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                      gap: '0.85rem'
                    }}
                  >
                    {activePrompt.variables_list.map(v => {
                      const val = variableInputs[v.name] || '';
                      const isFilled = val.trim() !== '';
                      return (
                        <div key={v.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.28rem' }}>
                            <label style={{
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: 'var(--text-bright)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}>
                              {isFilled && <CheckCircle2 size={12} color="var(--accent-emerald)" />}
                              <span>{v.name}</span>
                            </label>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                              {v.placeholder}
                            </span>
                          </div>
                          <input
                            type="text"
                            placeholder={v.desc_fr}
                            value={val}
                            onChange={e => handleVariableChange(v.name, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: isFilled ? '1px solid var(--border-focus)' : '1px solid var(--border-hairline)',
                              backgroundColor: 'var(--bg-input)',
                              color: 'var(--text-bright)',
                              fontSize: '0.82rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CODE PREVIEW & LIVE EDITOR BOX */}
              <div style={{
                borderRadius: '12px',
                border: isLiveEditing ? '1px solid var(--border-focus)' : '1px solid var(--border-hairline)',
                backgroundColor: 'var(--bg-input)',
                overflow: 'hidden',
                marginBottom: '1.35rem'
              }}>
                <div style={{
                  padding: '7px 12px',
                  borderBottom: '1px solid var(--border-hairline)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem',
                  color: 'var(--text-faint)',
                  flexWrap: 'wrap',
                  gap: '0.4rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileCode size={13} color="var(--accent-gold)" />
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-normal)' }}>
                      {activeView === 'customized' ? 'prompt_optimise.xml' : 'prompt_source_brut.md'}
                    </span>
                    {manualPromptText !== null && activeView === 'customized' && (
                      <span style={{
                        fontSize: '0.64rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--accent-gold-subtle)',
                        color: 'var(--accent-gold)',
                        fontWeight: 700
                      }}>
                        Modifié manuellement
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.69rem', color: 'var(--text-muted)' }}>
                      ~{estimatedTokens} tokens • {displayedPromptText.length} car.
                    </span>

                    {activeView === 'customized' && (
                      <>
                        {manualPromptText !== null && (
                          <button
                            onClick={() => {
                              setManualPromptText(null);
                              setIsLiveEditing(false);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '3px 7px',
                              borderRadius: '5px',
                              border: '1px solid var(--border-hairline)',
                              backgroundColor: 'transparent',
                              color: 'var(--text-muted)',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="Revenir au prompt généré automatiquement"
                          >
                            <RotateCcw size={11} /> Réinitialiser
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!isLiveEditing && manualPromptText === null) {
                              setManualPromptText(computedPrompt);
                            }
                            setIsLiveEditing(prev => !prev);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: isLiveEditing ? '1px solid var(--border-focus)' : '1px solid var(--border-hairline)',
                            backgroundColor: isLiveEditing ? 'var(--accent-gold-subtle)' : 'var(--bg-input)',
                            color: isLiveEditing ? 'var(--accent-gold)' : 'var(--text-normal)',
                            fontSize: '0.69rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {isLiveEditing ? <Eye size={11} /> : <Edit3 size={11} />}
                          <span>{isLiveEditing ? 'Aperçu Colorisé' : 'Éditer le texte'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isLiveEditing && activeView === 'customized' ? (
                  <textarea
                    value={effectiveCustomizedPrompt}
                    onChange={e => setManualPromptText(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: focusMode ? '520px' : '380px',
                      padding: '1.25rem',
                      fontSize: '0.82rem',
                      lineHeight: 1.65,
                      color: 'var(--text-bright)',
                      backgroundColor: 'var(--bg-input)',
                      border: 'none',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  <pre style={{
                    padding: '1.25rem',
                    fontSize: '0.82rem',
                    lineHeight: 1.65,
                    color: 'var(--text-normal)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: focusMode ? '580px' : '440px',
                    overflowY: 'auto'
                  }}>
                    <code>
                      <HighlightedPrompt text={displayedPromptText} />
                    </code>
                  </pre>
                )}
              </div>

              {/* STRATEGIC NOTE (EXECUTIVE BRIEF) */}
              {activePrompt.guide_fr && (
                <div style={{
                  padding: '1.05rem 1.25rem',
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
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '0.35rem'
                  }}>
                    <BookOpen size={14} />
                    <span>Directive Stratégique d'Exécution</span>
                  </div>
                  <p style={{
                    fontSize: '0.85rem',
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
              Sélectionnez un prompt dans le catalogue.
            </div>
          )}
        </main>

      </div>

      {/* MODAL 1: CREATE / EDIT CUSTOM PROMPT */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-modal-backdrop)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 100
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-gold)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)' }}>
                  {editingPromptId ? 'Modifier le Prompt Sur-Mesure' : 'Créer un Prompt Sur-Mesure'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPrompt} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="ps-vars-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                    Titre du Prompt (FR) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Architecte de Stratégie Go-To-Market SaaS"
                    value={formState.title_fr}
                    onChange={e => setFormState({ ...formState, title_fr: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-bright)',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                    Catégorie
                  </label>
                  <select
                    value={formState.category}
                    onChange={e => setFormState({ ...formState, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-bright)',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  >
                    <option value="Marketing">Marketing & Croissance</option>
                    <option value="Coding">Code & Développement</option>
                    <option value="Design">Design & Visuels</option>
                    <option value="Sales">Vente & Conversion</option>
                    <option value="Copywriting">Copywriting & Écriture</option>
                    <option value="SEO">SEO & Visibilité</option>
                    <option value="Automation">Agents IA & Automatisation</option>
                    <option value="Business">Productivité & Stratégie</option>
                    <option value="Finance">Data, Finance & Analyse</option>
                  </select>
                </div>
              </div>

              {/* Target AI Models */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                  Modèles IA Recommandés
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {['ChatGPT', 'Claude', 'Gemini', 'DeepSeek'].map(m => {
                    const active = formState.models.includes(m);
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => toggleModelInForm(m)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: active ? '1px solid var(--border-focus)' : '1px solid var(--border-hairline)',
                          backgroundColor: active ? 'var(--accent-gold-subtle)' : 'var(--bg-input)',
                          color: active ? 'var(--accent-gold)' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description FR */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                  Description Synthétique (FR)
                </label>
                <textarea
                  rows={2}
                  placeholder="Décrivez en 1 ou 2 phrases l'objectif opérationnel de ce prompt..."
                  value={formState.description_fr}
                  onChange={e => setFormState({ ...formState, description_fr: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-bright)',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-main)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Prompt Body with auto variable detection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                    Structure du Prompt * (utilisez <code style={{ color: 'var(--accent-gold)' }}>{'{{nom-variable}}'}</code> pour créer des champs dynamiques)
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                    {detectedModalVars.length} variable{detectedModalVars.length > 1 ? 's' : ''} détectée{detectedModalVars.length > 1 ? 's' : ''}
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={formState.optimized_prompt}
                  onChange={e => setFormState({ ...formState, optimized_prompt: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-bright)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1.5,
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Strategic guide */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                  Directive Stratégique d'Exécution (FR)
                </label>
                <textarea
                  rows={2}
                  placeholder="Conseil d'utilisation ou bonnes pratiques pour obtenir le meilleur résultat..."
                  value={formState.guide_fr}
                  onChange={e => setFormState({ ...formState, guide_fr: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-bright)',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-main)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '7px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 16px',
                    borderRadius: '7px',
                    border: 'none',
                    backgroundColor: 'var(--accent-gold)',
                    color: '#000',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {editingPromptId ? 'Enregistrer les modifications' : 'Ajouter à ma Bibliothèque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT CONTEXT PROFILE */}
      {isProfileModalOpen && (
        <div
          onClick={() => setIsProfileModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-modal-backdrop)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 100
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={16} color="var(--accent-emerald)" />
                <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-bright)' }}>
                  {editingProfileId ? 'Modifier le Profil de Contexte' : 'Nouveau Profil de Contexte Global'}
                </h2>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.5 }}>
              Enregistrez le contexte récurrent d'un projet, d'une marque ou d'un client pour pré-remplir les variables en un clic ou l'injecter automatiquement dans vos prompts.
            </p>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.25rem' }}>
                  Nom du Profil *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mon SaaS B2B / Agence Créative / Client E-Commerce"
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-bright)',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.25rem' }}>
                  Entreprise, Offre & Proposition de Valeur
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Plateforme SaaS d'automatisation comptable pour PME..."
                  value={profileForm.company_context}
                  onChange={e => setProfileForm({ ...profileForm, company_context: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-bright)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-main)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.25rem' }}>
                  Audience Cible & Profil Client Idéal (ICP)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dirigeants de PME (10-50 salariés), Directeurs Financiers, Fondateurs Tech"
                  value={profileForm.target_audience}
                  onChange={e => setProfileForm({ ...profileForm, target_audience: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-bright)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.25rem' }}>
                  Ton, Voix de Marque & Style Éditorial
                </label>
                <input
                  type="text"
                  placeholder="Ex: Direct, chirurgical, orienté ROI, sans jargon creux, vouvoiement"
                  value={profileForm.brand_voice}
                  onChange={e => setProfileForm({ ...profileForm, brand_voice: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-bright)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.25rem' }}>
                  Stack Technique, Outils ou Objectifs Chiffrés
                </label>
                <input
                  type="text"
                  placeholder="Ex: Next.js, TypeScript, Supabase, Stripe | Objectif : +25% conversion"
                  value={profileForm.tech_or_metrics}
                  onChange={e => setProfileForm({ ...profileForm, tech_or_metrics: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-bright)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                {editingProfileId ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteProfile(editingProfileId);
                      setIsProfileModalOpen(false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 12px',
                      borderRadius: '7px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--accent-danger-subtle)',
                      color: 'var(--accent-danger)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Supprimer</span>
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '7px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '7px 16px',
                      borderRadius: '7px',
                      border: 'none',
                      backgroundColor: 'var(--accent-gold)',
                      color: '#000',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Enregistrer le Profil
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
