import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, VolumeX, Volume2, Repeat } from 'lucide-react';

interface AudioPlayerProps {
    audioUrl: string;
    title: string;
    duration?: string;
    audioRef?: React.RefObject<HTMLAudioElement | null>;
    onTimeUpdate?: (currentTime: number) => void;
}

export function AudioPlayer({ audioUrl, title, duration = "00:00", audioRef: externalAudioRef, onTimeUpdate }: AudioPlayerProps) {
    const internalRef = useRef<HTMLAudioElement | null>(null);
    const audioRef = externalAudioRef ?? internalRef;
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isLooping, setIsLooping] = useState(false);



    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback failed", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration;
            setProgress((current / total) * 100 || 0);
            onTimeUpdate?.(current);
        }
    };

    const handleAudioEnded = () => {
        if (!isLooping) {
            setIsPlaying(false);
            setProgress(0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setProgress(value);
        if (audioRef.current && audioRef.current.duration) {
            audioRef.current.currentTime = (value / 100) * audioRef.current.duration;
        }
    };

    const skip = (seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime += seconds;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setVolume(value);
        setIsMuted(value === 0);
        if (audioRef.current) audioRef.current.volume = value;
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        if (audioRef.current) {
            audioRef.current.volume = newMutedState ? 0 : volume;
        }
    };

    const changeSpeed = (speed: number) => {
        setPlaybackRate(speed);
        if (audioRef.current) audioRef.current.playbackRate = speed;
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const currentTimeStr = audioRef.current ? formatTime(audioRef.current.currentTime) : "00:00";

    return (
        <div className="w-full bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-2xl relative">
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnded}
                loop={isLooping}
                className="hidden"
            />

            {/* Abstract Waveform Viz Placeholder */}
            <div className="h-48 w-full bg-[#12121A] flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-card to-transparent z-10" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-primary via-brand-bg to-brand-bg transition-opacity duration-1000" />

                {/* Animated bars */}
                <div className="flex items-end justify-center gap-1 h-24 z-0 px-8 w-full">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 sm:w-3 rounded-t-sm bg-brand-primary transition-all duration-300 ease-in-out
                ${isPlaying ? 'animate-pulse' : 'opacity-40'}
              `}
                            style={{
                                height: `${isPlaying ? Math.max(10, Math.random() * 100) : 10}%`,
                                animationDelay: `${i * 0.05}s`,
                                opacity: isPlaying ? 0.6 + Math.random() * 0.4 : 0.3
                            }}
                        />
                    ))}
                </div>

                <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-brand-primary to-brand-secondary opacity-80" />
                    <div>
                        <div className="text-xs text-brand-muted font-mono mb-0.5">PaperCast Series</div>
                        <div className="text-sm font-medium text-white max-w-[200px] truncate">{title}</div>
                    </div>
                </div>

                <div className="absolute top-4 right-4 z-20 font-mono text-xs text-brand-muted bg-brand-bg/60 backdrop-blur-sm px-2 py-1 rounded">
                    {currentTimeStr} / {duration}
                </div>
            </div>

            <div className="p-6 relative z-20 bg-brand-card">
                {/* Progress Bar */}
                <div className="mb-6 relative group cursor-pointer">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="w-full absolute inset-0 opacity-0 cursor-pointer z-30"
                    />
                    <div className="h-1.5 w-full bg-brand-bg rounded-full absolute inset-y-0 my-auto z-10 transition-all group-hover:h-2">
                        <div
                            className="h-full bg-brand-primary shadow-[0_0_10px_rgba(108,99,255,0.8)] relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow translate-x-1/2" />
                        </div>
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

                    {/* Speed Controls */}
                    <div className="flex items-center gap-1.5 order-2 sm:order-1">
                        {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                            <button
                                key={speed}
                                onClick={() => changeSpeed(speed)}
                                className={`text-[10px] font-mono px-2 py-1 rounded-full border transition-colors
                  ${playbackRate === speed
                                        ? 'border-brand-primary text-brand-primary bg-brand-primary/10'
                                        : 'border-brand-border text-brand-muted hover:border-brand-muted'
                                    }
                `}
                            >
                                {speed}x
                            </button>
                        ))}
                    </div>

                    {/* Main Playback Controls */}
                    <div className="flex items-center gap-6 order-1 sm:order-2">
                        <button
                            onClick={() => skip(-15)}
                            className="text-brand-muted hover:text-white transition-colors"
                            title="Reverse 15s"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center hover:scale-105 transition-transform shadow-[0_4px_20px_rgba(108,99,255,0.4)]"
                        >
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </button>
                        <button
                            onClick={() => skip(15)}
                            className="text-brand-muted hover:text-white transition-colors"
                            title="Skip 15s"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Volume & Loop */}
                    <div className="flex items-center gap-4 order-3 sm:order-3 min-w-[120px]">
                        <button onClick={toggleMute} className="text-brand-muted hover:text-white transition-colors w-5">
                            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-16 h-1 bg-brand-border rounded appearance-none cursor-pointer accent-brand-muted"
                        />
                        <button
                            onClick={() => setIsLooping(!isLooping)}
                            className={`transition-colors ${isLooping ? 'text-brand-primary' : 'text-brand-muted hover:text-white'}`}
                        >
                            <Repeat className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
