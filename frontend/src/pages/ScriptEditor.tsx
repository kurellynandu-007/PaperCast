import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, RotateCcw, Headphones, ArrowLeft } from 'lucide-react';
import { StepIndicator } from '../components/StepIndicator';
import { DialogueCard } from '../components/DialogueCard';
import type { Dialogue } from '../components/DialogueCard';
import { useAppContext } from '../context/AppContext';
import { AudioLoadingScreen } from '../components/AudioLoadingScreen';

export function ScriptEditor() {
    const navigate = useNavigate();
    const { sessionId, script, setScript, setAudioUrl } = useAppContext();

    const [activeChapter, setActiveChapter] = useState(0);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [audioJobId, setAudioJobId] = useState<string | null>(null);

    const recalculateMetadata = (newScript: typeof script) => {
        if (!newScript) return newScript;
        let totalWords = 0;
        newScript.chapters.forEach(c => {
            c.dialogues.forEach(d => {
                totalWords += d.text.split(/\s+/).filter(Boolean).length;
            });
        });
        const mins = Math.floor(totalWords / 150);
        const secs = Math.floor((totalWords % 150) / 2.5);
        newScript.totalWords = totalWords;
        newScript.estimatedDuration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return newScript;
    };

    if (!script) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-brand-muted">
                <h2 className="text-xl">No script found.</h2>
                <button onClick={() => navigate('/configure')} className="text-brand-primary hover:underline">Go back to Configure</button>
            </div>
        );
    }

    const handleUpdateDialogueUrl = (chapterIndex: number, dialogueIndex: number, newText: string) => {
        const newScript = JSON.parse(JSON.stringify(script));
        newScript.chapters[chapterIndex].dialogues[dialogueIndex].text = newText;
        setScript(recalculateMetadata(newScript));
    };

    const handleRegenerateDialogue = () => {
        // In MVP, just an alert. Integration with real API to regenerate one block would go here.
        alert("Regenerating a single block requires block-level API support.");
    };

    const handleDeleteDialogue = (chapterIndex: number, dialogueIndex: number) => {
        const newScript = JSON.parse(JSON.stringify(script));
        newScript.chapters[chapterIndex].dialogues.splice(dialogueIndex, 1);
        setScript(recalculateMetadata(newScript));
    };

    const handleGenerateAudio = async () => {
        setIsGeneratingAudio(true);
        try {
            const response = await fetch('/api/audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    script
                })
            });

            if (!response.ok) throw new Error('Audio generation failed');

            const data = await response.json();

            if (data.jobId) {
                // New async flow — show loading screen
                setAudioJobId(data.jobId);
            } else if (data.audioUrl) {
                // Fallback: old sync flow
                setAudioUrl(data.audioUrl);
                navigate('/listen');
            }
        } catch (error) {
            console.error(error);
            setIsGeneratingAudio(false);
            alert('Failed to generate audio');
        }
    };

    const handleAudioReady = (audioUrl: string) => {
        setAudioUrl(audioUrl);
        setAudioJobId(null);
        setIsGeneratingAudio(false);
        navigate('/listen');
    };

    const handleAudioError = () => {
        // Retry: reset and try again
        setAudioJobId(null);
        setIsGeneratingAudio(false);
        handleGenerateAudio();
    };

    const handleAudioBack = () => {
        setAudioJobId(null);
        setIsGeneratingAudio(false);
    };

    return (
        <>
            {/* Audio Loading Screen Overlay */}
            {audioJobId && (
                <AudioLoadingScreen
                    paperTitle={script.title || 'Untitled Podcast'}
                    jobId={audioJobId}
                    onAudioReady={handleAudioReady}
                    onError={handleAudioError}
                    onBack={handleAudioBack}
                />
            )}

            <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <StepIndicator currentStep={4} />

                {/* Top Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-brand-card border border-brand-border rounded-2xl p-4 shadow-sm sticky top-20 z-40">
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
                        <Layers className="w-5 h-5 text-brand-primary flex-shrink-0" />
                        <div className="text-brand-muted text-sm whitespace-nowrap hidden sm:block">Research Paper <span className="mx-2">&gt;</span></div>
                        <h2 className="font-display font-semibold text-brand-text truncate pr-4">{script.title || 'Untitled Podcast'}</h2>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-text hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors">
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">Regenerate</span>
                        </button>
                        <button
                            onClick={handleGenerateAudio}
                            disabled={isGeneratingAudio}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-brand-primary to-[#8b84ff] hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] text-white text-sm font-semibold rounded-lg transition-all"
                        >
                            {isGeneratingAudio ? 'Synthesizing...' : 'Generate Audio 🎧'}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Sidebar: Chapters & Summary */}
                    <div className="w-full lg:w-64 flex-shrink-0 space-y-6 lg:sticky lg:top-40 h-fit">
                        <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
                            <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-4">Chapters</h3>
                            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                                {script.chapters.map((chapter, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveChapter(i)}
                                        className={`flex-shrink-0 lg:flex-shrink w-auto lg:w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeChapter === i
                                            ? 'bg-brand-primary text-white shadow-md'
                                            : 'bg-brand-bg/50 text-brand-muted hover:text-brand-text hover:bg-brand-bg border border-transparent hover:border-brand-border'
                                            }`}
                                    >
                                        {chapter.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-brand-card/80 border border-brand-border rounded-xl p-5 hidden lg:block">
                            <h3 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-3">Est. Outcome</h3>
                            <div className="space-y-3 font-mono text-sm">
                                <div className="flex justify-between">
                                    <span className="text-brand-muted">Words:</span>
                                    <span className="text-brand-text">{script.totalWords}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-brand-muted">Duration:</span>
                                    <span className="text-brand-text">{script.estimatedDuration}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Area: Dialogue Feed */}
                    <div className="flex-1 min-w-0">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(108,99,255,0.1)]">
                                Chapter {activeChapter + 1}: {script.chapters[activeChapter].title}
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            {/* Center line for conversation visual */}
                            <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-brand-border to-transparent -translate-x-1/2 opacity-50 z-0 hidden sm:block" />

                            {script.chapters[activeChapter].dialogues.map((dialogue: Dialogue, dIndex: number) => (
                                <DialogueCard
                                    key={`${activeChapter}-${dIndex}`}
                                    dialogue={dialogue}
                                    onUpdate={(txt) => handleUpdateDialogueUrl(activeChapter, dIndex, txt)}
                                    onRegenerate={() => handleRegenerateDialogue()}
                                    onDelete={() => handleDeleteDialogue(activeChapter, dIndex)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sticky Bottom Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-brand-bg/90 backdrop-blur-xl border-t border-brand-border p-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate('/configure')} className="hidden sm:flex items-center gap-2 text-brand-muted hover:text-white transition-colors text-sm font-medium">
                                <ArrowLeft className="w-4 h-4" /> Back to Config
                            </button>
                            <div className="text-sm border-l border-brand-border pl-6 hidden md:block">
                                <span className="text-brand-muted">Script Status: </span>
                                <span className="text-green-400 font-medium flex items-center gap-1.5 inline-flex"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Ready to Air</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateAudio}
                            disabled={isGeneratingAudio}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-white text-black text-sm font-extrabold rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                        >
                            {isGeneratingAudio ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Synthesizing Voices...
                                </>
                            ) : (
                                <>
                                    <Headphones className="w-4 h-4" /> Finalize Audio
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
