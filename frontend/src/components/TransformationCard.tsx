import { CheckCircle2, Lock, Pencil } from 'lucide-react';
import type { Transformation } from '../data/transformations';

interface TransformationCardProps {
    transformation: Transformation;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: () => void;
}

const ICONS: Record<string, string> = {
    standard_podcast: '🎙️',
    eli5_podcast: '🧒',
    deep_dive: '🔬',
    key_insights: '⚡',
    debate_style: '⚖️',
};

export function TransformationCard({ transformation, isSelected, onSelect, onEdit }: TransformationCardProps) {
    return (
        <div
            onClick={onSelect}
            className={`relative group cursor-pointer rounded-xl border p-4 transition-all duration-200 ${isSelected
                    ? 'border-brand-primary bg-brand-primary/10 shadow-[0_0_15px_rgba(108,99,255,0.2)]'
                    : 'border-brand-border bg-brand-bg hover:border-brand-muted hover:bg-[#15151F]'
                }`}
        >
            {/* Selected indicator */}
            {isSelected && (
                <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                </div>
            )}

            <div className="flex items-start gap-3 pr-6">
                <span className="text-xl flex-shrink-0 mt-0.5">
                    {ICONS[transformation.name] ?? '✨'}
                </span>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-brand-text'}`}>
                            {transformation.title}
                        </h3>
                        {transformation.isDefault && (
                            <Lock className="w-3 h-3 text-brand-muted flex-shrink-0" />
                        )}
                    </div>
                    <p className={`text-xs leading-snug mt-0.5 ${isSelected ? 'text-white/70' : 'text-brand-muted'}`}>
                        {transformation.description}
                    </p>
                </div>
            </div>

            {/* Edit button */}
            <button
                onClick={e => { e.stopPropagation(); onEdit(); }}
                className="absolute bottom-3 right-3 p-1 rounded text-brand-muted hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-all"
                title="Edit"
            >
                <Pencil className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
