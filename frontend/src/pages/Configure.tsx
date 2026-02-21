import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Users, BookOpen, User, GraduationCap, Microscope, ShieldAlert, Sparkles, Mic2 } from 'lucide-react';
import { StepIndicator } from '../components/StepIndicator';
import { useAppContext } from '../context/AppContext';

export function Configure() {
    const navigate = useNavigate();
    const {
        sessionId, pdfTextPreview, config, updateConfigField, setScript,
        selectedTransformation,
    } = useAppContext();

    const [focusInput, setFocusInput] = useState('');
    const [focusAreas, setFocusAreas] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const hasTwoPapers = pdfTextPreview?.includes('--- PAPER 2:');

    const handleFocusKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && focusInput.trim()) {
            e.preventDefault();
            if (focusAreas.length < 5) {
                const updated = [...focusAreas, focusInput.trim()];
                setFocusAreas(updated);
                setFocusInput('');
                updateConfigField('focusAreas', updated.join(', '));
            }
        }
    };

    const removeFocusArea = (index: number) => {
        const newAreas = focusAreas.filter((_, i) => i !== index);
        setFocusAreas(newAreas);
        updateConfigField('focusAreas', newAreas.join(', '));
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://papercast-production.up.railway.app'}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    pdfText: pdfTextPreview,
                    config: {
                        ...config,
                        focusAreas: focusAreas.length > 0 ? focusAreas.join(', ') : 'full paper',
                    },
                    transformationSystemPrompt: selectedTransformation.systemPrompt,
                }),
            });
            if (!response.ok) throw new Error('Generation failed');
            const data = await response.json();
            setScript(data.script);
            navigate('/edit');
        } catch (error) {
            console.error(error);
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <StepIndicator currentStep={3} />

            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">Customize Your Podcast</h1>
                <p className="text-brand-muted text-lg">Tell us how Alex and Sam should present this material.</p>
            </div>

            <div className="space-y-6">

                {/* Card 1: Who Is This For? */}
                <section className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Users className="w-5 h-5 text-brand-primary" />
                        <h2 className="text-xl font-display font-semibold">Who Is This For?</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { id: 'newcomer', icon: User, label: 'Newcomer', desc: 'Simple terms, lots of analogies' },
                            { id: 'student', icon: GraduationCap, label: 'Student', desc: 'Core concepts and implications' },
                            { id: 'researcher', icon: Microscope, label: 'Researcher', desc: 'Deep methodology & nuance' },
                        ].map(audience => (
                            <button
                                key={audience.id}
                                onClick={() => updateConfigField('audience', audience.id)}
                                className={`p-4 rounded-xl border text-left transition-all duration-200 ${config.audience === audience.id
                                    ? 'border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary shadow-[0_0_15px_rgba(108,99,255,0.15)]'
                                    : 'border-brand-border hover:border-brand-muted bg-brand-bg/50'
                                    }`}
                            >
                                <audience.icon className={`w-6 h-6 mb-3 ${config.audience === audience.id ? 'text-brand-primary' : 'text-brand-muted'}`} />
                                <div className="font-semibold text-brand-text mb-1">{audience.label}</div>
                                <div className="text-xs text-brand-muted">{audience.desc}</div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Card 2: Episode Length */}
                <section className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <Clock className="w-5 h-5 text-brand-primary" />
                        <h2 className="text-xl font-display font-semibold">Episode Length</h2>
                    </div>
                    <div className="relative pt-6 pb-2">
                        <div className="flex justify-between w-full px-2 mb-2 text-sm font-medium text-brand-muted">
                            <span className={config.length === 'short' ? 'text-brand-primary' : ''}>Short</span>
                            <span className={config.length === 'medium' ? 'text-brand-primary' : ''}>Medium</span>
                            <span className={config.length === 'deep-dive' ? 'text-brand-primary' : ''}>Deep Dive</span>
                        </div>
                        <input
                            type="range" min="0" max="2" step="1"
                            value={config.length === 'short' ? 0 : config.length === 'medium' ? 1 : 2}
                            onChange={e => {
                                const val = parseInt(e.target.value);
                                updateConfigField('length', val === 0 ? 'short' : val === 1 ? 'medium' : 'deep-dive');
                            }}
                            className="w-full h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-primary z-10 relative"
                        />
                        <div className="mt-6 text-center text-sm">
                            <span className="text-brand-text font-medium">
                                {config.length === 'short' ? 'Est. 5-8 min · ~1,000 words' :
                                    config.length === 'medium' ? 'Est. 12-18 min · ~2,400 words' :
                                        'Est. 25-40 min · ~4,500 words'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Card 3: Focus Areas */}
                <section className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <BookOpen className="w-5 h-5 text-brand-primary" />
                        <h2 className="text-xl font-display font-semibold">Focus Areas <span className="text-brand-muted text-sm font-normal">(Optional)</span></h2>
                    </div>
                    <div className="bg-brand-bg/50 border border-brand-border rounded-xl p-2 flex flex-wrap gap-2 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
                        {focusAreas.map((area, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-brand-primary/20 text-brand-text px-3 py-1.5 rounded-lg text-sm font-medium border border-brand-primary/30">
                                {area}
                                <button onClick={() => removeFocusArea(i)} className="text-brand-primary hover:text-white transition-colors">&times;</button>
                            </div>
                        ))}
                        <input
                            type="text" value={focusInput}
                            onChange={e => setFocusInput(e.target.value)}
                            onKeyDown={handleFocusKeyDown}
                            placeholder={focusAreas.length === 0 ? "e.g. methodology, limitations, future work..." : ""}
                            className="flex-1 bg-transparent min-w-[200px] border-none outline-none text-brand-text p-1.5 text-sm"
                            disabled={focusAreas.length >= 5}
                        />
                    </div>
                    <p className="text-xs text-brand-muted mt-3">Leave blank to cover full paper. Max 5 topics. Press Enter to add.</p>
                </section>

                {/* Card 4: Conversation Style */}
                <section className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Zap className="w-5 h-5 text-brand-primary" />
                        <h2 className="text-xl font-display font-semibold">Conversation Style</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => updateConfigField('style', 'explain')}
                            className={`p-6 rounded-xl border text-left transition-all duration-200 ${config.style === 'explain'
                                ? 'border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary'
                                : 'border-brand-border hover:border-brand-muted bg-brand-bg/50'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="font-semibold text-lg text-brand-text">Explain Mode</div>
                                <div className={`w-4 h-4 rounded-full border-2 ${config.style === 'explain' ? 'border-brand-primary bg-brand-primary' : 'border-brand-muted'}`} />
                            </div>
                            <p className="text-sm text-brand-muted mb-4 opacity-80">Alex guides the explanation while Sam asks smart questions to unpack the concepts step-by-step.</p>
                            <div className="flex gap-2 text-xs font-mono font-medium text-brand-primary bg-brand-primary/10 w-fit px-2 py-1 rounded">EXPLORATORY · DEFAULT</div>
                        </button>

                        <button
                            disabled={!hasTwoPapers}
                            onClick={() => updateConfigField('style', 'debate')}
                            className={`p-6 rounded-xl border text-left transition-all duration-200 ${config.style === 'debate'
                                ? 'border-brand-secondary bg-brand-secondary/10 ring-1 ring-brand-secondary'
                                : 'border-brand-border hover:border-brand-muted bg-brand-bg/50'
                                } ${!hasTwoPapers ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="font-semibold text-lg text-brand-text">Debate Mode</div>
                                    <ShieldAlert className="w-4 h-4 text-brand-secondary" />
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 ${config.style === 'debate' ? 'border-brand-secondary bg-brand-secondary' : 'border-brand-muted'}`} />
                            </div>
                            <p className="text-sm text-brand-muted mb-4 opacity-80">Alex and Sam take opposing views, analyzing contradictions and contrasting methodologies directly.</p>
                            <div className="flex gap-2 text-xs font-mono font-medium text-brand-secondary bg-brand-secondary/10 w-fit px-2 py-1 rounded">REQUIRES 2 PDFs</div>
                        </button>
                    </div>
                </section>

                {/* Card 5: Intro & Wrap-up */}
                <section className="bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${config.introWrapup ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-bg text-brand-muted'} transition-colors`}>
                            <Mic2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-semibold mb-1">Include Intro & Wrap-up</h2>
                            <p className="text-brand-muted text-sm">Add a natural podcast introduction and concluding thoughts.</p>
                        </div>
                    </div>

                    <button
                        onClick={() => updateConfigField('introWrapup', !config.introWrapup)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ${config.introWrapup ? 'bg-brand-primary' : 'bg-brand-border'
                            }`}
                    >
                        <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${config.introWrapup ? 'translate-x-7' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </section>

                {/* Active transformation badge */}
                <div className="flex items-center gap-2 px-4 py-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
                    <Sparkles className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    <p className="text-sm text-brand-muted">
                        Processing style: <span className="text-brand-primary font-semibold">{selectedTransformation.title}</span>
                        <span className="mx-2 text-brand-border">·</span>
                        {selectedTransformation.description}
                    </p>
                </div>

                {/* Generate Button */}
                <div className="mt-12 text-center pb-8">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !sessionId}
                        className={`w-full max-w-xl mx-auto py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${!isGenerating && sessionId
                            ? 'bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-[#5b54e5] hover:to-[#00bda0] text-white shadow-[0_10px_30px_rgba(108,99,255,0.3)] hover:shadow-[0_15px_40px_rgba(0,212,170,0.4)] hover:-translate-y-1'
                            : 'bg-brand-border text-brand-muted cursor-not-allowed'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <div>
                                    <span className="font-mono text-sm block opacity-70">Groq is reading your paper...</span>
                                    <span>Generating Script</span>
                                </div>
                            </>
                        ) : (
                            <>Generate Script &rarr;</>
                        )}
                    </button>
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-brand-muted">
                        <Clock className="w-4 h-4 opacity-60" /> Generation takes 15-45 seconds ·
                        <Sparkles className="w-4 h-4 text-brand-primary opacity-80 ml-2" /> Powered by Groq
                    </div>
                </div>

            </div>
        </div>
    );
}
