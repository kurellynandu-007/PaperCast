import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { Transformation } from '../data/transformations';

interface TransformationModalProps {
    transformation?: Transformation | null;
    onSave: (t: Transformation) => void;
    onClose: () => void;
}

const EMPTY: Transformation = {
    name: '',
    title: '',
    description: '',
    systemPrompt: '',
    isDefault: false,
};

export function TransformationModal({ transformation, onSave, onClose }: TransformationModalProps) {
    const [form, setForm] = useState<Transformation>(transformation ?? EMPTY);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isEditing = !!transformation;

    function validate() {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Name is required';
        else if (/\s/.test(form.name)) e.name = 'No spaces allowed — use_underscores';
        if (!form.title.trim()) e.title = 'Title is required';
        if (!form.systemPrompt.trim()) e.systemPrompt = 'System prompt is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSave() {
        if (!validate()) return;
        onSave(form);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#12121A] border border-brand-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-primary" />
                        <h2 className="font-display font-bold text-lg">
                            {isEditing ? 'Edit Transformation' : 'Create Transformation'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-brand-muted tracking-widest uppercase mb-1.5">Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value.replace(/\s/g, '_') }))}
                            placeholder="unique_identifier (no spaces)"
                            disabled={isEditing && transformation?.isDefault}
                            className="w-full px-4 py-3 bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl text-brand-text placeholder-brand-muted text-sm outline-none transition-colors disabled:opacity-50"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-brand-muted tracking-widest uppercase mb-1.5">Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Display name (e.g. Deep Dive)"
                            className="w-full px-4 py-3 bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl text-brand-text placeholder-brand-muted text-sm outline-none transition-colors"
                        />
                        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-brand-muted tracking-widest uppercase mb-1.5">Description</label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="One-line description of this style"
                            className="w-full px-4 py-3 bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl text-brand-text placeholder-brand-muted text-sm outline-none transition-colors"
                        />
                    </div>

                    {/* System Prompt */}
                    <div>
                        <label className="block text-xs font-bold text-brand-muted tracking-widest uppercase mb-1.5">System Prompt</label>
                        <textarea
                            value={form.systemPrompt}
                            onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
                            placeholder="Write the prompt that tells the AI how to approach the paper..."
                            rows={10}
                            className="w-full px-4 py-3 bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl text-brand-text placeholder-brand-muted text-sm outline-none transition-colors resize-none font-mono leading-relaxed"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        />
                        {errors.systemPrompt && <p className="text-red-400 text-xs mt-1">{errors.systemPrompt}</p>}
                        <p className="text-brand-muted text-xs mt-1.5">
                            Prompts should describe how the AI should process the paper into a podcast script.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-border flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-brand-muted hover:text-white border border-brand-border hover:border-brand-muted transition-colors text-sm font-medium">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-[#5b54e5] text-white text-sm font-semibold transition-all shadow-[0_0_15px_rgba(108,99,255,0.3)] hover:shadow-[0_0_20px_rgba(108,99,255,0.5)]"
                    >
                        {isEditing ? 'Save Changes' : 'Create Transformation'}
                    </button>
                </div>
            </div>
        </div>
    );
}
