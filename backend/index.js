import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: ["https://paper-cast-alpha.vercel.app", "http://localhost:5173"],
    credentials: true
}));
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


// ── Paper search: BULLETPROOF – arXiv + Semantic Scholar + OpenAlex ────────────
import { XMLParser } from 'fast-xml-parser';

// ── In-memory cache (10-minute TTL) ──
const searchCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(key) {
    const entry = searchCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) { searchCache.delete(key); return null; }
    return entry.data;
}

function setCache(key, data) {
    searchCache.set(key, { data, ts: Date.now() });
    if (searchCache.size > 500) {
        const oldest = searchCache.keys().next().value;
        searchCache.delete(oldest);
    }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Rate-limit tracker for Semantic Scholar ──
let s2LastCall = 0;
const S2_MIN_INTERVAL = 1100; // Semantic Scholar allows ~1 req/sec

// ── SOURCE 1: arXiv ──────────────────────────────────────────────────────────
async function searchArxiv(query) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const words = query.trim().split(/\s+/);
        const searchField = words.length <= 2 ? 'ti' : 'all';
        const res = await fetch(
            `https://export.arxiv.org/api/query?search_query=${searchField}:${encodeURIComponent(query)}&start=0&max_results=10&sortBy=relevance&sortOrder=descending`,
            { signal: controller.signal, headers: { 'User-Agent': 'PaperCast/1.0 (mailto:contact@papercast.app)' } }
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
        }).filter(p => p.pdfUrl && p.title);
    } catch (err) {
        clearTimeout(timeout);
        console.warn('[paper-search] arXiv failed:', err.message);
        return [];
    }
}

// ── SOURCE 2: Semantic Scholar (with retry + rate-limit respect) ──────────────
async function searchSemanticScholar(query) {
    // Respect rate limit
    const now = Date.now();
    const wait = S2_MIN_INTERVAL - (now - s2LastCall);
    if (wait > 0) await sleep(wait);

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            s2LastCall = Date.now();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(
                `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=title,abstract,authors,year,openAccessPdf&limit=10`,
                { signal: controller.signal, headers: { 'User-Agent': 'PaperCast/1.0' } }
            );
            clearTimeout(timeout);
            if (res.status === 429) {
                const waitTime = Math.pow(2, attempt) * 1500;
                console.warn(`[paper-search] S2 rate-limited, retry in ${waitTime}ms (${attempt + 1}/3)`);
                await sleep(waitTime);
                continue;
            }
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
            console.warn(`[paper-search] S2 attempt ${attempt + 1} error:`, err.message);
            if (attempt < 2) await sleep(1000);
        }
    }
    return [];
}

// ── SOURCE 3: OpenAlex (FREE, no API key, no rate limits) ────────────────────
async function searchOpenAlex(query) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(
            `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=10&select=id,title,authorships,publication_year,doi,open_access,abstract_inverted_index&mailto=contact@papercast.app`,
            { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.results?.length) return [];
        return data.results.map(w => {
            // Reconstruct abstract from inverted index
            let abstract = '';
            if (w.abstract_inverted_index) {
                const words = [];
                for (const [word, positions] of Object.entries(w.abstract_inverted_index)) {
                    for (const pos of positions) {
                        words[pos] = word;
                    }
                }
                abstract = words.join(' ');
            }
            // Extract PDF URL
            let pdfUrl = null;
            if (w.open_access?.oa_url) {
                pdfUrl = w.open_access.oa_url;
            } else if (w.doi) {
                // Many DOI papers have arxiv versions
                pdfUrl = null;
            }
            const oaId = w.id?.replace('https://openalex.org/', '') || '';
            return {
                id: oaId,
                title: w.title || '',
                authors: (w.authorships || []).slice(0, 5).map(a => ({ name: a.author?.display_name || 'Unknown' })),
                year: w.publication_year || null,
                abstract: abstract.substring(0, 500),
                pdfUrl,
                source: 'openalex',
                hasFreePdf: !!pdfUrl,
            };
        }).filter(p => p.title);
    } catch (err) {
        console.warn('[paper-search] OpenAlex failed:', err.message);
        clearTimeout(timeout);
        return [];
    }
}

// ── Deduplicate results by title similarity ──────────────────────────────────
function deduplicatePapers(papers) {
    const seen = new Map();
    return papers.filter(p => {
        const key = p.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
        if (seen.has(key)) return false;
        seen.set(key, true);
        return true;
    });
}

// ── MAIN ENDPOINT: Never fails, always returns results or empty array ────────
app.get('/api/paper-search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    const cacheKey = query.trim().toLowerCase();
    const cached = getCached(cacheKey);
    if (cached) {
        console.log(`[paper-search] Cache hit for "${cacheKey}"`);
        return res.json(cached);
    }

    // Run ALL sources in parallel – use whatever comes back first/best
    const [arxivResult, s2Result, oaResult] = await Promise.allSettled([
        searchArxiv(query),
        searchSemanticScholar(query),
        searchOpenAlex(query),
    ]);

    const arxivPapers = arxivResult.status === 'fulfilled' ? arxivResult.value : [];
    const s2Papers = s2Result.status === 'fulfilled' ? s2Result.value : [];
    const oaPapers = oaResult.status === 'fulfilled' ? oaResult.value : [];

    console.log(`[paper-search] Results: arXiv=${arxivPapers.length}, S2=${s2Papers.length}, OpenAlex=${oaPapers.length}`);

    // Priority: arXiv > Semantic Scholar > OpenAlex, but merge all for best coverage
    let allPapers = [];
    let source = 'none';

    if (arxivPapers.length > 0) {
        allPapers = [...arxivPapers];
        source = 'arxiv';
    }
    if (s2Papers.length > 0) {
        allPapers = [...allPapers, ...s2Papers];
        source = allPapers.length > arxivPapers.length ? 'multiple' : source;
    }
    if (oaPapers.length > 0) {
        allPapers = [...allPapers, ...oaPapers];
        if (source === 'none') source = 'openalex';
    }

    // Deduplicate and limit to 10
    allPapers = deduplicatePapers(allPapers).slice(0, 10);

    const result = { papers: allPapers, source };

    // Cache even empty results for 2 minutes to prevent hammering
    if (allPapers.length > 0) {
        setCache(cacheKey, result);
    } else {
        // Short cache for empty results
        searchCache.set(cacheKey, { data: result, ts: Date.now() - (CACHE_TTL - 2 * 60 * 1000) });
    }

    // NEVER return an error status – always 200 with papers array (may be empty)
    return res.json(result);
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PaperCast API is running' });
});

app.get('/', (req, res) => {
    res.send('PaperCast Backend is running. Please access the web application at https://paper-cast-alpha.vercel.app/');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
