import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Copy, Check, Sliders, Sun, Moon, Sparkles, BookOpen, Layers,
  Cpu, ArrowUpRight, Megaphone, Globe, Code2, Palette,
  ShoppingBag, PenTool, FileCode, Star, Plus, Download, Link2,
  RotateCcw, PanelLeftClose, PanelLeftOpen, Command, FileText,
  Trash2, Edit3, X, FolderHeart, CheckCircle2, Keyboard, ListFilter,
  Bot, Briefcase, LineChart, UserCheck, Wand2, Upload, Save,
  Compass, ChevronRight, ChevronLeft, Eye,
  ShoppingCart, Scale, Video, History, Columns2, Gauge, CornerDownLeft,
  FlaskConical, FileSpreadsheet, Layers3, SlidersHorizontal, ShieldAlert, ListOrdered, Play, FileCheck2, Boxes
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
  RECENT_HISTORY: 'ps_recent_history_v1',
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
  const [recentHistory, setRecentHistory] = useState(() => safeLoadJSON(STORAGE_KEYS.RECENT_HISTORY, []));

  // Navigation & filter states
  const [mainNavView, setMainNavView] = useState('home'); // 'home' | 'library' | 'playbooks' | 'workbench'
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedModel, setSelectedModel] = useState('Tous');
  const [activePlaybookId, setActivePlaybookId] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [mobilePane, setMobilePane] = useState('workbench'); // 'sidebar' | 'feed' | 'workbench'

  // Command Palette Cmd+K modal states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [commandSelectedIndex, setCommandSelectedIndex] = useState(0);

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
  const [activeView, setActiveView] = useState('customized'); // 'customized' | 'original' | 'split'
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

  // Prompt Builder Wizard states
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState(1);
  const [builderForm, setBuilderForm] = useState({
    title_fr: '',
    category: 'Marketing',
    description_fr: '',
    role: '',
    seniority: 'Principal Staff Specialist',
    domain: '',
    objective: '',
    variables: [
      { name: 'Sujet Principal', placeholder: '{{sujet-principal}}', desc_fr: 'Thème ou livrable central' },
      { name: 'Public Cible', placeholder: '{{public-cible}}', desc_fr: 'Audience ou profil visé' }
    ],
    guidelines: [
      'Analyser en profondeur les paramètres d’entrée avant toute exécution',
      'Proposer des solutions concrètes immédiatement déployables sans remplissage générique',
      'Structurer la réponse selon le schéma déterministe avec une précision de niveau expert'
    ],
    negativeConstraints: 'Pas de platitudes ni de jargon creux. Ne pas omettre les cas limites ni les garde-fous de scaling.',
    outputSections: [
      '1. Architecture Stratégique & Principes Fondateurs',
      '2. Plan d’Exécution & Livrables Concrets Prêts au Déploiement',
      '3. Garde-Fous de Scaling & Métriques de Validation'
    ]
  });

  // Output Sandbox states
  const [sandboxModelStyle, setSandboxModelStyle] = useState('claude'); // 'claude' | 'chatgpt' | 'gemini'
  const [copiedSandbox, setCopiedSandbox] = useState(false);

  // Benchmarking & A/B Evaluation states (Phase 7)
  const [benchmarkVariantB, setBenchmarkVariantB] = useState('');
  const [benchmarkVariantBEdited, setBenchmarkVariantBEdited] = useState(false);
  const [copiedBenchmarkReport, setCopiedBenchmarkReport] = useState(false);

  const searchInputRef = useRef(null);
  const activeCardRef = useRef(null);
  const fileImportRef = useRef(null);
  const commandInputRef = useRef(null);

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

  // Sync recent copy history
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECENT_HISTORY, JSON.stringify(recentHistory));
  }, [recentHistory]);

  // Reset live manual edit override and benchmark variant B when switching prompt
  useEffect(() => {
    setIsLiveEditing(false);
    setManualPromptText(null);
    setBenchmarkVariantB('');
    setBenchmarkVariantBEdited(false);
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

  // Categories list with SVG icons and dynamic counts (12 categories + Favorites + Recents + Custom)
  const categories = useMemo(() => [
    { id: 'Tous', label: 'Toutes les catégories', icon: Layers, count: allPrompts.length },
    { id: 'Favoris', label: 'Prompts Favoris', icon: Star, count: allPrompts.filter(p => favorites.includes(p.id)).length },
    { id: 'Recents', label: 'Récemment Copiés', icon: History, count: recentHistory.filter(h => allPrompts.some(p => p.id === h.id)).length },
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
    { id: 'Ecommerce', label: 'E-Commerce & Retail', icon: ShoppingCart, count: allPrompts.filter(p => p.category?.toLowerCase() === 'ecommerce').length },
    { id: 'Operations', label: 'Juridique, RH & Opérations', icon: Scale, count: allPrompts.filter(p => p.category?.toLowerCase() === 'operations').length },
    { id: 'Media', label: 'Vidéo, YouTube & Créateurs', icon: Video, count: allPrompts.filter(p => p.category?.toLowerCase() === 'media').length },
  ], [allPrompts, favorites, recentHistory, customPrompts]);

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
    const recentOrderMap = new Map(recentHistory.map((h, i) => [h.id, i]));
    const matching = allPrompts.filter(p => {
      let matchCat = true;
      if (selectedCategory === 'Favoris') {
        matchCat = favorites.includes(p.id);
      } else if (selectedCategory === 'Recents') {
        matchCat = recentOrderMap.has(p.id);
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

    if (selectedCategory === 'Recents') {
      return [...matching].sort((a, b) => (recentOrderMap.get(a.id) ?? 999) - (recentOrderMap.get(b.id) ?? 999));
    }
    return matching;
  }, [allPrompts, selectedCategory, selectedModel, search, favorites, recentHistory]);

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
  const rawReferencePromptText = activePrompt?.original_prompt || 'Structure source non disponible pour ce module.';
  const displayedPromptText = activeView === 'original'
    ? rawReferencePromptText
    : effectiveCustomizedPrompt;

  const estimatedTokens = useMemo(() => {
    return Math.max(1, Math.ceil((displayedPromptText || '').length / 3.8));
  }, [displayedPromptText]);

  const rawEstimatedTokens = useMemo(() => {
    return Math.max(1, Math.ceil((rawReferencePromptText || '').length / 3.8));
  }, [rawReferencePromptText]);

  // Count filled variables
  const filledVariablesCount = useMemo(() => {
    if (!activePrompt?.variables_list) return 0;
    return activePrompt.variables_list.filter(v => (variableInputs[v.name] || '').trim() !== '').length;
  }, [activePrompt, variableInputs]);

  // Real-time Prompt Engineering Quality Score (/100) & Checklist
  const promptQualityReport = useMemo(() => {
    const text = effectiveCustomizedPrompt || '';
    const totalVars = activePrompt?.variables_list?.length || 0;
    const unreplacedMatches = text.match(/\{\{[^}]+\}\}/g) || [];

    const hasRole = /<system_role>|<role>|you are a/i.test(text);
    const hasGuidelines = /<execution_guidelines>|<instructions>|<methodology>|<constraints>/i.test(text);
    const hasSchema = /<structured_output_schema>|<output_format>|### 1\./i.test(text);
    const varsRatio = totalVars === 0
      ? 1
      : Math.max(filledVariablesCount / totalVars, unreplacedMatches.length === 0 ? 1 : 0);
    const varsPoints = Math.round(varsRatio * 25);
    const hasContextBoost = Boolean((activeProfile && injectProfileBlock) || manualPromptText !== null || filledVariablesCount > 0);
    const contextPoints = hasContextBoost ? 15 : 5;

    const score = Math.min(
      100,
      (hasRole ? 20 : 5) +
      (hasGuidelines ? 20 : 5) +
      (hasSchema ? 20 : 5) +
      varsPoints +
      contextPoints
    );

    const checks = [
      { id: 'role', label: 'Persona & Rôle Système', ok: hasRole },
      { id: 'guidelines', label: 'Directives & Contraintes', ok: hasGuidelines },
      { id: 'schema', label: 'Schéma de Sortie Structuré', ok: hasSchema },
      {
        id: 'vars',
        label: totalVars > 0 ? `Variables (${filledVariablesCount}/${totalVars})` : 'Variables Prêtes',
        ok: totalVars === 0 || filledVariablesCount === totalVars || unreplacedMatches.length === 0
      },
      { id: 'context', label: 'Contexte Métier Injecté', ok: hasContextBoost }
    ];

    return { score, checks };
  }, [effectiveCustomizedPrompt, activePrompt, filledVariablesCount, activeProfile, injectProfileBlock, manualPromptText]);

  // Copy handler (also records into recentHistory)
  const handleCopy = useCallback(() => {
    if (!activePrompt) return;
    const text = activeView === 'original'
      ? (activePrompt.original_prompt || effectiveCustomizedPrompt)
      : effectiveCustomizedPrompt;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setRecentHistory(prev => {
      const filtered = prev.filter(item => item.id !== activePrompt.id);
      return [{ id: activePrompt.id, copiedAt: new Date().toISOString() }, ...filtered].slice(0, 15);
    });
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

  // Assembled Builder Prompt (Computed live from Prompt Builder Wizard form)
  const assembledBuilderPrompt = useMemo(() => {
    const role = (builderForm.role || 'Executive Principal AI Strategist').trim();
    const seniority = (builderForm.seniority || 'Principal Staff Specialist').trim();
    const domain = (builderForm.domain || builderForm.category || 'Stratégie & Métier').trim();
    const objective = (builderForm.objective || builderForm.description_fr || 'Produire une solution déterministe d’excellence').trim();

    const variablesXml = builderForm.variables && builderForm.variables.length > 0
      ? builderForm.variables.map(v => `    <${v.placeholder.replace(/[{}]/g, '').replace(/[- ]+/g, '_')}>${v.placeholder}</${v.placeholder.replace(/[{}]/g, '').replace(/[- ]+/g, '_')}> <!-- ${v.desc_fr || v.name} -->`).join('\n')
      : '    <sujet_principal>{{sujet-principal}}</sujet_principal>';

    const guidelinesXml = builderForm.guidelines && builderForm.guidelines.length > 0
      ? builderForm.guidelines.map(g => `    - ${g}`).join('\n')
      : '    - Analyser avec rigueur chaque contrainte métier avant toute synthèse\n    - Formuler des livrables exploitables sans platitudes';

    const outputSectionsXml = builderForm.outputSections && builderForm.outputSections.length > 0
      ? builderForm.outputSections.map(sec => `    <section title="${sec}">\n      [Livrable ultra-détaillé, métriques cibles et étapes de validation]\n    </section>`).join('\n')
      : '    <section title="1. Synthèse Opérationnelle & Livrables">\n      [Contenu déterministe de haut niveau]\n    </section>';

    const negativeConstraints = builderForm.negativeConstraints
      ? `  <negative_constraints>\n    ${builderForm.negativeConstraints}\n  </negative_constraints>\n\n`
      : '';

    return `<system_role>
  You are an elite ${role} (${seniority}) specializing in ${domain}.
  Your primary mission: ${objective}.
</system_role>

<input_parameters>
${variablesXml}
</input_parameters>

<execution_guidelines>
${guidelinesXml}
</execution_guidelines>

${negativeConstraints}<structured_output_schema>
${outputSectionsXml}
</structured_output_schema>`;
  }, [builderForm]);

  // Simulated AI Output Sandbox generator (Deterministic, highly realistic output simulation)
  const simulatedOutput = useMemo(() => {
    if (!activePrompt) return '';
    const style = sandboxModelStyle;
    const title = activePrompt.title_fr;
    const cat = activePrompt.category;
    const modelBadge = style === 'claude' ? 'Claude 3.5 Sonnet' : style === 'chatgpt' ? 'ChatGPT (GPT-4o)' : 'Gemini 1.5 Pro';

    // Collect effective variable values
    const varsDisplay = (activePrompt.variables_list || []).map(v => {
      const val = (variableInputs[v.name] || '').trim();
      return `- **${v.name}** : \`${val || `[Non renseigné : ${v.placeholder}]`}\``;
    }).join('\n');

    let personaIntro = '';
    let analysisBlock = '';
    let recommendationsBlock = '';
    let guardrailsBlock = '';

    if (style === 'claude') {
      personaIntro = `### Analyse Stratégique & Cadre d'Exécution\nEn tant que spécialiste senior pour la thématique **${title}** (${cat}), j'ai analysé les paramètres fournis et consolidé une architecture d'action sans compromis sur la rigueur.`;
      analysisBlock = `#### 1. Diagnostic des Paramètres d'Entrée\n${varsDisplay || '- Paramètres standards appliqués.'}\n\n*Évaluation des leviers clés :* La cohérence entre les objectifs fixés et le périmètre opérationnel permet d'envisager un déploiement fluide en évitant les écueils habituels de dispersion.`;
      recommendationsBlock = `#### 2. Plan d'Action & Livrables Concrets\n- **Axe Prioritaire (Immédiat - S+1)** : Formalisation de la matrice décisionnelle et alignement des parties prenantes.\n- **Axe Structurant (S+2 à S+4)** : Déploiement des livrables selon les spécifications précises du schéma structuré.\n- **Axe d'Optimisation Continue** : Revue itérative basée sur des données mesurables et feedback terrain.`;
      guardrailsBlock = `#### 3. Garde-Fous de Scaling & Métriques de Validation\n- **Indicateur Clé de Réussite (KPI 1)** : Taux de conformité aux critères d'acceptation > 95%.\n- **Garde-fou** : Aucune validation sans revue préalable de sécurité et de viabilité opérationnelle.`;
    } else if (style === 'chatgpt') {
      personaIntro = `### Synthèse Opérationnelle & Feuille de Route\nVoici le plan d'exécution complet et immédiatement actionnable conçu pour **${title}**.`;
      analysisBlock = `#### 1. Paramètres Pris en Compte\n${varsDisplay || '- Paramètres configurés par défaut.'}\n\n> **Objectif clé :** Atteindre une exécution directe avec une vélocité maximale sans compromettre la qualité.`;
      recommendationsBlock = `#### 2. Livrables Directs Clés en Main\n1. **Synthèse Exécutive** : Cadrage validé et priorités arrêtées.\n2. **Guide Opérationnel** : Procédure pas-à-pas prête au déploiement pour votre équipe.\n3. **Boîte à Outils d'Accélération** : Checklists de contrôle qualité avant mise en production.`;
      guardrailsBlock = `#### 3. Facteurs Clés de Succès\n- Alignement continu des équipes sur les jalons hebdomadaires.\n- Rigueur dans le respect des contraintes d'optimisation définies.`;
    } else {
      // Gemini style
      personaIntro = `### Cartographie Exhaustive & Architecture Globale\n**Modèle d'Exécution :** Analyse multi-dimensionnelle pour le module **${title}**.`;
      analysisBlock = `#### 1. Matrice des Données d'Entrée\n${varsDisplay || '- Données standards.'}\n\nL'analyse croisée démontre un alignement fort avec les bonnes pratiques du domaine (${cat}).`;
      recommendationsBlock = `#### 2. Recommandations Haute Densité Informationnelle\n* **Phase d'Amorçage** : Mise en place des fondations techniques et organisationnelles.\n* **Phase d'Accélération** : Industrialisation des processus et automatisation des tâches récurrentes.\n* **Phase de Consolidation** : Monitoring prédictif et capitalisation des apprentissages.`;
      guardrailsBlock = `#### 3. Évaluation des Risques & Mitigations\n- **Risque d'écart de cadrage** : Mitigé par des points de synchronisation synchrones et asynchrones.\n- **Seuil de tolérance** : Zéro écart non documenté lors du cycle de revue.`;
    }

    return `# [Simulation de Sortie — ${modelBadge}]
**Module :** ${title} (${cat})
**Date de simulation :** ${new Date().toLocaleDateString('fr-FR')}

---

${personaIntro}

${analysisBlock}

${recommendationsBlock}

${guardrailsBlock}

---
*Sortie simulée générée par Prompt Studio via analyse du schéma déterministe.*`;
  }, [activePrompt, sandboxModelStyle, variableInputs]);

  // Export Professional Team Specification (.md)
  const handleExportTeamSpec = () => {
    if (!activePrompt) return;
    const specDate = new Date().toLocaleDateString('fr-FR');
    const isoDate = new Date().toISOString().slice(0, 10);
    const varsTable = (activePrompt.variables_list && activePrompt.variables_list.length > 0)
      ? [
          '| Paramètre | Clé XML / Placeholder | Valeur Actuelle | Description Fonctionnelle |',
          '| :--- | :--- | :--- | :--- |',
          ...activePrompt.variables_list.map(v => {
            const currentVal = (variableInputs[v.name] || '').trim();
            const safeVal = currentVal ? currentVal.replace(/\|/g, '\\|') : '*[Non renseigné]*';
            return `| **${v.name}** | \`${v.placeholder}\` | ${safeVal} | ${v.desc_fr || '-'} |`;
          })
        ].join('\n')
      : '*Aucun paramètre dynamique requis pour ce module.*';

    const specContent = [
      `# Fiche de Spécification Technique & Gouvernance IA`,
      `**Module :** ${activePrompt.title_fr}`,
      `**Référence Identifiant :** \`${activePrompt.id}\` | **Date d'Émission :** ${specDate}`,
      ``,
      `---`,
      ``,
      `## 1. Cartouche de Gouvernance & Métadonnées`,
      `- **Catégorie Fonctionnelle** : ${activePrompt.category}`,
      `- **Modèles IA Cibles Homologués** : ${(activePrompt.models || []).join(', ')}`,
      `- **Score de Rigueur du Prompt** : ${promptQualityReport.score}/100`,
      `- **Profil Métier Actif** : ${activeProfile ? activeProfile.name : 'Profil Standard (Aucun)'}`,
      `- **Nombre de Tokens Estimés** : ~${estimatedTokens} tokens`,
      ``,
      `## 2. Objectif Métier & Contexte d'Utilisation`,
      activePrompt.description_fr,
      ``,
      `## 3. Matrice des Paramètres & Variables d'Entrée`,
      varsTable,
      ``,
      activePrompt.guide_fr ? `## 4. Directive Stratégique d'Exécution\n${activePrompt.guide_fr}\n` : '',
      `## 5. Spécification Complète du Prompt Déployable`,
      '```xml',
      effectiveCustomizedPrompt,
      '```',
      ``,
      `---`,
      `*Document généré automatiquement via Prompt Studio — Tous droits réservés.*`
    ].filter(Boolean).join('\n');

    const blob = new Blob([specContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spec-technique-${activePrompt.id || 'prompt'}-${isoDate}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Phase 7: Benchmark Multi-Model Cost & Token Projections
  const benchmarkCostEstimate = useMemo(() => {
    const promptLength = (effectiveCustomizedPrompt || '').length;
    const inputTokens = Math.max(1, Math.ceil(promptLength / 3.8));
    const projectedOutputTokens = 950; // Average structured completion size
    const totalTokensPerRun = inputTokens + projectedOutputTokens;

    // Pricing rates per 1M tokens (Standard 2026 enterprise pricing)
    // Claude 3.5 Sonnet: $3.00 input / $15.00 output
    // GPT-4o: $2.50 input / $10.00 output
    // Gemini 1.5 Pro: $3.50 input / $10.50 output
    const models = [
      {
        id: 'claude',
        name: 'Claude 3.5 Sonnet',
        rateIn: 3.00,
        rateOut: 15.00,
        costPer1kRuns: ((inputTokens * 3.00 + projectedOutputTokens * 15.00) / 1000000) * 1000
      },
      {
        id: 'chatgpt',
        name: 'ChatGPT (GPT-4o)',
        rateIn: 2.50,
        rateOut: 10.00,
        costPer1kRuns: ((inputTokens * 2.50 + projectedOutputTokens * 10.00) / 1000000) * 1000
      },
      {
        id: 'gemini',
        name: 'Gemini 1.5 Pro',
        rateIn: 3.50,
        rateOut: 10.50,
        costPer1kRuns: ((inputTokens * 3.50 + projectedOutputTokens * 10.50) / 1000000) * 1000
      }
    ];

    return {
      inputTokens,
      projectedOutputTokens,
      totalTokensPerRun,
      models
    };
  }, [effectiveCustomizedPrompt]);

  // Phase 7: Benchmark Multi-Axes Rigor Audit Report (5 Pillars)
  const benchmarkAuditReport = useMemo(() => {
    const text = effectiveCustomizedPrompt || '';
    const hasRole = /<system_role>|<role>|you are an? (elite|senior|expert|lead)/i.test(text);
    const hasGuidelines = /<execution_guidelines>|<instructions>|<guidelines>/i.test(text);
    const hasSchema = /<structured_output_schema>|<output_format>|<section/i.test(text);
    const hasConstraints = /<negative_constraints>|<constraints>|never|do not/i.test(text);
    const hasDynamicVars = (activePrompt?.variables_list?.length || 0) > 0;
    const tokens = Math.max(1, Math.ceil(text.length / 3.8));

    // Pillar 1: Persona Seniority & Authority (20 pts)
    const scorePillar1 = hasRole ? 20 : 8;
    // Pillar 2: Execution Rigor & Methodology (20 pts)
    const scorePillar2 = hasGuidelines ? 20 : 7;
    // Pillar 3: Deterministic Schema & Formatting (20 pts)
    const scorePillar3 = hasSchema ? 20 : 6;
    // Pillar 4: Token Efficiency & Compactness (20 pts) - optimal between 180 and 850 tokens
    const scorePillar4 = tokens >= 150 && tokens <= 1100 ? 20 : (tokens < 150 ? 10 : 14);
    // Pillar 5: Guardrails & Anti-Hallucination (20 pts)
    const scorePillar5 = hasConstraints ? 20 : (hasGuidelines ? 12 : 5);

    const totalRigorScore = scorePillar1 + scorePillar2 + scorePillar3 + scorePillar4 + scorePillar5;

    const pillars = [
      {
        name: 'Autorité & Clarté du Persona',
        score: scorePillar1,
        max: 20,
        status: scorePillar1 >= 18 ? 'Conforme' : 'À renforcer',
        detail: hasRole ? 'Persona senior délimité avec ancrage méthodologique' : 'Rôle générique sans spécification de séniorité'
      },
      {
        name: 'Rigueur des Directives & Cadre',
        score: scorePillar2,
        max: 20,
        status: scorePillar2 >= 18 ? 'Conforme' : 'À renforcer',
        detail: hasGuidelines ? 'Directives ordonnées et prescriptions d’exécution explicites' : 'Directives manquantes ou implicites'
      },
      {
        name: 'Déterminisme du Schéma de Sortie',
        score: scorePillar3,
        max: 20,
        status: scorePillar3 >= 18 ? 'Conforme' : 'À renforcer',
        detail: hasSchema ? 'Balises de section strictes forçant une réponse sans digression' : 'Format de restitution libre sans balise structurante'
      },
      {
        name: 'Efficience Tokens & Densité',
        score: scorePillar4,
        max: 20,
        status: scorePillar4 >= 18 ? 'Conforme' : 'Optimisable',
        detail: `Densité optimale (${tokens} tokens). Ratio concision/précision équilibré`
      },
      {
        name: 'Garde-fous & Anti-Hallucination',
        score: scorePillar5,
        max: 20,
        status: scorePillar5 >= 18 ? 'Conforme' : 'À renforcer',
        detail: hasConstraints ? 'Règles négatives et limites explicites détectées' : 'Ajoutez un bloc de contraintes négatives pour verrouiller l’IA'
      }
    ];

    // Stress tests checklist
    const stressChecks = [
      {
        title: 'Résistance aux Dérives Stylistiques',
        passed: hasGuidelines && hasConstraints,
        hint: 'Le cadrage par directives et contraintes empêche l’IA d’adopter un ton informel.'
      },
      {
        title: 'Contrôle Déterministe des Sections',
        passed: hasSchema,
        hint: 'Le modèle ne peut pas omettre de parties critiques du livrable attendu.'
      },
      {
        title: 'Intégrité des Variables Métier',
        passed: !hasDynamicVars || filledVariablesCount === activePrompt.variables_list.length,
        hint: hasDynamicVars ? `${filledVariablesCount}/${activePrompt.variables_list.length} variables remplies.` : 'Module sans variable requise.'
      }
    ];

    return {
      totalRigorScore,
      pillars,
      stressChecks
    };
  }, [effectiveCustomizedPrompt, activePrompt, filledVariablesCount]);

  // Phase 7: Export Benchmark & Evaluation Report (.md)
  const handleExportBenchmarkReport = () => {
    if (!activePrompt) return;
    const isoDate = new Date().toISOString().slice(0, 10);
    const reportDate = new Date().toLocaleDateString('fr-FR');

    const costLines = benchmarkCostEstimate.models.map(m => {
      return `| **${m.name}** | \$${m.rateIn.toFixed(2)} / 1M | \$${m.rateOut.toFixed(2)} / 1M | **\$${m.costPer1kRuns.toFixed(3)}** |`;
    }).join('\n');

    const pillarLines = benchmarkAuditReport.pillars.map(p => {
      return `| **${p.name}** | **${p.score}/${p.max}** | ${p.status} | ${p.detail} |`;
    }).join('\n');

    const stressLines = benchmarkAuditReport.stressChecks.map(s => {
      return `- **${s.passed ? '[CONFORME]' : '[ATTENTION]'} ${s.title}** : ${s.hint}`;
    }).join('\n');

    const content = [
      `# Rapport d'Évaluation & Benchmark IA — ${activePrompt.title_fr}`,
      `**Référence Identifiant :** \`${activePrompt.id}\` | **Date d'Émission :** ${reportDate}`,
      ``,
      `---`,
      ``,
      `## 1. Score Global de Rigueur & Audit Déterministe : ${benchmarkAuditReport.totalRigorScore}/100`,
      ``,
      `| Pilier d'Ingénierie | Score | Conformité | Diagnostic Fonctionnel |`,
      `| :--- | :--- | :--- | :--- |`,
      pillarLines,
      ``,
      `## 2. Estimation de Consommation & Coûts de Production (Base : 1 000 Exécutions)`,
      `- **Tokens d'Entrée (Prompt Actuel)** : ~${benchmarkCostEstimate.inputTokens} tokens`,
      `- **Tokens de Sortie Estimés** : ~${benchmarkCostEstimate.projectedOutputTokens} tokens`,
      `- **Volume Total par Exécution** : ~${benchmarkCostEstimate.totalTokensPerRun} tokens`,
      ``,
      `| Modèle d'IA Cible | Tarif Entrée | Tarif Sortie | Coût Projeté (1 000 Runs) |`,
      `| :--- | :--- | :--- | :--- |`,
      costLines,
      ``,
      `## 3. Stress-Tests de Robustesse & Garde-fous`,
      stressLines,
      ``,
      benchmarkVariantB ? `## 4. Variante B Expérimentale Comparée\n\`\`\`xml\n${benchmarkVariantB}\n\`\`\`\n` : '',
      `---`,
      `*Rapport généré par Prompt Studio — Atelier d'Ingénierie IA Déterministe.*`
    ].filter(Boolean).join('\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-benchmark-${activePrompt.id || 'prompt'}-${isoDate}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Prompt Builder Modal controls
  const openPromptBuilder = () => {
    setBuilderStep(1);
    setBuilderForm({
      title_fr: '',
      category: 'Marketing',
      description_fr: '',
      role: 'Principal Staff AI Strategist',
      seniority: 'Principal Staff Specialist',
      domain: 'Stratégie & Métier',
      objective: 'Générer une solution déterministe avec une précision d’excellence',
      variables: [
        { name: 'Sujet Principal', placeholder: '{{sujet-principal}}', desc_fr: 'Thème ou livrable central' },
        { name: 'Public Cible', placeholder: '{{public-cible}}', desc_fr: 'Audience ou profil visé' }
      ],
      guidelines: [
        'Analyser en profondeur les paramètres d’entrée avant toute exécution',
        'Proposer des solutions concrètes immédiatement déployables sans remplissage générique',
        'Structurer la réponse selon le schéma déterministe avec une précision de niveau expert'
      ],
      negativeConstraints: 'Pas de platitudes ni de jargon creux. Ne pas omettre les cas limites ni les garde-fous de scaling.',
      outputSections: [
        '1. Architecture Stratégique & Principes Fondateurs',
        '2. Plan d’Exécution & Livrables Concrets Prêts au Déploiement',
        '3. Garde-Fous de Scaling & Métriques de Validation'
      ]
    });
    setIsBuilderOpen(true);
  };

  const handleApplyBuilderToWorkbench = () => {
    const newId = `custom-builder-${Date.now()}`;
    const builtPrompt = {
      id: newId,
      title_fr: builderForm.title_fr.trim() || 'Prompt Conçu via Assistant Guidé',
      title_en: builderForm.role || 'Custom Built Prompt',
      category: builderForm.category || 'Sur-Mesure',
      description_fr: builderForm.description_fr.trim() || builderForm.objective || 'Prompt conçu avec l’assistant pas-à-pas.',
      models: ['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 1.5 Pro'],
      variables_list: builderForm.variables || [],
      variables_fr: (builderForm.variables || []).map(v => v.name).join(', '),
      original_prompt: assembledBuilderPrompt,
      optimized_prompt: assembledBuilderPrompt,
      guide_fr: `Directive : Prompt conçu selon le standard XML Prompt Studio avec ${builderForm.guidelines.length} directives et schéma structuré.`,
      isCustom: true
    };
    setCustomPrompts(prev => [builtPrompt, ...prev]);
    setActivePlaybookId(null);
    setActivePromptId(builtPrompt.id);
    setIsBuilderOpen(false);
    setActiveView('customized');
    setMobilePane('workbench');
  };

  // Export Workspace Backup (.json)
  const handleExportWorkspaceJSON = () => {
    const payload = {
      version: '1.2',
      exportedAt: new Date().toISOString(),
      favorites,
      customPrompts,
      allSavedVars,
      contextProfiles,
      activeProfileId,
      playbookProgress,
      recentHistory
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
        if (Array.isArray(data.recentHistory)) setRecentHistory(data.recentHistory);
      } catch {
        alert('Fichier de sauvegarde JSON invalide.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Open Command Palette Modal (Cmd+K)
  const openCommandPalette = useCallback(() => {
    setCommandQuery('');
    setCommandSelectedIndex(0);
    setIsCommandPaletteOpen(true);
    setTimeout(() => commandInputRef.current?.focus(), 20);
  }, []);

  // Build filtered items for Command Palette (Quick Actions + Playbooks + Prompts)
  const commandItems = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    const quickActions = [
      {
        id: 'act-new-prompt',
        type: 'action',
        groupLabel: 'Actions Rapides',
        title: 'Créer un Nouveau Prompt Sur-Mesure',
        subtitle: 'Ouvrir l’éditeur de prompt personnalisé avec détection {{variable}}',
        badge: 'Action'
      },
      {
        id: 'act-prompt-builder',
        type: 'action',
        groupLabel: 'Actions Rapides',
        title: 'Lancer l’Assistant Guidé (Prompt Builder)',
        subtitle: 'Concevoir un prompt XML de niveau élite en 4 étapes interactives',
        badge: 'Wizard'
      },
      {
        id: 'act-export-spec',
        type: 'action',
        groupLabel: 'Actions Rapides',
        title: 'Générer la Spécification Technique & Équipe (.md)',
        subtitle: 'Exporter la fiche de gouvernance, tableau des variables et prompt actif',
        badge: 'Export Pro'
      },
      {
        id: 'act-new-profile',
        type: 'action',
        groupLabel: 'Actions Rapides',
        title: 'Créer un Profil de Contexte Global',
        subtitle: 'Pré-remplir vos variables métiers et injecter votre contexte en 1 clic',
        badge: 'Profil'
      },
      {
        id: 'act-split-view',
        type: 'action',
        groupLabel: 'Actions Rapides',
        title: activeView === 'split' ? 'Revenir à la Vue Prompt Optimisé' : 'Activer la Comparaison Côte-à-Côte (Split-View)',
        subtitle: 'Comparer en direct le Prompt Optimisé XML et le Prompt Source Brut',
        badge: 'Atelier'
      },
      {
        id: 'act-sandbox-view',
        type: 'action',
        groupLabel: 'Actions Rapides',
        title: activeView === 'sandbox' ? 'Revenir au Prompt Optimisé' : 'Ouvrir le Simulateur de Sorties Multi-Modèles',
        subtitle: 'Tester le comportement attendu selon Claude, ChatGPT ou Gemini',
        badge: 'Simulation'
      },
      {
        id: 'act-benchmark-view',
        type: 'action',
        groupLabel: 'Actions Rapides',
        title: activeView === 'benchmark' ? 'Revenir au Prompt Optimisé' : 'Ouvrir le Studio d’Évaluation & Benchmarking',
        subtitle: 'Projections de coûts multi-modèles, audit de rigueur et comparateur A/B',
        badge: 'Benchmark'
      },
      {
        id: 'act-focus-mode',
        type: 'action',
        groupLabel: 'Actions Rapides',
        title: focusMode ? 'Quitter le Mode Focus' : 'Activer le Mode Focus Plein Écran',
        subtitle: 'Masquer les panneaux latéraux pour travailler sans distraction',
        badge: 'Affichage'
      },
      {
        id: 'act-toggle-theme',
        type: 'action',
        groupLabel: 'Actions Rapides',
        title: `Basculer en Thème ${theme === 'dark' ? 'Clair' : 'Sombre'}`,
        subtitle: 'Changer immédiatement l’apparence de Prompt Studio',
        badge: 'Thème'
      },
      {
        id: 'act-export-json',
        type: 'action',
        groupLabel: 'Actions Rapides',
        title: 'Exporter une Sauvegarde de l’Espace (.json)',
        subtitle: 'Télécharger vos favoris, profils, progressions et prompts sur-mesure',
        badge: 'Backup'
      }
    ].filter(a => !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q));

    const matchingPlaybooks = playbooksData
      .filter(pb => !q || pb.title_fr.toLowerCase().includes(q) || pb.subtitle_fr?.toLowerCase().includes(q) || pb.badge?.toLowerCase().includes(q))
      .map(pb => ({
        id: `pb-${pb.id}`,
        type: 'playbook',
        groupLabel: 'Playbooks Multi-Étapes (9)',
        title: pb.title_fr,
        subtitle: pb.subtitle_fr,
        badge: `Playbook • ${pb.badge}`,
        payload: pb
      }));

    const matchingPrompts = allPrompts
      .filter(p => !q ||
        p.title_fr?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description_fr?.toLowerCase().includes(q) ||
        p.variables_fr?.toLowerCase().includes(q)
      )
      .slice(0, q ? 30 : 14)
      .map(p => ({
        id: `pr-${p.id}`,
        type: 'prompt',
        groupLabel: `Prompts d'Ingénierie (${allPrompts.length})`,
        title: p.title_fr,
        subtitle: p.description_fr,
        badge: p.category,
        payload: p
      }));

    return [...quickActions, ...matchingPlaybooks, ...matchingPrompts];
  }, [commandQuery, allPrompts, activeView, focusMode, theme]);

  const executeCommandItem = useCallback((item) => {
    if (!item) return;
    setIsCommandPaletteOpen(false);
    if (item.type === 'action') {
      if (item.id === 'act-new-prompt') {
        openNewPromptModal();
      } else if (item.id === 'act-prompt-builder') {
        openPromptBuilder();
      } else if (item.id === 'act-export-spec') {
        handleExportTeamSpec();
      } else if (item.id === 'act-new-profile') {
        openNewProfileModal();
      } else if (item.id === 'act-split-view') {
        setIsLiveEditing(false);
        setActiveView(prev => prev === 'split' ? 'customized' : 'split');
      } else if (item.id === 'act-sandbox-view') {
        setIsLiveEditing(false);
        setActiveView(prev => prev === 'sandbox' ? 'customized' : 'sandbox');
      } else if (item.id === 'act-benchmark-view') {
        setIsLiveEditing(false);
        setActiveView(prev => prev === 'benchmark' ? 'customized' : 'benchmark');
      } else if (item.id === 'act-focus-mode') {
        setFocusMode(prev => !prev);
      } else if (item.id === 'act-toggle-theme') {
        toggleTheme();
      } else if (item.id === 'act-export-json') {
        handleExportWorkspaceJSON();
      }
      return;
    }
    if (item.type === 'playbook' && item.payload) {
      handleSelectPlaybook(item.payload);
      return;
    }
    if (item.type === 'prompt' && item.payload) {
      setActivePlaybookId(null);
      setActivePromptId(item.payload.id);
      setMobilePane('workbench');
    }
  }, []);

  // Keyboard shortcuts: Cmd/Ctrl+K (Command Palette), Up/Down (navigate), Cmd/Ctrl+Enter (copy), Esc
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
        } else {
          openCommandPalette();
        }
        return;
      }

      if (isCommandPaletteOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setCommandSelectedIndex(prev => (commandItems.length > 0 ? (prev + 1) % commandItems.length : 0));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setCommandSelectedIndex(prev => (commandItems.length > 0 ? (prev - 1 + commandItems.length) % commandItems.length : 0));
          return;
        }
        if (e.key === 'Enter' && commandItems.length > 0) {
          e.preventDefault();
          const chosen = commandItems[Math.min(commandSelectedIndex, commandItems.length - 1)];
          executeCommandItem(chosen);
          return;
        }
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
  }, [
    filteredPrompts, activePrompt, activePlaybook, focusMode,
    isModalOpen, isProfileModalOpen, isLiveEditing, search, handleCopy,
    isCommandPaletteOpen, openCommandPalette, commandItems, commandSelectedIndex, executeCommandItem
  ]);

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

      {/* GLOBAL TOP NAVIGATION (Desktop & Mobile) */}
      <header className="ps-global-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div
            onClick={() => setMainNavView('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}
          >
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
              <div style={{ fontSize: '0.92rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-bright)' }}>
                Prompt Studio
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                Atelier d'Ingénierie IA
              </div>
            </div>
          </div>
        </div>

        {/* Center Main Nav Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-card)', padding: '3px 4px', borderRadius: '8px', border: '1px solid var(--border-hairline)' }}>
          {[
            { id: 'home', label: 'Accueil', icon: Sparkles },
            { id: 'library', label: `Bibliothèque (${allPrompts.length})`, icon: Boxes },
            { id: 'playbooks', label: `Playbooks (${playbooksData.length})`, icon: Compass },
            { id: 'workbench', label: 'Atelier', icon: SlidersHorizontal }
          ].map(tab => {
            const Icon = tab.icon;
            const isCurrent = mainNavView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMainNavView(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 11px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isCurrent ? 'var(--bg-highlight)' : 'transparent',
                  color: isCurrent ? 'var(--accent-gold)' : 'var(--text-muted)',
                  fontSize: '0.76rem',
                  fontWeight: isCurrent ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                <Icon size={13} color={isCurrent ? 'var(--accent-gold)' : 'currentColor'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Nav Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            onClick={openCommandPalette}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 9px',
              borderRadius: '7px',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-muted)',
              fontSize: '0.73rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
            title="Ouvrir la Palette de Commande (⌘K)"
          >
            <Search size={12} color="var(--accent-gold)" />
            <span>Rechercher...</span>
            <kbd style={{
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono)',
              padding: '1px 4px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-faint)'
            }}>⌘K</kbd>
          </button>

          <button
            onClick={toggleTheme}
            style={{
              padding: '5px 8px',
              borderRadius: '7px',
              border: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Basculer le thème"
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {mainNavView !== 'library' && (
            <button
              onClick={() => setMainNavView('library')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: 'var(--accent-gold)',
                color: '#000000',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>Catalogue</span>
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </header>

      {/* VIEW 1: LANDING PAGE HERO & BENTO GRID */}
      {mainNavView === 'home' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem 4rem' }}>
          <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

            {/* HERO SECTION */}
            <section className="ps-landing-hero" style={{ textAlign: 'center', padding: '2.5rem 1rem 3.5rem' }}>
              {/* Announcement Pill Tag */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 13px', borderRadius: '99px', backgroundColor: 'var(--bg-highlight)', border: '1px solid var(--border-focus)', marginBottom: '1.4rem' }}>
                <Sparkles size={13} color="var(--accent-gold)" />
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                  Atelier d'Ingénierie IA • 100% Déterministe & Marque Blanche
                </span>
              </div>

              {/* Main Headline */}
              <h1 style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.6rem)', fontWeight: 800, letterSpacing: '-0.035em', color: 'var(--text-bright)', lineHeight: 1.15, maxWidth: '920px', margin: '0 auto 1.25rem' }}>
                L'arsenal ultime de prompts d'ingénierie pour décupler vos résultats IA.
              </h1>

              {/* Subheadline */}
              <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto 2.2rem' }}>
                144 architectures XML d'élite et 9 playbooks d'exécution conçus pour Claude 3.5 Sonnet, GPT-4o et Gemini 1.5 Pro. Structurez, personnalisez et déployez en 1 clic.
              </p>

              {/* CTA Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.9rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
                <button
                  onClick={() => setMainNavView('library')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--accent-gold)',
                    color: '#000000',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.28)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Boxes size={16} />
                  <span>Explorer la Bibliothèque (144 Prompts)</span>
                  <ChevronRight size={15} />
                </button>

                <button
                  onClick={openPromptBuilder}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-bright)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Wand2 size={16} color="var(--accent-gold)" />
                  <span>Lancer le Prompt Builder</span>
                </button>
              </div>

              {/* FLOATING INTERACTIVE CODE PREVIEW MOCKUP */}
              <div style={{
                maxWidth: '880px',
                margin: '0 auto',
                borderRadius: '14px',
                border: '1px solid var(--border-focus)',
                backgroundColor: 'var(--bg-card)',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55), 0 0 50px rgba(245, 158, 11, 0.08)',
                overflow: 'hidden',
                textAlign: 'left'
              }}>
                <div style={{
                  padding: '9px 14px',
                  backgroundColor: 'var(--bg-input)',
                  borderBottom: '1px solid var(--border-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.8)' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.8)' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.8)' }} />
                    <span style={{ marginLeft: '8px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      architecture_prompt_studio_elite.xml
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', backgroundColor: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)' }}>
                      Qualité 100/100
                    </span>
                    <span style={{ fontSize: '0.67rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                      Claude 3.5 & GPT-4o Ready
                    </span>
                  </div>
                </div>

                <pre style={{
                  padding: '1.25rem',
                  fontSize: '0.78rem',
                  lineHeight: 1.6,
                  color: 'var(--text-normal)',
                  fontFamily: 'var(--font-mono)',
                  maxHeight: '260px',
                  overflowY: 'hidden',
                  margin: 0
                }}>
                  <code>
                    <span style={{ color: 'var(--accent-gold)' }}>&lt;system_role&gt;</span>{'\n'}
                    {'  '}You are a Principal Growth Architect & AI Strategist. Your mission is to formulate deterministic high-leverage plans.{'\n'}
                    <span style={{ color: 'var(--accent-gold)' }}>&lt;/system_role&gt;</span>{'\n\n'}
                    <span style={{ color: 'var(--accent-gold)' }}>&lt;input_parameters&gt;</span>{'\n'}
                    {'  '}&lt;theme&gt;<span style={{ color: 'var(--accent-emerald)' }}>{"{{sujet-strategique}}"}</span>&lt;/theme&gt;{'\n'}
                    {'  '}&lt;target_audience&gt;<span style={{ color: 'var(--accent-emerald)' }}>{"{{public-cible}}"}</span>&lt;/target_audience&gt;{'\n'}
                    <span style={{ color: 'var(--accent-gold)' }}>&lt;/input_parameters&gt;</span>{'\n\n'}
                    <span style={{ color: 'var(--accent-gold)' }}>&lt;execution_guidelines&gt;</span>{'\n'}
                    {'  '}- Enforce deterministic sections without conversational filler{'\n'}
                    {'  '}- Structure output with acceptance criteria and execution metrics{'\n'}
                    <span style={{ color: 'var(--accent-gold)' }}>&lt;/execution_guidelines&gt;</span>
                  </code>
                </pre>
              </div>
            </section>

            {/* KEY METRICS STRIP */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '1rem',
              padding: '1.2rem',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              marginBottom: '3.5rem'
            }}>
              {[
                { count: '144', label: 'Prompts XML d’Élite', desc: 'Testés et optimisés' },
                { count: '12', label: 'Piliers Métiers Clés', desc: 'Couverture 360°' },
                { count: '9', label: 'Playbooks Guidés', desc: '45 étapes séquentielles' },
                { count: '100%', label: 'Marque Blanche', desc: 'Zéro dépendance tierce' }
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '0.4rem 0.5rem' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', marginBottom: '0.2rem' }}>
                    {stat.count}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {stat.desc}
                  </div>
                </div>
              ))}
            </section>

            {/* BENTO GRID OF 12 CATEGORIES */}
            <section style={{ marginBottom: '3.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.35rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Explorez par Domaine d'Expertise
                  </div>
                  <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-bright)', letterSpacing: '-0.02em', margin: 0 }}>
                    12 Piliers Métiers pour l'Entreprise Moderne
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory('Tous');
                    setMainNavView('library');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-gold)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>Voir tous les 144 modules</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="ps-bento-grid">
                {categories.filter(c => !['Tous', 'Favoris', 'Recents', 'Personnalisés'].includes(c.id)).map(cat => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setMainNavView('library');
                      }}
                      style={{
                        padding: '1.15rem',
                        borderRadius: '12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-hairline)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--border-focus)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-hairline)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--accent-gold-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                          <Icon size={16} />
                        </div>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                          {cat.count} prompts
                        </span>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                          {cat.label}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          Architecture XML, rôles experts et schémas d'exécution dédiés.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* XML DETERMINISTIC METHOD EXPLAINER */}
            <section style={{
              padding: '2rem',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-hairline)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--accent-gold-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', marginBottom: '0.75rem' }}>
                  <Cpu size={15} />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>
                  Structure XML Déterministe
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  Nos prompts encadrent le rôle, les entrées et les directives dans des balises précises reconnues nativement par Claude et GPT-4o pour éliminer les digressions.
                </p>
              </div>

              <div>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--accent-gold-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', marginBottom: '0.75rem' }}>
                  <ShieldAlert size={15} />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>
                  Contraintes Anti-Hallucination
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  Chaque module inclut des règles d'exclusion explicites (anti-patterns) interdisant à l'IA d'inventer des données ou d'utiliser du jargon creux.
                </p>
              </div>

              <div>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--accent-gold-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', marginBottom: '0.75rem' }}>
                  <SlidersHorizontal size={15} />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.4rem' }}>
                  Variables & Profils Métiers
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  Injectez en 1 clic l'ADN de votre entreprise (ICP, voix de marque, contraintes) via les Profils de Contexte Global réutilisables.
                </p>
              </div>
            </section>

          </div>
        </div>
      )}

      {/* VIEW 2: AIRY LIBRARY GRID (God of Prompt Inspired Layout) */}
      {mainNavView === 'library' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem 4rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

            {/* Header & Filter Controls Bar */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-bright)', letterSpacing: '-0.025em', margin: '0 0 0.25rem' }}>
                    Bibliothèque de Prompts d'Ingénierie
                  </h1>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {filteredPrompts.length} module{filteredPrompts.length > 1 ? 's' : ''} disponible{filteredPrompts.length > 1 ? 's' : ''} • Format XML déterministe
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={openPromptBuilder}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-bright)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Wand2 size={13} color="var(--accent-gold)" />
                    <span>Créer un Prompt Guidé</span>
                  </button>

                  <button
                    onClick={openNewPromptModal}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 13px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'var(--accent-gold)',
                      color: '#000000',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} />
                    <span>Nouveau Prompt</span>
                  </button>
                </div>
              </div>

              {/* Horizontal Filter Pills (Scrollable) */}
              <div style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '1rem'
              }}>
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid var(--border-focus)' : '1px solid var(--border-hairline)',
                        backgroundColor: isSelected ? 'var(--accent-gold-subtle)' : 'var(--bg-card)',
                        color: isSelected ? 'var(--accent-gold)' : 'var(--text-normal)',
                        fontSize: '0.76rem',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <Icon size={13} color={isSelected ? 'var(--accent-gold)' : 'currentColor'} />
                      <span>{cat.label}</span>
                      <span style={{
                        fontSize: '0.64rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-input)',
                        color: isSelected ? 'var(--accent-gold)' : 'var(--text-faint)'
                      }}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar & AI Model Selector */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Rechercher par titre, cas d'usage, variable {{...}}..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 34px 8px 36px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-bright)',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-card)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-hairline)' }}>
                  <Bot size={14} color="var(--accent-gold)" />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>Modèle :</span>
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-bright)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {modelsList.map(m => (
                      <option key={m} value={m} style={{ backgroundColor: 'var(--bg-card)' }}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SPACIOUS PROMPT CARDS GRID */}
            {filteredPrompts.length === 0 ? (
              <div style={{ padding: '4rem 1rem', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                  Aucun module ne correspond à vos filtres
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Essayez d'élargir votre recherche ou de sélectionner une autre catégorie.
                </div>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('Tous');
                    setSelectedModel('Tous');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-focus)',
                    backgroundColor: 'var(--accent-gold-subtle)',
                    color: 'var(--accent-gold)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="ps-library-grid">
                {filteredPrompts.map(p => {
                  const isFav = favorites.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-hairline)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--border-focus)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-hairline)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div>
                        {/* Card Header: Category & Favorite */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--accent-gold-subtle)',
                            color: 'var(--accent-gold)'
                          }}>
                            {p.category}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(p.id);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              color: isFav ? 'var(--accent-gold)' : 'var(--text-faint)'
                            }}
                            title={isFav ? 'Retirer des favoris' : 'Épingler aux favoris'}
                          >
                            <Star size={14} fill={isFav ? 'var(--accent-gold)' : 'none'} />
                          </button>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.45rem', lineHeight: 1.35 }}>
                          {p.title_fr}
                        </h3>

                        {/* Description */}
                        <p style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                          marginBottom: '0.85rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {p.description_fr}
                        </p>

                        {/* Model compatibility tags */}
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(p.models || []).slice(0, 3).map(m => (
                            <span
                              key={m}
                              style={{
                                fontSize: '0.63rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-input)',
                                border: '1px solid var(--border-hairline)',
                                color: 'var(--text-faint)',
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-hairline)',
                        paddingTop: '0.75rem',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(p.optimized_prompt);
                            setCopied(true);
                            setRecentHistory(prev => [{ id: p.id, copiedAt: new Date().toISOString() }, ...prev.filter(x => x.id !== p.id)].slice(0, 15));
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-hairline)',
                            backgroundColor: 'var(--bg-input)',
                            color: 'var(--text-normal)',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Copy size={12} />
                          <span>Copier</span>
                        </button>

                        <button
                          onClick={() => {
                            setActivePromptId(p.id);
                            setMainNavView('workbench');
                          }}
                          style={{
                            flex: 1.2,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'var(--accent-gold-subtle)',
                            color: 'var(--accent-gold)',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <span>Atelier</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}

      {/* VIEW 3: PLAYBOOKS CATALOG VIEW */}
      {mainNavView === 'playbooks' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem 4rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '99px', backgroundColor: 'var(--accent-gold-subtle)', color: 'var(--accent-gold)', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                <Compass size={13} />
                <span>9 Parcours Multi-Étapes Guidés</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-bright)', letterSpacing: '-0.025em', margin: 0 }}>
                Playbooks d'Exécution IA
              </h1>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Exécutez des projets complexes de bout en bout grâce à des enchaînements de 5 étapes séquentielles pré-configurées.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
              {playbooksData.map(pb => {
                const doneCount = pb.steps.filter(s => playbookProgress[`${pb.id}:${s.stepNumber}`]).length;
                return (
                  <div
                    key={pb.id}
                    style={{
                      padding: '1.4rem',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--border-focus)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-hairline)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 7px', borderRadius: '4px', backgroundColor: 'var(--accent-gold-subtle)', color: 'var(--accent-gold)' }}>
                          Playbook • {pb.badge}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: doneCount === pb.steps.length ? 'var(--accent-emerald)' : 'var(--text-faint)' }}>
                          {doneCount}/{pb.steps.length} terminé{doneCount > 1 ? 's' : ''}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.45rem' }}>
                        {pb.title_fr}
                      </h3>

                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                        {pb.description_fr}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {pb.steps.map(s => (
                          <div key={s.stepNumber} style={{ fontSize: '0.72rem', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={11} color={playbookProgress[`${pb.id}:${s.stepNumber}`] ? 'var(--accent-emerald)' : 'var(--border-card)'} />
                            <span>{s.stepNumber}. {s.stepTitle}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleSelectPlaybook(pb);
                        setMainNavView('workbench');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--accent-gold)',
                        color: '#000000',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      <Play size={12} fill="#000" />
                      <span>Lancer le Playbook</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: MAIN WORKBENCH (FULL ATELIER DE TRAVAIL) */}
      {mainNavView === 'workbench' && (
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

              {/* Action CTAs: Command Palette Cmd+K, New Custom Prompt & Context Profile */}
              <div style={{ padding: '0.6rem 0.65rem 0.2rem', display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={openCommandPalette}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.35rem',
                      padding: '6px 8px',
                      borderRadius: '7px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-normal)',
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Ouvrir la Palette de Commande Rapide (⌘K)"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Search size={12} color="var(--accent-gold)" />
                      <span>Palette</span>
                    </span>
                    <kbd style={{
                      fontSize: '0.63rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-muted)'
                    }}>
                      ⌘K
                    </kbd>
                  </button>

                  <button
                    onClick={openPromptBuilder}
                    style={{
                      flex: 1.1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '6px 7px',
                      borderRadius: '7px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-bright)',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Concevoir un prompt XML d’élite via l'Assistant Guidé pas-à-pas"
                  >
                    <Wand2 size={13} color="var(--accent-gold)" />
                    <span>Assistant</span>
                  </button>

                  <button
                    onClick={openNewPromptModal}
                    style={{
                      flex: 1.1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '6px 7px',
                      borderRadius: '7px',
                      border: '1px solid var(--border-focus)',
                      backgroundColor: 'var(--accent-gold-subtle)',
                      color: 'var(--accent-gold)',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                    <span>Nouveau</span>
                  </button>
                </div>

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
                    onClick={handleExportTeamSpec}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--accent-gold)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Télécharger la fiche de spécification technique & gouvernance d’équipe (.md)"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Fiche Spécification</span>
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
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveView('customized')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '6px 11px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: activeView === 'customized' ? 'var(--border-card)' : 'transparent',
                      color: activeView === 'customized' ? 'var(--text-bright)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={13} color={activeView === 'customized' ? 'var(--accent-gold)' : 'currentColor'} />
                    <span>Prompt Optimisé</span>
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
                      padding: '6px 11px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: activeView === 'original' ? 'var(--border-card)' : 'transparent',
                      color: activeView === 'original' ? 'var(--text-bright)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <FileText size={13} />
                    <span>Source Brut</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsLiveEditing(false);
                      setActiveView('split');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '6px 11px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: activeView === 'split' ? 'var(--border-card)' : 'transparent',
                      color: activeView === 'split' ? 'var(--text-bright)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    title="Comparer côte à côte le Prompt Optimisé XML et le Prompt Source Brut"
                  >
                    <Columns2 size={13} color={activeView === 'split' ? 'var(--accent-gold)' : 'currentColor'} />
                    <span>Comparaison Split</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsLiveEditing(false);
                      setActiveView('sandbox');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '6px 11px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: activeView === 'sandbox' ? 'var(--border-card)' : 'transparent',
                      color: activeView === 'sandbox' ? 'var(--text-bright)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    title="Simuler la réponse IA attendue selon le modèle (Claude, ChatGPT, Gemini)"
                  >
                    <FlaskConical size={13} color={activeView === 'sandbox' ? 'var(--accent-gold)' : 'currentColor'} />
                    <span>Simulation de Réponse</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsLiveEditing(false);
                      setActiveView('benchmark');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '6px 11px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: activeView === 'benchmark' ? 'var(--border-card)' : 'transparent',
                      color: activeView === 'benchmark' ? 'var(--text-bright)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    title="Studio d’Évaluation & Benchmarking A/B (Projections de coûts, audit de rigueur et tests de robustesse)"
                  >
                    <Scale size={13} color={activeView === 'benchmark' ? 'var(--accent-gold)' : 'currentColor'} />
                    <span>Benchmarking & Évaluation</span>
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
              {activeView !== 'original' && activeProfile && (
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

              {/* DYNAMIC VARIABLES INPUTS (In customized or split view) */}
              {activeView !== 'original' && activePrompt.variables_list && activePrompt.variables_list.length > 0 && (
                <div style={{
                  marginBottom: '1.15rem',
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

              {/* PROMPT ENGINEERING QUALITY SCORE & CHECKLIST BAR */}
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Gauge size={15} color={promptQualityReport.score >= 85 ? 'var(--accent-emerald)' : 'var(--accent-gold)'} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                        Score d'Ingénierie du Prompt
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 7px',
                        borderRadius: '99px',
                        backgroundColor: promptQualityReport.score >= 85 ? 'var(--accent-emerald-subtle)' : 'var(--accent-gold-subtle)',
                        color: promptQualityReport.score >= 85 ? 'var(--accent-emerald)' : 'var(--accent-gold)'
                      }}>
                        {promptQualityReport.score}/100
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {promptQualityReport.checks.map(chk => (
                    <span
                      key={chk.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: chk.ok ? 'var(--accent-emerald-subtle)' : 'var(--bg-input)',
                        color: chk.ok ? 'var(--accent-emerald)' : 'var(--text-muted)',
                        border: chk.ok ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-hairline)'
                      }}
                    >
                      <CheckCircle2 size={11} />
                      <span>{chk.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* CODE PREVIEW, LIVE EDITOR, SPLIT COMPARISON, OUTPUT SANDBOX OR BENCHMARKING BOX */}
              {activeView === 'benchmark' ? (
                <div style={{
                  borderRadius: '12px',
                  border: '1px solid var(--border-focus)',
                  backgroundColor: 'var(--bg-input)',
                  overflow: 'hidden',
                  marginBottom: '1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px'
                }}>
                  {/* Benchmarking Header */}
                  <div style={{
                    padding: '9px 14px',
                    borderBottom: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.6rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Scale size={15} color="var(--accent-gold)" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-bright)' }}>
                        Studio d’Évaluation, Coûts & Benchmarking A/B
                      </span>
                      <span style={{
                        fontSize: '0.67rem',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '99px',
                        backgroundColor: 'var(--accent-gold-subtle)',
                        color: 'var(--accent-gold)'
                      }}>
                        Score Déterministe : {benchmarkAuditReport.totalRigorScore}/100
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={handleExportBenchmarkReport}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-hairline)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-bright)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Télécharger la synthèse de benchmark en Markdown (.md)"
                      >
                        <Download size={12} />
                        <span>Rapport (.md)</span>
                      </button>

                      <button
                        onClick={() => {
                          const iso = new Date().toISOString().slice(0, 10);
                          const md = `# Audit Benchmark — ${activePrompt.title_fr}\nScore: ${benchmarkAuditReport.totalRigorScore}/100\nTokens Input: ~${benchmarkCostEstimate.inputTokens}\nTokens Output: ~${benchmarkCostEstimate.projectedOutputTokens}\n`;
                          navigator.clipboard.writeText(md);
                          setCopiedBenchmarkReport(true);
                          setTimeout(() => setCopiedBenchmarkReport(false), 2000);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: copiedBenchmarkReport ? 'var(--accent-emerald)' : 'var(--accent-gold)',
                          color: '#000000',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {copiedBenchmarkReport ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedBenchmarkReport ? 'Copié' : 'Copier Résumé'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Panel 1: Multi-Model Pricing & Token Projection */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-workbench)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      1. Projections de Consommation & Coûts de Production (Base 1 000 Exécutions)
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      {benchmarkCostEstimate.models.map(m => (
                        <div
                          key={m.id}
                          style={{
                            padding: '0.85rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-hairline)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem'
                          }}
                        >
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Entrée: ${m.rateIn.toFixed(2)}/1M • Sortie: ${m.rateOut.toFixed(2)}/1M
                          </div>
                          <div style={{
                            marginTop: '0.2rem',
                            fontSize: '0.92rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent-gold)'
                          }}>
                            ~${m.costPer1kRuns.toFixed(3)} <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 1k runs</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>Tokens prompt : <strong style={{ color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>~{benchmarkCostEstimate.inputTokens}</strong></span>
                      <span>Complétion moyenne : <strong style={{ color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>~{benchmarkCostEstimate.projectedOutputTokens}</strong></span>
                      <span>Total run : <strong style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>~{benchmarkCostEstimate.totalTokensPerRun} tokens</strong></span>
                    </div>
                  </div>

                  {/* Panel 2: 5 Pillars Rigor Breakdown */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-hairline)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      2. Audit de Rigueur Déterministe (5 Piliers d’Ingénierie)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {benchmarkAuditReport.pillars.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '7px',
                            backgroundColor: 'var(--bg-input)',
                            border: '1px solid var(--border-hairline)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ minWidth: '220px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {p.detail}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{
                              fontSize: '0.67rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: p.score >= 18 ? 'var(--accent-emerald-subtle)' : 'var(--bg-card)',
                              color: p.score >= 18 ? 'var(--accent-emerald)' : 'var(--text-muted)',
                              border: '1px solid var(--border-hairline)'
                            }}>
                              {p.status}
                            </span>
                            <span style={{
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              color: p.score >= 18 ? 'var(--accent-emerald)' : 'var(--accent-gold)'
                            }}>
                              {p.score}/{p.max}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel 3: A/B Variant Comparator */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-workbench)', borderTop: '1px solid var(--border-hairline)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-bright)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        3. Comparateur A/B de Variantes de Prompt
                      </div>

                      {!benchmarkVariantBEdited && (
                        <button
                          onClick={() => {
                            const conciseVariant = (effectiveCustomizedPrompt || '')
                              .replace(/<negative_constraints>[\s\S]*?<\/negative_constraints>/i, '')
                              .trim() + '\n\n<!-- Variante B : Format ultra-concis avec focalisation KPI -->';
                            setBenchmarkVariantB(conciseVariant);
                            setBenchmarkVariantBEdited(true);
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid var(--border-hairline)',
                            backgroundColor: 'var(--accent-gold-subtle)',
                            color: 'var(--accent-gold)',
                            fontSize: '0.69rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Cloner en Variante B (Expérimentale)
                        </button>
                      )}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: benchmarkVariantBEdited ? '1fr 1fr' : '1fr',
                      gap: '0.75rem'
                    }}>
                      {/* Variant A */}
                      <div style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-focus)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                            Variante A (Prompt Actif en Production)
                          </span>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            ~{benchmarkCostEstimate.inputTokens} tokens
                          </span>
                        </div>
                        <pre style={{
                          padding: '0.6rem',
                          fontSize: '0.72rem',
                          lineHeight: 1.45,
                          color: 'var(--text-normal)',
                          backgroundColor: 'var(--bg-input)',
                          borderRadius: '6px',
                          maxHeight: '160px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          margin: 0
                        }}>
                          <code>{effectiveCustomizedPrompt}</code>
                        </pre>
                      </div>

                      {/* Variant B (Editable) */}
                      {benchmarkVariantBEdited && (
                        <div style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--accent-emerald)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                              Variante B (Expérimentale)
                            </span>
                            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                              ~{Math.max(1, Math.ceil(benchmarkVariantB.length / 3.8))} tokens
                            </span>
                          </div>
                          <textarea
                            value={benchmarkVariantB}
                            onChange={e => setBenchmarkVariantB(e.target.value)}
                            style={{
                              width: '100%',
                              height: '160px',
                              padding: '0.6rem',
                              fontSize: '0.72rem',
                              lineHeight: 1.45,
                              color: 'var(--text-bright)',
                              backgroundColor: 'var(--bg-input)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-hairline)',
                              fontFamily: 'var(--font-mono)',
                              outline: 'none',
                              resize: 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Panel 4: Stress-Tests & Guardrails */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-hairline)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      4. Stress-Tests de Robustesse & Garde-fous
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {benchmarkAuditReport.stressChecks.map((sc, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.6rem 0.8rem',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-input)',
                            border: '1px solid var(--border-hairline)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                              {sc.title}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {sc.hint}
                            </div>
                          </div>

                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.67rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: sc.passed ? 'var(--accent-emerald-subtle)' : 'var(--bg-card)',
                            color: sc.passed ? 'var(--accent-emerald)' : 'var(--accent-gold)'
                          }}>
                            <CheckCircle2 size={11} />
                            <span>{sc.passed ? 'Verrouillé' : 'Avertissement'}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeView === 'sandbox' ? (
                <div style={{
                  borderRadius: '12px',
                  border: '1px solid var(--border-focus)',
                  backgroundColor: 'var(--bg-input)',
                  overflow: 'hidden',
                  marginBottom: '1.35rem'
                }}>
                  {/* Sandbox Header with Model Switchers */}
                  <div style={{
                    padding: '8px 14px',
                    borderBottom: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.6rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FlaskConical size={14} color="var(--accent-gold)" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                        Simulateur de Sortie Multi-Modèles
                      </span>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '99px',
                        backgroundColor: 'var(--accent-gold-subtle)',
                        color: 'var(--accent-gold)'
                      }}>
                        Sandbox Déterministe
                      </span>
                    </div>

                    {/* Model Style Switcher */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {[
                        { id: 'claude', label: 'Claude 3.5 Sonnet' },
                        { id: 'chatgpt', label: 'ChatGPT (GPT-4o)' },
                        { id: 'gemini', label: 'Gemini 1.5 Pro' }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSandboxModelStyle(m.id)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: sandboxModelStyle === m.id ? '1px solid var(--border-focus)' : '1px solid var(--border-hairline)',
                            backgroundColor: sandboxModelStyle === m.id ? 'var(--accent-gold-subtle)' : 'var(--bg-input)',
                            color: sandboxModelStyle === m.id ? 'var(--accent-gold)' : 'var(--text-muted)',
                            fontSize: '0.69rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {m.label}
                        </button>
                      ))}

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(simulatedOutput);
                          setCopiedSandbox(true);
                          setTimeout(() => setCopiedSandbox(false), 2000);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '3px 9px',
                          borderRadius: '5px',
                          border: 'none',
                          backgroundColor: copiedSandbox ? 'var(--accent-emerald)' : 'var(--accent-gold)',
                          color: '#000000',
                          fontSize: '0.69rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          marginLeft: '0.4rem'
                        }}
                        title="Copier la sortie simulée"
                      >
                        {copiedSandbox ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedSandbox ? 'Copié' : 'Copier Réponse'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sandbox Simulated Output Display */}
                  <pre style={{
                    padding: '1.25rem',
                    fontSize: '0.82rem',
                    lineHeight: 1.65,
                    color: 'var(--text-normal)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: focusMode ? '580px' : '460px',
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <code>{simulatedOutput}</code>
                  </pre>
                </div>
              ) : activeView === 'split' ? (
                <div
                  className="ps-split-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '0.9rem',
                    marginBottom: '1.35rem'
                  }}
                >
                  {/* Left Column: Optimized XML Prompt */}
                  <div style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border-focus)',
                    backgroundColor: 'var(--bg-input)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      padding: '7px 12px',
                      borderBottom: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.71rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Sparkles size={12} color="var(--accent-gold)" />
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-bright)', fontWeight: 700 }}>
                          prompt_optimise.xml
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.67rem', color: 'var(--accent-gold)' }}>
                        ~{Math.max(1, Math.ceil(effectiveCustomizedPrompt.length / 3.8))} tokens
                      </span>
                    </div>
                    <pre style={{
                      padding: '1rem',
                      fontSize: '0.78rem',
                      lineHeight: 1.6,
                      color: 'var(--text-normal)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: focusMode ? '560px' : '440px',
                      overflowY: 'auto',
                      flex: 1
                    }}>
                      <code>
                        <HighlightedPrompt text={effectiveCustomizedPrompt} />
                      </code>
                    </pre>
                  </div>

                  {/* Right Column: Raw Reference Prompt */}
                  <div style={{
                    borderRadius: '12px',
                    border: '1px solid var(--border-hairline)',
                    backgroundColor: 'var(--bg-input)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      padding: '7px 12px',
                      borderBottom: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.71rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={12} color="var(--text-muted)" />
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 600 }}>
                          prompt_source_brut.md
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                        ~{rawEstimatedTokens} tokens
                      </span>
                    </div>
                    <pre style={{
                      padding: '1rem',
                      fontSize: '0.78rem',
                      lineHeight: 1.6,
                      color: 'var(--text-muted)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: focusMode ? '560px' : '440px',
                      overflowY: 'auto',
                      flex: 1
                    }}>
                      <code>
                        <HighlightedPrompt text={rawReferencePromptText} />
                      </code>
                    </pre>
                  </div>
                </div>
              ) : (
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
              )}

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
      )}

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
                    <option value="Ecommerce">E-Commerce & Retail</option>
                    <option value="Operations">Juridique, RH & Opérations</option>
                    <option value="Media">Vidéo, YouTube & Créateurs</option>
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

      {/* MODAL 3: COMMAND PALETTE (⌘K — RAYCAST / LINEAR STYLE) */}
      {isCommandPaletteOpen && (
        <div
          className="ps-command-palette"
          onClick={() => setIsCommandPaletteOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-modal-backdrop)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '8vh 1rem 1rem',
            zIndex: 120
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '640px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-focus)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '78vh'
            }}
          >
            {/* Search Input Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-input)'
            }}>
              <Search size={16} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
              <input
                ref={commandInputRef}
                type="text"
                placeholder="Rechercher parmi les 144 prompts, 9 playbooks ou lancer une action..."
                value={commandQuery}
                onChange={e => {
                  setCommandQuery(e.target.value);
                  setCommandSelectedIndex(0);
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-bright)',
                  fontSize: '0.88rem',
                  fontWeight: 500
                }}
              />
              <kbd
                onClick={() => setIsCommandPaletteOpen(false)}
                style={{
                  fontSize: '0.66rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '5px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div style={{ overflowY: 'auto', padding: '0.5rem', flex: 1 }}>
              {commandItems.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                  Aucun résultat pour « {commandQuery} ».
                </div>
              ) : (
                commandItems.map((item, idx) => {
                  const isSelected = idx === Math.min(commandSelectedIndex, commandItems.length - 1);
                  const showGroupHeader = idx === 0 || commandItems[idx - 1].groupLabel !== item.groupLabel;
                  return (
                    <React.Fragment key={item.id}>
                      {showGroupHeader && (
                        <div style={{
                          padding: '0.5rem 0.65rem 0.25rem',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'var(--text-faint)'
                        }}>
                          {item.groupLabel}
                        </div>
                      )}
                      <div
                        onClick={() => executeCommandItem(item)}
                        onMouseEnter={() => setCommandSelectedIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? 'var(--bg-highlight)' : 'transparent',
                          border: isSelected ? '1px solid var(--border-focus)' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.08s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                          {item.type === 'action' ? (
                            <Sparkles size={14} color={isSelected ? 'var(--accent-gold)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                          ) : item.type === 'playbook' ? (
                            <Compass size={14} color={isSelected ? 'var(--accent-gold)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                          ) : (
                            <FileCode size={14} color={isSelected ? 'var(--accent-gold)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.8rem',
                              fontWeight: isSelected ? 700 : 600,
                              color: isSelected ? 'var(--text-bright)' : 'var(--text-normal)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                          <span style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '5px',
                            backgroundColor: isSelected ? 'var(--accent-gold-subtle)' : 'var(--bg-input)',
                            color: isSelected ? 'var(--accent-gold)' : 'var(--text-muted)',
                            border: '1px solid var(--border-hairline)'
                          }}>
                            {item.badge}
                          </span>
                          {isSelected && <CornerDownLeft size={12} color="var(--accent-gold)" />}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div style={{
              padding: '0.5rem 0.9rem',
              borderTop: '1px solid var(--border-hairline)',
              backgroundColor: 'var(--bg-sidebar)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.68rem',
              color: 'var(--text-faint)'
            }}>
              <span>Navigation rapide au clavier</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>↑↓ Naviguer • ↵ Exécuter • ESC Fermer</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PROMPT BUILDER INTERACTIVE WIZARD (Phase 6) */}
      {isBuilderOpen && (
        <div
          onClick={() => setIsBuilderOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-modal-backdrop)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            zIndex: 120
          }}
        >
          <div
            className="ps-prompt-builder"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '920px',
              maxHeight: '92vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-focus)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-hairline)', paddingBottom: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-gold-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-gold)'
                }}>
                  <Wand2 size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-bright)', margin: 0 }}>
                    Assistant Guidé : Prompt Builder XML Élite
                  </h2>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Concevoir un prompt structuré en 4 étapes séquentielles avec prévisualisation en temps réel
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsBuilderOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper Navigation */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '0.5rem',
              padding: '0.4rem',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '9px',
              border: '1px solid var(--border-hairline)'
            }}>
              {[
                { step: 1, label: '1. Persona & Rôle' },
                { step: 2, label: '2. Entrées & Paramètres' },
                { step: 3, label: '3. Garde-fous & Directives' },
                { step: 4, label: '4. Schéma & Validation' }
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => setBuilderStep(s.step)}
                  style={{
                    padding: '7px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: builderStep === s.step ? 'var(--accent-gold)' : 'transparent',
                    color: builderStep === s.step ? '#000000' : (builderStep > s.step ? 'var(--accent-emerald)' : 'var(--text-muted)'),
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    textAlign: 'center'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Step Body & Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.25rem' }}>
              {/* Form Input Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {builderStep === 1 && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                        Titre Fonctionnel du Prompt (FR)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex : Architecte Stratégique de Campagne Marketing"
                        value={builderForm.title_fr}
                        onChange={e => setBuilderForm({ ...builderForm, title_fr: e.target.value })}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                          Catégorie Métier
                        </label>
                        <select
                          value={builderForm.category}
                          onChange={e => setBuilderForm({ ...builderForm, category: e.target.value })}
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
                          {['Marketing', 'Tech & Dev', 'Stratégie & Direction', 'Ventes & Closing', 'Finance & Investissement', 'Service Client', 'Ressources Humaines', 'Juridique & Conformité', 'Contenu & Copywriting', 'Product Management', 'Data & Analytics', 'Entrepreneuriat'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                          Niveau de Seniorité
                        </label>
                        <input
                          type="text"
                          placeholder="Ex : Principal Staff Specialist"
                          value={builderForm.seniority}
                          onChange={e => setBuilderForm({ ...builderForm, seniority: e.target.value })}
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
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                        Rôle & Spécialisation Précise (en anglais pour le LLM)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex : elite Enterprise Marketing Strategist and Growth Director"
                        value={builderForm.role}
                        onChange={e => setBuilderForm({ ...builderForm, role: e.target.value })}
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
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                        Mission Principale & Livrable Attendu
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Ex : Concevoir une feuille de route trimestrielle à fort impact avec matrices d’exécution concrètes."
                        value={builderForm.objective}
                        onChange={e => setBuilderForm({ ...builderForm, objective: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-hairline)',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-bright)',
                          fontSize: '0.82rem',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </>
                )}

                {builderStep === 2 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                        Variables d'Entrée Dynamiques
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const idx = builderForm.variables.length + 1;
                          setBuilderForm({
                            ...builderForm,
                            variables: [
                              ...builderForm.variables,
                              { name: `Paramètre ${idx}`, placeholder: `{{param-${idx}}}`, desc_fr: `Description du paramètre ${idx}` }
                            ]
                          });
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          border: '1px solid var(--border-hairline)',
                          backgroundColor: 'var(--accent-gold-subtle)',
                          color: 'var(--accent-gold)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        + Ajouter une Variable
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto' }}>
                      {builderForm.variables.map((v, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.6rem',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-input)',
                            border: '1px solid var(--border-hairline)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <input
                              type="text"
                              placeholder="Nom FR"
                              value={v.name}
                              onChange={e => {
                                const next = [...builderForm.variables];
                                next[i].name = e.target.value;
                                setBuilderForm({ ...builderForm, variables: next });
                              }}
                              style={{
                                flex: 1,
                                padding: '5px 8px',
                                borderRadius: '5px',
                                border: '1px solid var(--border-hairline)',
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-bright)',
                                fontSize: '0.75rem'
                              }}
                            />
                            <input
                              type="text"
                              placeholder="{{tag}}"
                              value={v.placeholder}
                              onChange={e => {
                                const next = [...builderForm.variables];
                                next[i].placeholder = e.target.value;
                                setBuilderForm({ ...builderForm, variables: next });
                              }}
                              style={{
                                flex: 1,
                                padding: '5px 8px',
                                borderRadius: '5px',
                                border: '1px solid var(--border-hairline)',
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--accent-gold)',
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-mono)'
                              }}
                            />
                            {builderForm.variables.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBuilderForm({
                                    ...builderForm,
                                    variables: builderForm.variables.filter((_, idx) => idx !== i)
                                  });
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-faint)',
                                  cursor: 'pointer',
                                  padding: '2px 5px'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="Description du paramètre"
                            value={v.desc_fr}
                            onChange={e => {
                              const next = [...builderForm.variables];
                              next[i].desc_fr = e.target.value;
                              setBuilderForm({ ...builderForm, variables: next });
                            }}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '5px',
                              border: '1px solid var(--border-hairline)',
                              backgroundColor: 'var(--bg-card)',
                              color: 'var(--text-muted)',
                              fontSize: '0.73rem'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {builderStep === 3 && (
                  <>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                          Directives & Règles d'Exécution (Execution Guidelines)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setBuilderForm({
                              ...builderForm,
                              guidelines: [...builderForm.guidelines, 'Nouvelle directive méthodologique']
                            });
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid var(--border-hairline)',
                            backgroundColor: 'var(--accent-gold-subtle)',
                            color: 'var(--accent-gold)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Ajouter
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {builderForm.guidelines.map((g, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <input
                              type="text"
                              value={g}
                              onChange={e => {
                                const next = [...builderForm.guidelines];
                                next[i] = e.target.value;
                                setBuilderForm({ ...builderForm, guidelines: next });
                              }}
                              style={{
                                flex: 1,
                                padding: '6px 8px',
                                borderRadius: '5px',
                                border: '1px solid var(--border-hairline)',
                                backgroundColor: 'var(--bg-input)',
                                color: 'var(--text-bright)',
                                fontSize: '0.76rem'
                              }}
                            />
                            {builderForm.guidelines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBuilderForm({
                                    ...builderForm,
                                    guidelines: builderForm.guidelines.filter((_, idx) => idx !== i)
                                  });
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-faint)',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '0.3rem' }}>
                        Contraintes Négatives & Anti-Patterns (Ce que l'IA ne doit JAMAIS faire)
                      </label>
                      <textarea
                        rows={3}
                        value={builderForm.negativeConstraints}
                        onChange={e => setBuilderForm({ ...builderForm, negativeConstraints: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-hairline)',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-bright)',
                          fontSize: '0.82rem',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </>
                )}

                {builderStep === 4 && (
                  <>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                          Sections du Schéma Structuré de Sortie
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const idx = builderForm.outputSections.length + 1;
                            setBuilderForm({
                              ...builderForm,
                              outputSections: [...builderForm.outputSections, `${idx}. Nouvelle Section Clé`]
                            });
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid var(--border-hairline)',
                            backgroundColor: 'var(--accent-gold-subtle)',
                            color: 'var(--accent-gold)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Ajouter Section
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {builderForm.outputSections.map((sec, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <input
                              type="text"
                              value={sec}
                              onChange={e => {
                                const next = [...builderForm.outputSections];
                                next[i] = e.target.value;
                                setBuilderForm({ ...builderForm, outputSections: next });
                              }}
                              style={{
                                flex: 1,
                                padding: '6px 8px',
                                borderRadius: '5px',
                                border: '1px solid var(--border-hairline)',
                                backgroundColor: 'var(--bg-input)',
                                color: 'var(--text-bright)',
                                fontSize: '0.76rem'
                              }}
                            />
                            {builderForm.outputSections.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBuilderForm({
                                    ...builderForm,
                                    outputSections: builderForm.outputSections.filter((_, idx) => idx !== i)
                                  });
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-faint)',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-hairline)',
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.45
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.2rem' }}>
                        Garantie Déterministe :
                      </div>
                      Ce prompt impose un format structuré stricte qui force le modèle à livrer des sections ordonnées sans digression, maximisant la qualité pour Claude 3.5 Sonnet, GPT-4o et Gemini 1.5 Pro.
                    </div>
                  </>
                )}

                {/* Wizard navigation buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem' }}>
                  <button
                    type="button"
                    disabled={builderStep === 1}
                    onClick={() => setBuilderStep(prev => Math.max(1, prev - 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-hairline)',
                      backgroundColor: 'var(--bg-input)',
                      color: builderStep === 1 ? 'var(--text-faint)' : 'var(--text-normal)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: builderStep === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronLeft size={13} />
                    <span>Précédent</span>
                  </button>

                  {builderStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setBuilderStep(prev => Math.min(4, prev + 1))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'var(--accent-gold)',
                        color: '#000000',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <span>Suivant</span>
                      <ChevronRight size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyBuilderToWorkbench}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'var(--accent-emerald)',
                        color: '#000000',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      <Sparkles size={13} />
                      <span>Insérer dans l’Atelier</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real-Time XML Prompt Preview Box */}
              <div style={{
                borderRadius: '10px',
                border: '1px solid var(--border-hairline)',
                backgroundColor: 'var(--bg-input)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '7px 10px',
                  backgroundColor: 'var(--bg-sidebar)',
                  borderBottom: '1px solid var(--border-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FileCode size={12} color="var(--accent-gold)" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>
                      apercu_xml_temps_reel.xml
                    </span>
                  </div>
                  <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ~{Math.max(1, Math.ceil(assembledBuilderPrompt.length / 3.8))} tokens
                  </span>
                </div>

                <pre style={{
                  padding: '0.85rem',
                  fontSize: '0.72rem',
                  lineHeight: 1.5,
                  color: 'var(--text-normal)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowY: 'auto',
                  flex: 1,
                  maxHeight: '380px',
                  margin: 0
                }}>
                  <code>
                    <HighlightedPrompt text={assembledBuilderPrompt} />
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

