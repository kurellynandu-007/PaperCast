import { useState, useRef } from 'react';
import { Search, BookOpen, Users, Calendar, X, Loader2, CheckCircle, Download, AlertCircle } from 'lucide-react';

interface Paper {
    id: string;
    title: string;
    authors: { name: string }[];
    year: number | null;
    abstract: string | null;
    pdfUrl: string | null;
    source: 'arxiv' | 'semantic_scholar' | 'openalex';
    hasFreePdf: boolean;
}

interface PaperSearchProps {
    onImport: (file: File, paperTitle: string, paperId?: string, paperUrl?: string) => void;
}

function SourceBadge({ source }: { source: Paper['source'] }) {
    if (source === 'arxiv') return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">arXiv</span>;
    if (source === 'openalex') return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">OpenAlex</span>;
    return <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-muted/15 text-brand-muted border border-brand-border">Semantic Scholar</span>;
}

export function PaperSearch({ onImport }: PaperSearchProps) {
    const [query, setQuery] = useState('');
    const [papers, setPapers] = useState<Paper[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [importingId, setImportingId] = useState<string | null>(null);
    const [importedId, setImportedId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleSearch(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!query.trim()) return;
        setIsSearching(true);
        setSearchError(null);
        setPapers([]);
        setImportedId(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://papercast-production.up.railway.app'}/api/paper-search?query=${encodeURIComponent(query.trim())}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Search failed');
            }
            const data: { papers: Paper[] } = await res.json();
            if (!data.papers?.length) {
                setSearchError('No papers found for this query. Try different keywords or a broader topic.');
            } else {
                setPapers(data.papers);
            }
        } catch (e) {
            setSearchError('Search temporarily unavailable. Please try again in a moment.');
        } finally {
            setIsSearching(false);
        }
    }

    async function handleImport(paper: Paper) {
        if (!paper.pdfUrl) return;
        setImportingId(paper.id);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://papercast-production.up.railway.app'}/api/fetch-pdf?url=${encodeURIComponent(paper.pdfUrl)}`);
            if (!res.ok) throw new Error('Failed to fetch PDF');
            const blob = await res.blob();
            const fileName = `${paper.title.substring(0, 60).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            const file = new File([blob], fileName, { type: 'application/pdf' });

            // Pass the generated File, title, and the source metadata back to parent
            onImport(file, paper.title, paper.id, paper.pdfUrl || undefined);

            setImportedId(paper.id);
        } catch {
            setSearchError('Could not import this paper. Try downloading manually.');
        } finally {
            setImportingId(null);
        }
    }

    function clearSearch() {
        setQuery('');
        setPapers([]);
        setSearchError(null);
        setImportedId(null);
        inputRef.current?.focus();
    }

    return (
        <div className="w-full space-y-4">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search research papers by topic..."
                        className="w-full pl-11 pr-10 py-3.5 bg-brand-input border border-brand-border focus:border-brand-primary rounded-xl text-brand-text placeholder-brand-muted text-sm outline-none transition-colors shadow-inner"
                    />
                    {query && (
                        <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isSearching || !query.trim()}
                    className="px-5 py-3.5 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(108,99,255,0.3)] whitespace-nowrap"
                >
                    {isSearching ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</> : <><Search className="w-4 h-4" /> Search</>}
                </button>
            </form>

            {isSearching && <p className="text-brand-muted text-xs font-mono text-center animate-pulse">Searching arXiv &amp; Semantic Scholar...</p>}

            {searchError && !isSearching && (
                <div className="flex items-start gap-2 text-center py-4 px-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{searchError}</p>
                </div>
            )}

            {papers.length > 0 && (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                    <p className="text-brand-muted text-xs font-mono">{papers.length} papers found</p>
                    {papers.map(paper => (
                        <div key={paper.id} className="group bg-brand-card border border-brand-border hover:border-brand-muted rounded-xl p-4 transition-all duration-200 hover:bg-brand-card-hover">
                            <div className="flex items-start gap-2 mb-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-brand-primary flex-shrink-0 mt-0.5" />
                                <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{paper.title}</h3>
                            </div>
                            <div className="flex items-center gap-3 mb-2 ml-5 flex-wrap">
                                {paper.authors.length > 0 && (
                                    <span className="flex items-center gap-1 text-brand-muted text-xs">
                                        <Users className="w-3 h-3" />
                                        {paper.authors.slice(0, 3).map(a => a.name).join(', ')}
                                        {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
                                    </span>
                                )}
                                {paper.year && (
                                    <span className="flex items-center gap-1 text-brand-muted text-xs">
                                        <Calendar className="w-3 h-3" /> {paper.year}
                                    </span>
                                )}
                                <SourceBadge source={paper.source} />
                            </div>
                            {paper.abstract && (
                                <p className="text-brand-muted text-xs leading-relaxed ml-5 line-clamp-3 mb-3">{paper.abstract}</p>
                            )}
                            <div className="ml-5">
                                {importedId === paper.id ? (
                                    <div className="flex items-center gap-1.5 text-brand-secondary text-xs font-medium">
                                        <CheckCircle className="w-3.5 h-3.5" /> Imported! Scroll up to continue.
                                    </div>
                                ) : paper.hasFreePdf && paper.pdfUrl ? (
                                    <button
                                        onClick={() => handleImport(paper)}
                                        disabled={importingId === paper.id}
                                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-primary/10 hover:bg-brand-primary border border-brand-primary/30 hover:border-brand-primary text-brand-primary hover:text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                                    >
                                        {importingId === paper.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Importing...</> : <><Download className="w-3 h-3" /> Import to PaperCast</>}
                                    </button>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-brand-muted text-xs px-3.5 py-1.5 bg-brand-bg/50 border border-brand-border rounded-lg w-fit cursor-not-allowed opacity-60">
                                        <X className="w-3 h-3" /> Download Not Possible
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
