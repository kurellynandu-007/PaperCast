import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import uploadRoutes from './routes/upload.js';
import generateRoutes from './routes/generate.js';
import audioRoutes from './routes/audio.js';
import fetchPdfRoutes from './routes/fetchPdf.js';
import transformationsRoutes from './routes/transformations.js';
import debateScoreRoutes from './routes/debateScore.js';
import pdfSummaryRoutes from './routes/pdfSummary.js';

app.use('/api/upload', uploadRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/fetch-pdf', fetchPdfRoutes);
app.use('/api/transformations', transformationsRoutes);
app.use('/api/debate-score', debateScoreRoutes);
app.use('/api/pdf-summary', pdfSummaryRoutes);


// ── Paper search: arXiv first, Semantic Scholar fallback ──────────────────────
import { XMLParser } from 'fast-xml-parser';

async function searchArxiv(query) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(
            `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=10`,
            { signal: controller.signal, headers: { 'User-Agent': 'PaperCast/1.0' } }
        );
        clearTimeout(timeout);
        if (!res.ok) return [];
        const xml = await res.text();
        const parser = new XMLParser({ isArray: (name) => name === 'entry' || name === 'author' });
        const parsed = parser.parse(xml);
        const entries = parsed?.feed?.entry;
        if (!entries || !Array.isArray(entries) || entries.length === 0) return [];
        return entries.map(e => {
            const idUrl = typeof e.id === 'string' ? e.id.trim() : '';
            const arxivId = idUrl.split('/abs/')[1] || idUrl.split('/').pop() || '';
            const authors = Array.isArray(e.author)
                ? e.author.map(a => (typeof a === 'object' ? a.name : a)).filter(Boolean)
                : e.author ? [typeof e.author === 'object' ? e.author.name : e.author] : [];
            const year = typeof e.published === 'string' ? e.published.substring(0, 4) : null;
            return {
                id: arxivId,
                title: (e.title || '').replace(/\s+/g, ' ').trim(),
                authors: authors.map(n => ({ name: n })),
                year: year ? parseInt(year) : null,
                abstract: (e.summary || '').replace(/\s+/g, ' ').trim(),
                pdfUrl: arxivId ? `https://arxiv.org/pdf/${arxivId}` : null,
                source: 'arxiv',
                hasFreePdf: true,
            };
        }).filter(p => p.pdfUrl);
    } catch (err) {
        clearTimeout(timeout);

        return [];
    }
}

async function searchSemanticScholar(query) {
    try {
        const res = await fetch(
            `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=title,abstract,authors,year,openAccessPdf&limit=10`,
            { headers: { 'User-Agent': 'PaperCast/1.0' } }
        );
        if (res.status === 429) throw new Error('rate_limited');
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.data?.length) return [];
        return data.data.map(p => ({
            id: p.paperId,
            title: p.title || '',
            authors: (p.authors || []).map(a => ({ name: a.name })),
            year: p.year || null,
            abstract: p.abstract || '',
            pdfUrl: p.openAccessPdf?.url || null,
            source: 'semantic_scholar',
            hasFreePdf: !!p.openAccessPdf?.url,
        }));
    } catch (err) {

        if (err.message === 'rate_limited') throw err;
        return [];
    }
}

app.get('/api/paper-search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Missing query' });
    try {
        // 1. Try arXiv first
        const arxivResults = await searchArxiv(query);
        if (arxivResults.length > 0) return res.json({ papers: arxivResults, source: 'arxiv' });

        // 2. Fallback to Semantic Scholar
        const s2Results = await searchSemanticScholar(query);
        return res.json({ papers: s2Results, source: 'semantic_scholar' });
    } catch (err) {
        if (err.message === 'rate_limited') {
            return res.status(429).json({ error: 'Search temporarily unavailable. Please try again in a moment.' });
        }
        console.error('[paper-search]', err);
        return res.status(500).json({ error: 'Search failed. Check your internet connection and try again.' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PaperCast API is running' });
});

app.get('/', (req, res) => {
    res.send('PaperCast Backend is running. Please access the web application at http://localhost:5173/');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
