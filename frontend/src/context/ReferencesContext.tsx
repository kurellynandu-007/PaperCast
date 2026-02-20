import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface Reference {
    id: string;
    title: string;
    authors: { name: string }[];
    year: number | null;
    arxivUrl: string;
    pdfUrl: string | null;
    source: string;
    addedAt: string;
    usedAs: 'primary' | 'secondary' | 'debate';
}

interface ReferencesContextType {
    references: Reference[];
    addReference: (paper: {
        id?: string;
        arxivId?: string;
        title: string;
        authors?: { name: string }[];
        year?: number | null;
        arxivUrl?: string;
        pdfUrl?: string | null;
        source?: string;
        usedAs: 'primary' | 'secondary' | 'debate';
    }) => void;
}

const ReferencesContext = createContext<ReferencesContextType | null>(null);

export function ReferencesProvider({ children }: { children: ReactNode }) {
    const [references, setReferences] = useState<Reference[]>([]);

    const addReference = (paper: {
        id?: string;
        arxivId?: string;
        title: string;
        authors?: { name: string }[];
        year?: number | null;
        arxivUrl?: string;
        pdfUrl?: string | null;
        source?: string;
        usedAs: 'primary' | 'secondary' | 'debate';
    }) => {
        const paperId = paper.id || paper.arxivId;
        if (!paperId) return;

        setReferences(prev => {
            const exists = prev.find(p => p.id === paperId);
            if (exists) return prev;
            return [...prev, {
                id: paperId,
                title: paper.title,
                authors: paper.authors || [],
                year: paper.year ?? null,
                arxivUrl: paper.arxivUrl || `https://arxiv.org/abs/${paperId}`,
                pdfUrl: paper.pdfUrl || null,
                source: paper.source || 'arxiv',
                addedAt: new Date().toISOString(),
                usedAs: paper.usedAs,
            }];
        });
    };

    return (
        <ReferencesContext.Provider value={{ references, addReference }}>
            {children}
        </ReferencesContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useReferences() {
    const context = useContext(ReferencesContext);
    if (!context) {
        throw new Error('useReferences must be used within a ReferencesProvider');
    }
    return context;
}
