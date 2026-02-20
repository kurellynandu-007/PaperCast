export interface Transformation {
    name: string;
    title: string;
    description: string;
    systemPrompt: string;
    isDefault: boolean;
}

export const DEFAULT_TRANSFORMATIONS: Transformation[] = [
    {
        name: 'standard_podcast',
        title: 'Standard Podcast',
        description: 'Balanced explanation with natural conversation',
        systemPrompt: `You are a podcast script writer. Convert this research paper into a natural, engaging two-host conversation. Alex explains concepts clearly, Sam asks curious questions. Balance depth with accessibility.`,
        isDefault: true,
    },
    {
        name: 'eli5_podcast',
        title: "Explain Like I'm 5",
        description: 'Super simple, no jargon, beginner friendly',
        systemPrompt: `You are a podcast script writer for complete beginners. Explain every concept in the simplest possible terms. Use everyday analogies and avoid all technical jargon. Alex and Sam should sound like two curious friends, not experts.`,
        isDefault: true,
    },
    {
        name: 'deep_dive',
        title: 'Deep Dive',
        description: 'Technical, detailed, for researchers',
        systemPrompt: `You are a podcast script writer for expert researchers. Go deep into methodology, statistical significance, limitations, and implications. Alex and Sam should challenge each other's interpretations and discuss edge cases.`,
        isDefault: true,
    },
    {
        name: 'key_insights',
        title: 'Key Insights Only',
        description: 'Short, punchy, just the most important findings',
        systemPrompt: `You are a podcast script writer focused on impact. Extract only the 3-5 most important findings from this paper. Keep the conversation short, punchy, and focused purely on what matters most and why it matters.`,
        isDefault: true,
    },
    {
        name: 'debate_style',
        title: 'Critical Analysis',
        description: "Alex and Sam challenge and debate the paper's claims",
        systemPrompt: `You are a podcast script writer. Alex presents the paper's claims enthusiastically. Sam plays devil's advocate, questioning methodology, sample sizes, and conclusions critically. Create intellectual tension and balanced critique.`,
        isDefault: true,
    },
];
