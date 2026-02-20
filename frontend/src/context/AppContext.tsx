import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Dialogue } from '../components/DialogueCard';
import { DEFAULT_TRANSFORMATIONS } from '../data/transformations';
import type { Transformation } from '../data/transformations';

interface AppState {
    sessionId: string | null;
    pdfTextPreview: string | null;
    config: {
        audience: string;
        length: string;
        focusAreas: string;
        style: string;
        introWrapup: boolean;
    };
    script: {
        title: string;
        totalWords: number;
        estimatedDuration: string;
        chapters: {
            id: string;
            title: string;
            dialogues: Dialogue[];
        }[];
    } | null;
    audioUrl: string | null;
    selectedTransformation: Transformation;
    customTransformations: Transformation[];
    sourcePapers: { title: string; id?: string; url?: string }[];
}

interface AppContextType extends AppState {
    setSessionId: (id: string | null) => void;
    setPdfTextPreview: (text: string | null) => void;
    setConfig: (config: AppState['config']) => void;
    setScript: (script: AppState['script']) => void;
    setAudioUrl: (url: string | null) => void;
    updateConfigField: <K extends keyof AppState['config']>(field: K, value: AppState['config'][K]) => void;
    setSelectedTransformation: (t: Transformation) => void;
    addCustomTransformation: (t: Transformation) => void;
    updateCustomTransformation: (name: string, t: Transformation) => void;
    deleteCustomTransformation: (name: string) => void;
    allTransformations: Transformation[];
    setSourcePapers: (papers: AppState['sourcePapers'] | ((prev: AppState['sourcePapers']) => AppState['sourcePapers'])) => void;
}

const defaultState: AppState = {
    sessionId: null,
    pdfTextPreview: null,
    config: {
        audience: 'student',
        length: 'medium',
        focusAreas: '',
        style: 'explain',
        introWrapup: true
    },
    script: null,
    audioUrl: null,
    selectedTransformation: DEFAULT_TRANSFORMATIONS[0],
    customTransformations: [],
    sourcePapers: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [sessionId, setSessionId] = useState<string | null>(defaultState.sessionId);
    const [pdfTextPreview, setPdfTextPreview] = useState<string | null>(defaultState.pdfTextPreview);
    const [config, setConfig] = useState<AppState['config']>(defaultState.config);
    const [script, setScript] = useState<AppState['script']>(defaultState.script);
    const [audioUrl, setAudioUrl] = useState<string | null>(defaultState.audioUrl);
    const [selectedTransformation, setSelectedTransformation] = useState<Transformation>(DEFAULT_TRANSFORMATIONS[0]);
    const [customTransformations, setCustomTransformations] = useState<Transformation[]>([]);
    const [sourcePapers, setSourcePapers] = useState<AppState['sourcePapers']>(defaultState.sourcePapers);

    const allTransformations = [...DEFAULT_TRANSFORMATIONS, ...customTransformations];

    const updateConfigField = <K extends keyof AppState['config']>(field: K, value: AppState['config'][K]) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const addCustomTransformation = (t: Transformation) => {
        setCustomTransformations(prev => [...prev, { ...t, isDefault: false }]);
    };

    const updateCustomTransformation = (name: string, t: Transformation) => {
        // For defaults, we store modified versions in custom overrides
        const isDefault = DEFAULT_TRANSFORMATIONS.some(d => d.name === name);
        if (isDefault) {
            // Store as an override; filter old override first
            setCustomTransformations(prev => [
                ...prev.filter(c => c.name !== name),
                { ...t, isDefault: false }
            ]);
        } else {
            setCustomTransformations(prev => prev.map(c => c.name === name ? { ...t, isDefault: false } : c));
        }
        // If editing the currently selected one, update selection
        if (selectedTransformation.name === name) {
            setSelectedTransformation(t);
        }
    };

    const deleteCustomTransformation = (name: string) => {
        setCustomTransformations(prev => prev.filter(c => c.name !== name));
        if (selectedTransformation.name === name) {
            setSelectedTransformation(DEFAULT_TRANSFORMATIONS[0]);
        }
    };

    return (
        <AppContext.Provider value={{
            sessionId, pdfTextPreview, config, script, audioUrl,
            selectedTransformation, customTransformations, allTransformations,
            setSessionId, setPdfTextPreview, setConfig, setScript, setAudioUrl,
            updateConfigField, setSelectedTransformation, addCustomTransformation,
            updateCustomTransformation, deleteCustomTransformation,
            sourcePapers, setSourcePapers
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
