import { useState } from 'react';
import { Edit2, RefreshCw, Trash2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Dialogue {
    speaker: 'alex' | 'sam' | string;
    timestamp: string;
    text: string;
}

interface DialogueCardProps {
    dialogue: Dialogue;
    onUpdate: (newText: string) => void;
    onRegenerate: () => void;
    onDelete: () => void;
}

export function DialogueCard({ dialogue, onUpdate, onRegenerate, onDelete }: DialogueCardProps) {
    const isAlex = dialogue.speaker.toLowerCase() === 'alex';
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(dialogue.text);

    const handleSave = () => {
        onUpdate(editText);
        setIsEditing(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex w-full mb-6 ${isAlex ? 'justify-start' : 'justify-end'}`}
        >
            <div
                className={`relative max-w-full sm:max-w-[85%] md:max-w-[75%] rounded-2xl p-5 border-l-4 shadow-lg
          ${isAlex
                        ? 'bg-brand-accent-alex border-brand-primary text-left'
                        : 'bg-brand-accent-sam border-brand-secondary text-right'
                    }
        `}
            >
                <div className={`flex items-center gap-3 mb-3 ${!isAlex && 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
            ${isAlex ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-secondary/20 text-brand-secondary'}
          `}>
                        {isAlex ? 'A' : 'S'}
                    </div>
                    <div className={`flex flex-col ${!isAlex && 'items-end'}`}>
                        <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                            {isAlex ? 'Alex — Explainer' : 'Sam — Questioner'}
                        </span>
                        <span className="text-xs text-brand-muted font-mono">{dialogue.timestamp}</span>
                    </div>
                </div>

                <div className={`text-brand-text leading-relaxed ${isEditing ? 'mb-4' : 'mb-6'}`}>
                    {isEditing ? (
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-brand-bg/50 border border-brand-border rounded-lg p-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary min-h-[100px] resize-y"
                            autoFocus
                        />
                    ) : (
                        <p className={!isAlex ? 'text-right' : ''}>{dialogue.text}</p>
                    )}
                </div>

                <div className={`flex items-center gap-3 md:gap-4 text-xs font-medium text-brand-muted flex-wrap ${!isAlex && 'justify-end flex-row-reverse'}`}>
                    <span className="font-mono bg-brand-bg/50 px-2 py-1 rounded">
                        {dialogue.text.split(' ').length} words
                    </span>

                    <div className="flex-1 min-w-[20px]" />

                    {isEditing ? (
                        <button
                            onClick={handleSave}
                            className={`flex items-center gap-1.5 transition-colors ${isAlex ? 'hover:text-brand-primary' : 'hover:text-brand-secondary'}`}
                        >
                            <Check className="w-3.5 h-3.5" /> SAVE
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className={`flex items-center gap-1.5 transition-colors ${isAlex ? 'hover:text-brand-primary' : 'hover:text-brand-secondary'}`}
                        >
                            <Edit2 className="w-3.5 h-3.5" /> EDIT
                        </button>
                    )}

                    <button
                        onClick={onRegenerate}
                        className={`flex items-center gap-1.5 transition-colors ${isAlex ? 'hover:text-brand-primary' : 'hover:text-brand-secondary'}`}
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> REGENERATE
                    </button>

                    <button
                        onClick={onDelete}
                        className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> DELETE
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
