import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Users, Headphones, ChevronDown } from 'lucide-react';
import { UploadZone } from '../components/UploadZone';
import { PaperSearch } from '../components/PaperSearch';
import { useAppContext } from '../context/AppContext';

export function Home() {
    const navigate = useNavigate();
    const { sessionId, setSessionId, setPdfTextPreview, updateConfigField, setSourcePapers } = useAppContext();

    const [primaryFile, setPrimaryFile] = useState<File | null>(null);
    const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
    const [isDebateExpanded, setIsDebateExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const uploadCardRef = useRef<HTMLDivElement>(null);

    const handleContinue = async () => {
        if (!primaryFile) return;
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', primaryFile);
            if (secondaryFile) {
                formData.append('file2', secondaryFile);
                updateConfigField('style', 'debate'); // auto set debate mode
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setSessionId(data.sessionId);
            setPdfTextPreview(data.textPreview);

            setTimeout(() => {
                setIsUploading(false);
                navigate('/transformations');
            }, 800);

        } catch (error) {
            console.error(error);
            setIsUploading(false);
        }
    };

    const handlePaperImport = (file: File, paperTitle: string, paperId?: string, paperUrl?: string) => {
        setPrimaryFile(file);

        // Save source metadata to context
        setSourcePapers([{
            title: paperTitle,
            id: paperId,
            url: paperUrl
        }]);

        setTimeout(() => {
            uploadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">

            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4 pt-4"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-secondary/10 text-brand-secondary text-sm font-medium border border-brand-secondary/20 shadow-[0_0_15px_rgba(0,212,170,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
                    AI-Powered Research Tool
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight tracking-tight">
                    Turn Any Paper Into a <span className="text-brand-primary drop-shadow-[0_0_25px_rgba(108,99,255,0.4)]">Podcast</span>
                </h1>
                <p className="text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
                    Search millions of free research papers or upload your own PDF. Get an intelligent two-host conversation in minutes.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {[
                        { icon: Layers, text: 'Multi-paper support' },
                        { icon: Users, text: 'Dual AI Hosts' },
                        { icon: Headphones, text: 'Export MP3' },
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-card border border-brand-border text-sm font-medium">
                            <feature.icon className="w-4 h-4 text-brand-muted" />
                            <span>{feature.text}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Section 1 — Search Research Papers (top) */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="mb-4">
                    <h2 className="text-xl font-display font-bold mb-1">Search Research Papers</h2>
                    <p className="text-brand-muted text-sm">Find and import from millions of free open-access papers — no upload needed</p>
                </div>
                <div className="bg-brand-card/60 backdrop-blur-xl border border-brand-border rounded-3xl p-6 sm:p-8 shadow-xl">
                    <PaperSearch onImport={handlePaperImport} />
                </div>
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-brand-border" />
                <span className="text-brand-muted text-sm font-mono px-3">or upload your own PDF</span>
                <div className="flex-1 h-px bg-brand-border" />
            </div>

            {/* Section 2 — Upload Card (below search) */}
            <motion.div
                ref={uploadCardRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="max-w-2xl mx-auto w-full"
            >
                <div className="bg-brand-card/80 backdrop-blur-xl border border-brand-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-primary/15 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative z-10 space-y-5">
                        <div className="mb-2">
                            <h2 className="text-xl font-display font-bold mb-1">Upload a PDF</h2>
                            <p className="text-brand-muted text-sm">Upload your own research paper directly</p>
                        </div>

                        {sessionId && !primaryFile && (
                            <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-brand-primary">Session in Progress</h4>
                                    <p className="text-sm text-brand-muted">You have an active paper already uploaded.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/transformations')}
                                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover transition-colors text-white rounded-lg text-sm font-medium whitespace-nowrap"
                                >
                                    Resume
                                </button>
                            </div>
                        )}

                        <UploadZone
                            label="PRIMARY PAPER"
                            onUpload={(f) => {
                                setPrimaryFile(f);
                                if (f) setSourcePapers([{ title: f.name }]);
                            }}
                            importedFile={primaryFile}
                        />

                        <div className="border border-brand-border rounded-xl overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setIsDebateExpanded(!isDebateExpanded)}
                                className="w-full flex items-center justify-between p-4 bg-brand-bg/50 hover:bg-brand-bg text-sm font-medium transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-brand-secondary">+</span>
                                    <span>Add second paper for Debate Mode</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-brand-muted transition-transform duration-300 ${isDebateExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isDebateExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 pt-0 bg-brand-bg/50">
                                            <UploadZone
                                                label="SECONDARY PAPER"
                                                onUpload={(f) => {
                                                    setSecondaryFile(f);
                                                    if (f) setSourcePapers(prev => [...prev, { title: f.name }]);
                                                }}
                                                isDebateMode
                                                importedFile={secondaryFile}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={handleContinue}
                            disabled={!primaryFile || isUploading}
                            className={`w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all duration-300
                ${primaryFile && !isUploading
                                    ? 'bg-brand-primary hover:bg-brand-primary-hover text-white shadow-[0_0_20px_rgba(108,99,255,0.4)]'
                                    : 'bg-brand-border text-brand-muted cursor-not-allowed'}`}
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing PDF...
                                </>
                            ) : (
                                <>Continue to Options &rarr;</>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
