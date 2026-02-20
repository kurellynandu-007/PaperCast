import { Play } from 'lucide-react';

interface ChapterPillProps {
    title: string;
    timestamp: string;
    isActive?: boolean;
    onClick?: () => void;
}

export function ChapterPill({ title, timestamp, isActive = false, onClick }: ChapterPillProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-full border transition-all whitespace-nowrap flex-shrink-0
        ${isActive
                    ? 'bg-brand-primary/10 border-brand-primary text-white'
                    : 'bg-brand-card border-brand-border text-brand-muted hover:border-brand-muted hover:text-white'
                }
      `}
        >
            <div className={`flex items-center justify-center
        ${isActive ? 'text-brand-primary' : 'text-brand-muted hidden group-hover:block'}
      `}>
                <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-mono text-xs opacity-70">{timestamp}</span>
            <span className="font-medium text-sm">{title}</span>
        </button>
    );
}
