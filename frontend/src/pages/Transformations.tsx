import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, FlaskConical, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { StepIndicator } from '../components/StepIndicator';
import { TransformationCard } from '../components/TransformationCard';
import { TransformationModal } from '../components/TransformationModal';
import { useAppContext } from '../context/AppContext';
import type { Transformation } from '../data/transformations';
import { DEFAULT_TRANSFORMATIONS } from '../data/transformations';

const ICONS: Record<string, string> = {
    standard_podcast: '🎙️',
    eli5_podcast: '🧒',
    deep_dive: '🔬',
    key_insights: '⚡',
    debate_style: '⚖️',
};

export function Transformations() {
    const navigate = useNavigate();
    const {
        allTransformations, selectedTransformation, setSelectedTransformation,
        addCustomTransformation, updateCustomTransformation, deleteCustomTransformation,
    } = useAppContext();

    const [editingTransformation, setEditingTransformation] = useState<Transformation | null | undefined>(undefined);
    const [playgroundOpen, setPlaygroundOpen] = useState<Transformation | null>(null);
    const [playgroundText, setPlaygroundText] = useState('');
    const [playgroundResult, setPlaygroundResult] = useState('');
    const [playgroundRunning, setPlaygroundRunning] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    async function runPlayground() {
        if (!playgroundOpen || !playgroundText.trim()) return;
        setPlaygroundRunning(true);
        setPlaygroundResult('');
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://papercast-production.up.railway.app'}/api/generate/playground`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt: playgroundOpen.systemPrompt, text: playgroundText }),
            });
            const data = await res.json();
            setPlaygroundResult(data.result || data.error || 'No output');
        } catch {
            setPlaygroundResult('Failed to run playground. Make sure the backend is running.');
        } finally {
            setPlaygroundRunning(false);
        }
    }

    const defaultNames = new Set(DEFAULT_TRANSFORMATIONS.map(d => d.name));

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <StepIndicator currentStep={2} />

            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">Choose Your Processing Style</h1>
                <p className="text-brand-muted text-lg">Tell how to approach this paper before generating the script.</p>
            </div>

            <div className="space-y-4">

                {/* Style cards grid */}
                <section className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-brand-primary" />
                            <h2 className="text-xl font-display font-semibold">Transformations</h2>
                        </div>
                        <button
                            onClick={() => setEditingTransformation(null)}
                            className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-primary transition-colors font-mono"
                        >
                            <Plus className="w-3.5 h-3.5" /> Create Custom
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {allTransformations.map(t => (
                            <TransformationCard
                                key={t.name}
                                transformation={t}
                                isSelected={selectedTransformation.name === t.name}
                                onSelect={() => setSelectedTransformation(t)}
                                onEdit={() => setEditingTransformation(t)}
                            />
                        ))}
                        <button
                            onClick={() => setEditingTransformation(null)}
                            className="rounded-xl border border-dashed border-brand-border hover:border-brand-primary text-brand-muted hover:text-brand-primary p-4 flex flex-col items-center justify-center gap-2 transition-all text-sm font-medium min-h-[80px]"
                        >
                            <Plus className="w-5 h-5" />
                            Create Custom
                        </button>
                    </div>

                    <p className="text-xs text-brand-muted mt-4">
                        Selected: <span className="text-brand-primary font-medium">{selectedTransformation.title}</span> — {selectedTransformation.description}
                    </p>
                </section>

                {/* All transformations list */}
                <section className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8">
                    <h2 className="text-sm font-bold text-brand-muted tracking-widest uppercase mb-4">All Transformations</h2>
                    <div className="space-y-2">
                        {allTransformations.map(t => {
                            const isDefault = defaultNames.has(t.name);
                            const isSelected = selectedTransformation.name === t.name;
                            return (
                                <div
                                    key={t.name}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer group ${isSelected
                                        ? 'border-brand-primary bg-brand-primary/8'
                                        : 'border-brand-border hover:border-brand-muted hover:bg-brand-bg/60'
                                        }`}
                                    onClick={() => setSelectedTransformation(t)}
                                >
                                    <span className="text-xl flex-shrink-0">{ICONS[t.name] ?? '✨'}</span>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-brand-text text-sm">{t.title}</span>
                                            {isDefault && <Lock className="w-3 h-3 text-brand-muted" />}
                                            {isSelected && (
                                                <span className="text-[10px] font-mono bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-full">ACTIVE</span>
                                            )}
                                        </div>
                                        <p className="text-brand-muted text-xs truncate">{t.description}</p>
                                    </div>

                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => { setPlaygroundOpen(t); setPlaygroundResult(''); setPlaygroundText(''); }}
                                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-brand-border hover:border-brand-secondary text-brand-muted hover:text-brand-secondary transition-colors"
                                        >
                                            <FlaskConical className="w-3 h-3" /> Playground
                                        </button>
                                        <button
                                            onClick={() => setEditingTransformation(t)}
                                            className="p-1.5 rounded-lg border border-brand-border hover:border-brand-primary text-brand-muted hover:text-brand-primary transition-colors"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        {!isDefault && (
                                            deleteConfirm === t.name ? (
                                                <button
                                                    onClick={() => { deleteCustomTransformation(t.name); setDeleteConfirm(null); }}
                                                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                                                >
                                                    Confirm
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirm(t.name)}
                                                    className="p-1.5 rounded-lg border border-brand-border hover:border-red-500/50 text-brand-muted hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Continue button */}
                <div className="mt-8 text-center pb-8">
                    <button
                        onClick={() => navigate('/configure')}
                        className="w-full max-w-xl mx-auto py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-[#5b54e5] hover:to-[#00bda0] text-white shadow-[0_10px_30px_rgba(108,99,255,0.3)] hover:shadow-[0_15px_40px_rgba(0,212,170,0.4)] hover:-translate-y-1 transition-all duration-300"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        Continue with "{selectedTransformation.title}" →
                    </button>
                    <p className="text-brand-muted text-sm mt-3">Next: customize audience, length, and focus areas</p>
                </div>

            </div>

            {/* Create/Edit Modal */}
            {editingTransformation !== undefined && (
                <TransformationModal
                    transformation={editingTransformation}
                    onSave={(t: Transformation) => {
                        if (editingTransformation === null) {
                            addCustomTransformation(t);
                        } else {
                            updateCustomTransformation(editingTransformation.name, t);
                        }
                        setEditingTransformation(undefined);
                    }}
                    onClose={() => setEditingTransformation(undefined)}
                />
            )}

            {/* Playground Modal */}
            {playgroundOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-3xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <FlaskConical className="w-4 h-4 text-brand-secondary" />
                                <h2 className="font-display font-bold text-lg">Playground — {playgroundOpen.title}</h2>
                            </div>
                            <button onClick={() => setPlaygroundOpen(null)} className="p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-white/5 transition-colors">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <div>
                                <label className="block text-xs font-bold text-brand-muted tracking-widest uppercase mb-1.5">Input Text</label>
                                <textarea
                                    value={playgroundText}
                                    onChange={e => setPlaygroundText(e.target.value)}
                                    placeholder="Paste any paper excerpt to test how this transformation processes it..."
                                    rows={6}
                                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border focus:border-brand-secondary rounded-xl text-brand-text placeholder-brand-muted text-sm outline-none transition-colors resize-none"
                                />
                            </div>
                            <button
                                onClick={runPlayground}
                                disabled={playgroundRunning || !playgroundText.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-brand-secondary/20 hover:bg-brand-secondary/30 border border-brand-secondary/30 text-brand-secondary rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                            >
                                {playgroundRunning ? (
                                    <><div className="w-4 h-4 border-2 border-brand-secondary/30 border-t-brand-secondary rounded-full animate-spin" /> Running...</>
                                ) : (
                                    <><FlaskConical className="w-4 h-4" /> Run Transformation</>
                                )}
                            </button>
                            {playgroundResult && (
                                <div>
                                    <label className="block text-xs font-bold text-brand-muted tracking-widest uppercase mb-1.5">Result</label>
                                    <pre className="w-full p-4 bg-brand-bg border border-brand-border rounded-xl text-brand-text text-sm whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-64">
                                        {playgroundResult}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
