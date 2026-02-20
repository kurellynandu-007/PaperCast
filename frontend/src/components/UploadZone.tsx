import { useState, useEffect } from 'react';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadZoneProps {
    label: string;
    onUpload: (file: File | null) => void;
    isDebateMode?: boolean;
    importedFile?: File | null;
}

export function UploadZone({ label, onUpload, isDebateMode = false, importedFile }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Sync externally imported file (from PaperSearch) into our local state
    useEffect(() => {
        if (importedFile) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFile(importedFile);
            setError(null);
        }
    }, [importedFile]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const validateAndSetFile = (selectedFile: File) => {
        if (selectedFile.type !== 'application/pdf') {
            setError('Please upload a valid PDF file');
            setFile(null);
            onUpload(null);
            return;
        }
        if (selectedFile.size > 50 * 1024 * 1024) {
            setError('File exceeds 50MB limit');
            setFile(null);
            onUpload(null);
            return;
        }

        setError(null);
        setFile(selectedFile);
        onUpload(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full">
            <div className="text-xs font-bold text-brand-muted tracking-widest mb-3 uppercase">
                {label}
            </div>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`相対 overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300
          ${isDragging
                        ? (isDebateMode ? 'border-brand-secondary bg-brand-secondary/5' : 'border-brand-primary bg-brand-primary/5')
                        : 'border-brand-border bg-brand-card hover:border-brand-muted'
                    }
          ${file ? '!border-solid !border-brand-border' : ''}
        `}
            >
                {!file ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${isDragging
                            ? (isDebateMode ? 'bg-brand-secondary/20 text-brand-secondary' : 'bg-brand-primary/20 text-brand-primary')
                            : 'bg-brand-bg text-brand-muted'
                            }`}>
                            <UploadCloud className="w-8 h-8" />
                        </div>

                        <h3 className="font-display font-medium text-lg text-brand-text mb-2">
                            Drop your PDF here
                        </h3>
                        <p className="text-brand-muted mb-6">
                            or <label className="text-brand-primary hover:underline cursor-pointer">
                                click to browse
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="application/pdf"
                                    onChange={handleFileInput}
                                />
                            </label>
                        </p>
                        <div className="text-xs text-brand-muted font-mono bg-brand-bg px-3 py-1.5 rounded-full">
                            PDF only · Max 50MB
                        </div>
                    </div>
                ) : (
                    <div className="p-8 flex items-center gap-4 bg-brand-card">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0">
                            <File className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-brand-text truncate">{file.name}</h4>
                            <p className="text-sm text-brand-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setFile(null); onUpload(null); setError(null); }}
                            className="p-2 text-brand-muted hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-0 left-0 right-0 bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 flex items-center justify-between text-sm z-20"
                        >
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                            <button onClick={e => { e.stopPropagation(); setError(null); }} className="p-1 hover:bg-white/20 rounded transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
