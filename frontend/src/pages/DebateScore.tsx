import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Upload, CheckCircle2, X, Loader2, BookOpen,
    Users, Calendar, Download, Zap, FileText, AlertCircle, Link as LinkIcon, ExternalLink
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useReferences } from '../context/ReferencesContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Paper {
    id: string;
    title: string;
    abstract: string | null;
    authors: { name: string }[];
    year: number | null;
    pdfUrl: string | null;
    source: 'arxiv' | 'semantic_scholar';
    hasFreePdf: boolean;
}

interface BreakdownItem { score: number; explanation: string; }
interface OpposingPoint { topic: string; paper1Claim: string; paper2Claim: string; }

interface DebateResult {
    overallScore: number;
    label: string;
    paper1Title: string;
    paper2Title: string;
    breakdown: {
        conclusions: BreakdownItem;
        methodology: BreakdownItem;
        findings: BreakdownItem;
        recommendations: BreakdownItem;
    };
    opposingPoints: OpposingPoint[];
    summary: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
    if (score <= 30) return '#22c55e';
    if (score <= 60) return '#eab308';
    if (score <= 80) return '#f97316';
    return '#ef4444';
}

function scoreBadge(score: number) {
    if (score <= 30) return { label: 'Mostly Agree', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    if (score <= 60) return { label: 'Partially Opposing', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    if (score <= 80) return { label: 'Significantly Opposing', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
    return { label: 'Strongly Opposing', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
}

const LOADING_STEPS = [
    'Reading Paper 1...',
    'Reading Paper 2...',
    'Comparing conclusions...',
    'Analyzing methodology...',
    'Calculating opposition score...',
];

const BREAKDOWN_ICONS: Record<string, string> = {
    conclusions: '🎯',
    methodology: '🔬',
    findings: '📊',
    recommendations: '💡',
};

// ─── Score Gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
    const r = 90;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const color = scoreColor(score);

    return (
        <div className="relative w-52 h-52 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={r} fill="none" stroke="#1E1E2E" strokeWidth="16" />
                <circle
                    cx="100" cy="100" r={r} fill="none"
                    stroke={color} strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{
                        filter: `drop-shadow(0 0 12px ${color})`,
                        transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-display font-bold" style={{ color }}>{score}%</span>
                <span className="text-xs font-mono text-brand-muted tracking-widest mt-1">OPPOSITION SCORE</span>
            </div>
        </div>
    );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

interface UploadZoneProps {
    label: string;
    color: 'violet' | 'teal';
    file: File | null;
    onFile: (f: File) => void;
    onClear: () => void;
    summary: string | null;
    summaryLoading: boolean;
}

function UploadZone({ label, color, file, onFile, onClear, summary, summaryLoading }: UploadZoneProps) {
    const ref = useRef<HTMLInputElement>(null);
    const isDragging = useRef(false);
    const [dragging, setDragging] = useState(false);
    const primary = color === 'violet' ? '#6C63FF' : '#00D4AA';
    const primaryFaded = color === 'violet' ? 'rgba(108,99,255,0.15)' : 'rgba(0,212,170,0.15)';
    const borderCls = color === 'violet' ? 'border-[#6C63FF]/40 hover:border-[#6C63FF]' : 'border-[#00D4AA]/40 hover:border-[#00D4AA]';
    const textCls = color === 'violet' ? 'text-[#6C63FF]' : 'text-[#00D4AA]';
    const labelCls = color === 'violet' ? 'text-[#6C63FF]' : 'text-[#00D4AA]';

    const showDialog = summaryLoading || !!summary;

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f?.type === 'application/pdf') onFile(f);
    }

    return (
        <div className="flex-1 relative">
            <div
                onDragOver={e => { e.preventDefault(); if (!isDragging.current) { isDragging.current = true; setDragging(true); } }}
                onDragLeave={() => { isDragging.current = false; setDragging(false); }}
                onDrop={handleDrop}
                onClick={() => !file && ref.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-300 cursor-pointer
                    ${borderCls}
                    ${dragging ? 'scale-[1.02]' : ''}
                    ${file ? 'cursor-default' : ''}
                `}
                style={{
                    background: dragging || file ? primaryFaded : 'rgba(18,18,26,0.8)',
                    minHeight: 200,
                }}
            >
                <span className={`text-xs font-mono font-bold tracking-widest ${labelCls}`}>{label}</span>

                {file ? (
                    <div className="text-center space-y-2">
                        <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: primary }} />
                        <p className="text-brand-text font-semibold text-sm break-all px-2">{file.name}</p>
                        <p className="text-brand-muted text-xs">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                        <button
                            onClick={e => { e.stopPropagation(); onClear(); }}
                            className="flex items-center gap-1 mx-auto text-brand-muted hover:text-red-400 text-xs transition-colors"
                        >
                            <X className="w-3 h-3" /> Remove
                        </button>
                    </div>
                ) : (
                    <>
                        <Upload className="w-9 h-9" style={{ color: primary }} />
                        <div className="text-center">
                            <p className="text-brand-text font-medium text-sm">Drop PDF here</p>
                            <p className="text-xs mt-1">
                                or{' '}
                                <span className={`underline underline-offset-2 ${textCls}`}>click to browse</span>
                            </p>
                        </div>
                        <p className="text-brand-muted text-xs font-mono">PDF only · Max 50MB</p>
                    </>
                )}
            </div>

            {/* ── Summary Dialog ─────────────────────────────────────── */}
            <div
                style={{
                    opacity: showDialog ? 1 : 0,
                    transform: showDialog ? 'translateY(0)' : 'translateY(-8px)',
                    maxHeight: showDialog ? 120 : 0,
                    marginTop: showDialog ? 12 : 0,
                    padding: showDialog ? '12px 16px' : '0 16px',
                    overflow: 'hidden',
                    transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1), max-height 0.45s cubic-bezier(0.4,0,0.2,1), margin-top 0.4s cubic-bezier(0.4,0,0.2,1), padding 0.4s cubic-bezier(0.4,0,0.2,1)',
                    background: 'rgba(22,22,35,0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderLeft: `3px solid ${primary}`,
                    boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 12px ${color === 'violet' ? 'rgba(108,99,255,0.12)' : 'rgba(0,212,170,0.12)'}`,
                    pointerEvents: showDialog ? 'auto' : 'none',
                }}
            >
                {summaryLoading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" style={{ color: primary }} />
                        <span className="text-brand-muted text-xs font-mono animate-pulse">Generating summary...</span>
                    </div>
                ) : summary ? (
                    <div className="flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                        <p className="text-brand-text text-xs leading-relaxed">{summary}</p>
                    </div>
                ) : null}
            </div>

            <input ref={ref} type="file" accept=".pdf,application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </div>
    );
}

// ─── Debate Score Page ────────────────────────────────────────────────────────

export function DebateScore() {
    const navigate = useNavigate();
    const { setSessionId, setPdfTextPreview, updateConfigField } = useAppContext();
    const { addReference } = useReferences();

    // Search state
    const [query, setQuery] = useState('');
    const [papers, setPapers] = useState<Paper[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [importingId, setImportingId] = useState<string | null>(null);
    const [importedMap, setImportedMap] = useState<Record<string, 1 | 2>>({});

    // Files
    const [pdf1, setPdf1] = useState<File | null>(null);
    const [pdf2, setPdf2] = useState<File | null>(null);
    const [paper1Meta, setPaper1Meta] = useState<{ id?: string, url?: string }>({});
    const [paper2Meta, setPaper2Meta] = useState<{ id?: string, url?: string }>({});

    // Summaries
    const [summary1, setSummary1] = useState<string | null>(null);
    const [summary2, setSummary2] = useState<string | null>(null);
    const [summaryLoading1, setSummaryLoading1] = useState(false);
    const [summaryLoading2, setSummaryLoading2] = useState(false);

    // Analysis
    const [analyzing, setAnalyzing] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [result, setResult] = useState<DebateResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [generatingPodcast, setGeneratingPodcast] = useState(false);

    const resultsRef = useRef<HTMLDivElement>(null);

    // ── Fetch PDF Summary ─────────────────────────────────────────────────

    async function fetchSummary(file: File, slot: 1 | 2) {
        const setLoading = slot === 1 ? setSummaryLoading1 : setSummaryLoading2;
        const setSummary = slot === 1 ? setSummary1 : setSummary2;
        setLoading(true);
        setSummary(null);
        try {
            const form = new FormData();
            form.append('pdf', file);
            const res = await fetch('/api/pdf-summary', { method: 'POST', body: form });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSummary(data.summary || 'No summary available.');
        } catch {
            setSummary('Could not generate summary for this paper.');
        } finally {
            setLoading(false);
        }
    }

    function handleFile1(f: File) {
        setPdf1(f);
        fetchSummary(f, 1);
    }

    function handleFile2(f: File) {
        setPdf2(f);
        fetchSummary(f, 2);
    }

    function clearFile1() {
        setPdf1(null);
        setSummary1(null);
    }

    function clearFile2() {
        setPdf2(null);
        setSummary2(null);
    }

    // ── Search ──────────────────────────────────────────────────────────────

    async function handleSearch(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!query.trim()) return;
        setSearching(true);
        setSearchError(null);
        setPapers([]);
        try {
            const res = await fetch(`/api/paper-search?query=${encodeURIComponent(query.trim())}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Search failed');
            }
            const data: { papers: Paper[] } = await res.json();
            if (!data.papers?.length) {
                setSearchError('We have no articles about that topic right now. Try different keywords.');
            } else {
                setPapers(data.papers);
            }
        } catch (e) {
            setSearchError(e instanceof Error ? e.message : 'Search failed. Check your internet connection and try again.');
        } finally { setSearching(false); }
    }

    async function handleImport(paper: Paper, slot: 1 | 2) {
        if (!paper.pdfUrl) return;
        setImportingId(`${paper.id}-${slot}`);
        try {
            const res = await fetch(`/api/fetch-pdf?url=${encodeURIComponent(paper.pdfUrl)}`);
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const fileName = `${paper.title.substring(0, 60).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            const file = new File([blob], fileName, { type: 'application/pdf' });
            if (slot === 1) {
                setPdf1(file);
                setPaper1Meta({ id: paper.id, url: paper.pdfUrl || undefined });
                fetchSummary(file, 1);
            } else {
                setPdf2(file);
                setPaper2Meta({ id: paper.id, url: paper.pdfUrl || undefined });
                fetchSummary(file, 2);
            }
            setImportedMap(prev => ({ ...prev, [paper.id]: slot }));

            // Track as a reference for the Listen page
            addReference({
                id: paper.id,
                title: paper.title,
                authors: paper.authors,
                year: paper.year,
                pdfUrl: paper.pdfUrl,
                source: paper.source,
                usedAs: 'debate',
            });
        } catch { setSearchError('Could not import this paper. Try downloading manually.'); }
        finally { setImportingId(null); }
    }

    // ── Analysis ─────────────────────────────────────────────────────────────

    const runAnalysis = useCallback(async () => {
        if (!pdf1 || !pdf2) return;
        setAnalyzing(true);
        setError(null);
        setResult(null);
        setLoadingStep(0);

        const interval = setInterval(() => {
            setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
        }, 3500);

        try {
            const form = new FormData();
            form.append('pdf1', pdf1);
            form.append('pdf2', pdf2);
            const res = await fetch('/api/debate-score', { method: 'POST', body: form });
            let data: DebateResult & { error?: string };
            try {
                data = await res.json();
            } catch {
                throw new Error('Server returned an unexpected response. Please try again.');
            }
            if (!res.ok) throw new Error(data.error || 'Analysis failed');
            setResult(data);
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Analysis failed. Please try again.');
        } finally {
            clearInterval(interval);
            setAnalyzing(false);
        }
    }, [pdf1, pdf2]);

    // ── Download report ───────────────────────────────────────────────────────

    function downloadReport() {
        if (!result) return;
        const badge = scoreBadge(result.overallScore);
        const lines = [
            `PAPERCAST DEBATE SCORE REPORT`,
            `${'═'.repeat(60)}`,
            ``,
            `PAPER 1: ${result.paper1Title} ${paper1Meta.url ? `(Source: ${paper1Meta.url})` : ''}`,
            `PAPER 2: ${result.paper2Title} ${paper2Meta.url ? `(Source: ${paper2Meta.url})` : ''}`,
            ``,
            `OVERALL OPPOSITION SCORE: ${result.overallScore}% — ${badge.label}`,
            ``,
            `SUMMARY`,
            `${'─'.repeat(60)}`,
            result.summary,
            ``,
            `OPPOSITION BREAKDOWN`,
            `${'─'.repeat(60)}`,
            ...Object.entries(result.breakdown).map(([k, v]) =>
                `${k.toUpperCase()} (${v.score}/100)\n${v.explanation}`
            ),
            ``,
            `MAIN POINTS OF DISAGREEMENT`,
            `${'─'.repeat(60)}`,
            ...result.opposingPoints.map(p =>
                `${p.topic}\n  Paper 1: ${p.paper1Claim}\n  Paper 2: ${p.paper2Claim}`
            ),
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'PaperCast-DebateScore.txt';
        a.click(); URL.revokeObjectURL(url);
    }

    // ── Navigate to debate podcast ────────────────────────────────────────────

    async function goToDebatePodcast() {
        if (!pdf1 || !pdf2) return;
        setGeneratingPodcast(true);
        setError(null);
        try {
            const form = new FormData();
            form.append('file', pdf1);
            form.append('file2', pdf2);

            const res = await fetch('/api/upload', { method: 'POST', body: form });
            if (!res.ok) throw new Error('Failed to prepare files for podcast generation.');

            const data = await res.json();
            setSessionId(data.sessionId);
            setPdfTextPreview(data.textPreview);
            updateConfigField('style', 'debate');

            navigate('/configure');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to prep debate podcast.');
            setGeneratingPodcast(false);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-14">

            {/* ── SECTION 1: HERO ──────────────────────────────────────────── */}
            <div className="text-center space-y-5 pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-secondary/10 text-brand-secondary text-sm font-medium border border-brand-secondary/20 shadow-[0_0_15px_rgba(0,212,170,0.15)]">
                    <Zap className="w-3.5 h-3.5" />
                    AI-Powered Analysis
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight tracking-tight">
                    How Much Do These Papers
                    <br />
                    <span style={{ color: '#6C63FF' }} className="drop-shadow-[0_0_25px_rgba(108,99,255,0.4)]">Disagree?</span>
                </h1>
                <p className="text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
                    Upload two research papers and get an AI-powered opposition score showing exactly where they conflict.
                </p>
            </div>

            {/* ── SECTION 2: SEARCH ─────────────────────────────────────────── */}
            <div>
                <div className="mb-4">
                    <h2 className="text-xl font-display font-bold mb-1">Search Research Papers</h2>
                    <p className="text-brand-muted text-sm">Find and import from millions of free open-access papers — no upload needed</p>
                </div>

                <div className="bg-brand-card/60 backdrop-blur-xl border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                    {/* Search bar */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
                            <input
                                type="text" value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search research papers by topic..."
                                className="w-full pl-11 pr-4 py-3.5 bg-brand-input border border-brand-border focus:border-brand-primary rounded-xl text-brand-text placeholder-brand-muted text-sm outline-none transition-colors"
                            />
                        </div>
                        <button
                            type="submit" disabled={searching || !query.trim()}
                            className="px-5 py-3.5 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(108,99,255,0.3)] whitespace-nowrap"
                        >
                            {searching ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</> : <><Search className="w-4 h-4" /> Search</>}
                        </button>
                    </form>

                    {searchError && (
                        <div className="flex items-start gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{searchError}</p>
                        </div>
                    )}

                    {searching && <p className="text-brand-muted text-xs font-mono text-center animate-pulse">Searching arXiv &amp; Semantic Scholar...</p>}

                    {papers.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                            {papers.map(paper => {
                                const importedSlot = importedMap[paper.id];
                                return (
                                    <div key={paper.id} className="bg-brand-card border border-brand-border hover:border-brand-muted rounded-xl p-4 transition-all flex flex-col gap-2">
                                        <div className="flex items-start gap-2">
                                            <BookOpen className="w-3.5 h-3.5 text-[#6C63FF] flex-shrink-0 mt-0.5" />
                                            <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{paper.title}</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pl-5">
                                            {paper.authors.length > 0 && (
                                                <span className="flex items-center gap-1 text-brand-muted text-xs">
                                                    <Users className="w-3 h-3" />
                                                    {paper.authors.slice(0, 2).map(a => a.name).join(', ')}
                                                    {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
                                                </span>
                                            )}
                                            {paper.year && (
                                                <span className="flex items-center gap-1 text-brand-muted text-xs">
                                                    <Calendar className="w-3 h-3" /> {paper.year}
                                                </span>
                                            )}
                                            {paper.source === 'arxiv' ? (
                                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">arXiv</span>
                                            ) : (
                                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-muted/10 text-brand-muted border border-brand-border">Semantic Scholar</span>
                                            )}
                                        </div>
                                        {paper.abstract && (
                                            <p className="text-brand-muted text-xs leading-relaxed line-clamp-3 pl-5">{paper.abstract}</p>
                                        )}

                                        {/* Action row */}
                                        <div className="mt-auto pt-2 pl-5 flex flex-wrap gap-2 items-center">
                                            {importedSlot ? (
                                                <span className="flex items-center gap-1 text-xs font-medium" style={{ color: importedSlot === 1 ? '#6C63FF' : '#00D4AA' }}>
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Loaded as Paper {importedSlot}
                                                </span>
                                            ) : paper.hasFreePdf && paper.pdfUrl ? (
                                                <div className="flex gap-1.5 flex-wrap">
                                                    <button
                                                        onClick={() => handleImport(paper, 1)}
                                                        disabled={!!importingId}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition-all disabled:opacity-50"
                                                        style={{ background: '#6C63FF' }}
                                                    >
                                                        {importingId === `${paper.id}-1` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                        PAPER 1
                                                    </button>
                                                    <button
                                                        onClick={() => handleImport(paper, 2)}
                                                        disabled={!!importingId}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#0A0A0F] transition-all disabled:opacity-50"
                                                        style={{ background: '#00D4AA' }}
                                                    >
                                                        {importingId === `${paper.id}-2` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                        PAPER 2
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-brand-muted text-xs flex items-center gap-1 px-3 py-1.5 bg-brand-bg/50 border border-brand-border rounded-lg opacity-60 cursor-not-allowed">
                                                    <X className="w-3 h-3" /> Download Not Possible
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Divider ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-brand-border" />
                <span className="text-brand-muted text-sm font-mono px-3">or upload your own PDFs</span>
                <div className="flex-1 h-px bg-brand-border" />
            </div>

            {/* ── SECTION 3: UPLOAD ─────────────────────────────────────────── */}
            <div>
                <div className="mb-6">
                    <h2 className="text-xl font-display font-bold mb-1">Upload Your Own PDFs</h2>
                    <p className="text-brand-muted text-sm">Compare local files directly on your device</p>
                </div>

                {/* Two zones + VS badge */}
                <div className="flex flex-col sm:flex-row items-stretch gap-0 sm:gap-4">
                    <UploadZone label="PAPER 1" color="violet" file={pdf1} onFile={handleFile1} onClear={clearFile1} summary={summary1} summaryLoading={summaryLoading1} />

                    {/* VS badge */}
                    <div className="flex items-center justify-center z-10 my-(-3) sm:my-0 sm:mx-(-8)">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-lg text-white shadow-[0_0_20px_rgba(108,99,255,0.4)]"
                            style={{ background: 'linear-gradient(135deg, #6C63FF, #00D4AA)' }}>
                            VS
                        </div>
                    </div>

                    <UploadZone label="PAPER 2" color="teal" file={pdf2} onFile={handleFile2} onClear={clearFile2} summary={summary2} summaryLoading={summaryLoading2} />
                </div>

                {/* Analyze button */}
                <div className="mt-8 space-y-3">
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                        </div>
                    )}

                    <button
                        onClick={runAnalysis}
                        disabled={!pdf1 || !pdf2 || analyzing}
                        className="w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                        style={pdf1 && pdf2 && !analyzing ? {
                            background: 'linear-gradient(135deg, #6C63FF, #00D4AA)',
                            boxShadow: '0 10px 30px rgba(108,99,255,0.3)',
                            color: 'white',
                        } : { background: '#1E1E2E', color: '#555' }}
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-mono text-base">{LOADING_STEPS[loadingStep]}</span>
                            </>
                        ) : (
                            <>Calculate Opposition Score →</>
                        )}
                    </button>

                    {analyzing && (
                        <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-[3500ms] ease-linear"
                                style={{
                                    width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`,
                                    background: 'linear-gradient(90deg, #6C63FF, #00D4AA)',
                                }}
                            />
                        </div>
                    )}

                    <p className="text-center text-brand-muted text-sm">
                        Analysis takes 15–30 seconds · <Zap className="inline w-3.5 h-3.5 text-brand-secondary" /> Powered by Groq AI
                    </p>
                </div>
            </div>

            {/* ── SECTION 4: RESULTS ────────────────────────────────────────── */}
            {result && (
                <div ref={resultsRef} className="space-y-10 animate-in fade-in duration-500">

                    {/* 4a. Score Gauge */}
                    <div className="text-center space-y-6 py-8 bg-brand-card/50 border border-brand-border rounded-3xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-bg/30 pointer-events-none" />

                        <div className="flex items-center justify-center gap-4 text-sm font-semibold flex-wrap relative z-10">
                            <div className="flex flex-col items-center gap-1">
                                <span style={{ color: '#6C63FF' }} className="text-center">{result.paper1Title}</span>
                                {paper1Meta.url && (
                                    <a href={paper1Meta.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-brand-muted hover:text-brand-primary transition-colors bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                        <LinkIcon className="w-2.5 h-2.5" /> Source
                                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                                    </a>
                                )}
                            </div>

                            <span className="text-brand-muted text-xs font-mono">VS</span>

                            <div className="flex flex-col items-center gap-1">
                                <span style={{ color: '#00D4AA' }} className="text-center">{result.paper2Title}</span>
                                {paper2Meta.url && (
                                    <a href={paper2Meta.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-brand-muted hover:text-brand-secondary transition-colors bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                        <LinkIcon className="w-2.5 h-2.5" /> Source
                                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="relative z-10">
                            <ScoreGauge score={result.overallScore} />
                        </div>

                        <div className="relative z-10">
                            {(() => {
                                const b = scoreBadge(result.overallScore); return (
                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${b.bg} ${b.text} ${b.border}`}>
                                        <AlertCircle className="w-4 h-4" /> {b.label}
                                    </span>
                                );
                            })()}
                        </div>

                        <p className="text-brand-muted text-sm max-w-xl mx-auto px-6 relative z-10 leading-relaxed">{result.summary}</p>
                    </div>

                    {/* 4b. Breakdown */}
                    <div>
                        <h2 className="text-2xl font-display font-bold mb-6">Opposition Breakdown</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(result.breakdown).map(([key, val]) => {
                                const color = scoreColor(val.score);
                                return (
                                    <div key={key} className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{BREAKDOWN_ICONS[key] ?? '📌'}</span>
                                                <span className="font-semibold capitalize">{key}</span>
                                            </div>
                                            <span className="font-mono text-sm font-bold" style={{ color }}>{val.score}/100</span>
                                        </div>
                                        <div className="w-full h-2 bg-brand-border rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${val.score}%`, background: color, boxShadow: `0 0 8px ${color}` }}
                                            />
                                        </div>
                                        <p className="text-brand-muted text-sm leading-relaxed">{val.explanation}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 4c. Disagreement points */}
                    <div>
                        <h2 className="text-2xl font-display font-bold mb-6">Main Points of Disagreement</h2>
                        <div className="space-y-4">
                            {result.opposingPoints.map((point, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#6C63FF' }} />
                                        <span className="text-xs font-mono font-bold text-brand-muted tracking-widest">{point.topic}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-start">
                                        <div className="bg-brand-card border border-brand-border hover:border-brand-primary/30 rounded-xl p-4 text-sm text-brand-text leading-relaxed transition-colors">
                                            {point.paper1Claim}
                                        </div>
                                        <div className="flex items-center justify-center text-brand-muted font-mono text-sm py-2 sm:py-0">vs</div>
                                        <div className="bg-brand-card border border-brand-border hover:border-brand-secondary/30 rounded-xl p-4 text-sm text-brand-text leading-relaxed transition-colors">
                                            {point.paper2Claim}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4d. Action buttons */}
                    <div className="space-y-3 pt-4">
                        <button
                            onClick={goToDebatePodcast}
                            disabled={generatingPodcast}
                            className="w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 text-white transition-all hover:-translate-y-0.5 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: 'linear-gradient(135deg, #6C63FF, #00D4AA)',
                                boxShadow: '0 10px_30px rgba(108,99,255,0.3)',
                            }}
                        >
                            {generatingPodcast ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                            {generatingPodcast ? 'Preparing Studio...' : 'Generate Debate Podcast →'}
                        </button>
                        <button
                            onClick={downloadReport}
                            className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border border-brand-border hover:border-brand-muted text-brand-muted hover:text-brand-text transition-all bg-transparent"
                        >
                            <Download className="w-4 h-4" /> Download Report
                        </button>
                        <p className="text-center text-brand-muted text-xs">
                            Debate podcast will load both papers automatically with Debate Mode enabled
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}
