import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';

interface AudioLoadingScreenProps {
    paperTitle: string;
    jobId: string;
    onAudioReady: (audioUrl: string) => void;
    onError: () => void;
    onBack: () => void;
}

const STATUS_PHASES = [
    { min: 0, max: 20, text: 'Extracting paper content...' },
    { min: 20, max: 40, text: "Generating Alex's dialogue..." },
    { min: 40, max: 60, text: "Generating Sam's dialogue..." },
    { min: 60, max: 80, text: 'Merging audio tracks...' },
    { min: 80, max: 95, text: 'Finalizing your podcast...' },
    { min: 95, max: 100, text: 'Almost ready...' },
];

function getStatusText(progress: number): string {
    const phase = STATUS_PHASES.find(p => progress >= p.min && progress < p.max);
    return phase?.text || STATUS_PHASES[STATUS_PHASES.length - 1].text;
}

// Animated word-by-word reveal component
function AnimatedLine({ words, delay }: { words: string[]; delay: number }) {
    return (
        <span>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay + i * 0.15, duration: 0.4 }}
                    className="inline-block mr-[0.3em]"
                >
                    {word}
                </motion.span>
            ))}
        </span>
    );
}

export function AudioLoadingScreen({ paperTitle, jobId, onAudioReady, onError, onBack }: AudioLoadingScreenProps) {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showTimeout, setShowTimeout] = useState(false);
    const startTime = useRef(Date.now());
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Estimated time remaining
    const elapsed = (Date.now() - startTime.current) / 1000;
    const estimatedTotal = progress > 5 ? (elapsed / progress) * 100 : 0;
    const remaining = Math.max(0, Math.ceil((estimatedTotal - elapsed) / 60));

    useEffect(() => {
        // Poll for progress
        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://papercast-production.up.railway.app'}/api/audio/progress/${jobId}`);
                if (!res.ok) {
                    // Job might not be ready yet, keep polling
                    return;
                }
                const data = await res.json();

                setProgress(data.progress || 0);


                if (data.status === 'complete' && data.url) {
                    if (pollRef.current) clearInterval(pollRef.current);

                    // Preload the audio file using absolute backend URL
                    const fullAudioUrl = `${import.meta.env.VITE_BACKEND_URL || 'https://papercast-production.up.railway.app'}${data.url}`;
                    const audio = new Audio(fullAudioUrl);
                    audio.preload = 'auto';

                    audio.addEventListener('canplaythrough', () => {
                        onAudioReady(fullAudioUrl);
                    }, { once: true });

                    audio.addEventListener('error', () => {
                        // Even if preload fails, still navigate with the URL
                        onAudioReady(fullAudioUrl);
                    }, { once: true });

                    audio.load();
                }

                if (data.status === 'error') {
                    if (pollRef.current) clearInterval(pollRef.current);
                    setErrorMsg(data.error || 'Audio generation failed. Please try again.');
                }
            } catch {
                // Network error, keep polling
            }
        }, 2000);

        // 5-minute timeout
        const timeout = setTimeout(() => setShowTimeout(true), 5 * 60 * 1000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            clearTimeout(timeout);
        };
    }, [jobId, onAudioReady]);

    const handleContinueAnyway = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        navigate('/listen');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
                style={{ background: '#0A0A0F' }}
            >
                {/* Top Section — Logo & Paper Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-xl font-display font-bold text-white mb-2">
                        <span className="text-brand-primary">Paper</span>Cast
                    </h2>
                    <p className="text-brand-muted text-sm max-w-md mx-auto truncate">{paperTitle}</p>
                </motion.div>

                {/* Center Section — Animated Quote */}
                {!errorMsg && (
                    <div className="text-center mb-16 relative">
                        {/* Violet glow background */}
                        <div
                            className="absolute inset-0 -m-20 rounded-full blur-[80px] opacity-20 pointer-events-none"
                            style={{ background: 'radial-gradient(circle, #6C63FF 0%, transparent 70%)' }}
                        />

                        <motion.div
                            animate={{
                                textShadow: [
                                    '0 0 30px rgba(108,99,255,0.3)',
                                    '0 0 50px rgba(108,99,255,0.5)',
                                    '0 0 30px rgba(108,99,255,0.3)',
                                ],
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative z-10"
                        >
                            <p className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight">
                                <AnimatedLine words={['Slow', 'is', 'Smooth,']} delay={0.3} />
                            </p>
                            <p className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight mt-2">
                                <AnimatedLine words={['Smooth', 'is', 'Fast']} delay={1.0} />
                            </p>
                        </motion.div>
                    </div>
                )}

                {/* Error State */}
                {errorMsg && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full mb-12"
                    >
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center space-y-4">
                            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                            <p className="text-red-400 font-medium">Audio generation failed. Please try again.</p>
                            <p className="text-brand-muted text-xs">{errorMsg}</p>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    onClick={onError}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold transition-all"
                                >
                                    <RotateCcw className="w-4 h-4" /> Try Again
                                </button>
                                <button
                                    onClick={onBack}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-border hover:border-brand-muted text-brand-muted hover:text-white text-sm font-medium transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Editor
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Progress Section */}
                {!errorMsg && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="max-w-md w-full space-y-4"
                    >
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-[#1E1E2E] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, #6C63FF, #8b84ff)',
                                }}
                                initial={{ width: '0%' }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>

                        {/* Progress Text */}
                        <div className="flex items-center justify-between">
                            <p className="text-brand-muted text-xs font-mono">
                                {getStatusText(progress)}
                            </p>
                            <p className="text-brand-muted text-xs font-mono font-bold">
                                {progress}% complete
                            </p>
                        </div>

                        {/* Estimated Time */}
                        <div className="text-center space-y-2 pt-4">
                            {remaining > 0 && progress > 5 && progress < 100 && (
                                <p className="text-brand-muted text-xs">
                                    ~{remaining} {remaining === 1 ? 'minute' : 'minutes'} remaining
                                </p>
                            )}
                            <p className="text-brand-muted/60 text-[11px]">
                                Your podcast will play automatically when ready
                            </p>

                            {/* Animated dots */}
                            <div className="flex items-center justify-center gap-1.5 pt-2">
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-brand-primary/60"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Timeout Warning */}
                        {showTimeout && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center pt-4 space-y-2"
                            >
                                <p className="text-yellow-400 text-xs">This is taking longer than expected...</p>
                                <button
                                    onClick={handleContinueAnyway}
                                    className="text-brand-primary hover:underline text-xs font-medium"
                                >
                                    Continue Anyway →
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
