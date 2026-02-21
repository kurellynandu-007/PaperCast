import express from 'express';
const router = express.Router();

/**
 * Proxy endpoint to fetch a remote PDF and stream it to the frontend,
 * bypassing browser CORS restrictions on external PDF downloads.
 * 
 * Smart URL handling:
 *  - Direct PDF links → fetch directly
 *  - arXiv abs links → convert to /pdf/ links
 *  - HTML pages → detect and reject with helpful error
 * 
 * GET /api/fetch-pdf?url=<encodedPdfUrl>
 */
router.get('/', async (req, res) => {
    let { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing url query parameter' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    // ── Smart URL normalization ──────────────────────────────────────────
    // Convert arXiv abs URLs to PDF URLs
    if (url.includes('arxiv.org/abs/')) {
        url = url.replace('/abs/', '/pdf/');
        if (!url.endsWith('.pdf')) url += '.pdf';
    }
    // Ensure arXiv PDF URLs end with .pdf
    if (url.includes('arxiv.org/pdf/') && !url.endsWith('.pdf')) {
        url += '.pdf';
    }

    // List of URL patterns to try in order
    const urlsToTry = [url];

    // For non-PDF URLs, try common PDF path patterns
    if (!url.toLowerCase().endsWith('.pdf') && !url.includes('/pdf/')) {
        // Try appending /pdf to the URL
        if (url.includes('doi.org/')) {
            // For DOI URLs, try Unpaywall redirect
            urlsToTry.push(`https://api.unpaywall.org/v2/${encodeURIComponent(url.replace('https://doi.org/', ''))}?email=contact@papercast.app`);
        }
    }

    const fetchOptions = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/pdf, application/octet-stream, */*'
        },
        redirect: 'follow',
        follow: 15,
        timeout: 30000,
    };

    for (const tryUrl of urlsToTry) {
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(tryUrl, fetchOptions);

            if (!response.ok) {
                console.warn(`[fetch-pdf] ${tryUrl} returned ${response.status}`);
                continue;
            }

            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            const buffer = await response.arrayBuffer();
            const buf = Buffer.from(buffer);

            // ── Validate it's actually a PDF ─────────────────────────────
            // PDF files start with %PDF
            const isPdf = buf.length > 4 && buf.slice(0, 5).toString('ascii').startsWith('%PDF');
            const isContentTypePdf = contentType.includes('pdf') || contentType.includes('octet-stream');

            if (isPdf || (isContentTypePdf && buf.length > 1000)) {
                res.set('Content-Type', 'application/pdf');
                res.set('Content-Disposition', 'inline; filename="paper.pdf"');
                res.set('Content-Length', buf.length);
                return res.send(buf);
            }

            // If it's HTML, the URL was a landing page, not a PDF
            if (contentType.includes('html') || buf.slice(0, 15).toString('ascii').includes('<!')) {
                console.warn(`[fetch-pdf] ${tryUrl} returned HTML, not PDF`);
                continue; // Try next URL
            }

            // For other content types that aren't HTML and are large enough, try to serve them
            if (buf.length > 10000) {
                res.set('Content-Type', 'application/pdf');
                res.set('Content-Disposition', 'inline; filename="paper.pdf"');
                res.set('Content-Length', buf.length);
                return res.send(buf);
            }

            console.warn(`[fetch-pdf] ${tryUrl} returned unknown content (${contentType}, ${buf.length} bytes)`);
            continue;
        } catch (error) {
            console.error(`[fetch-pdf] Error fetching ${tryUrl}:`, error.message);
            continue;
        }
    }

    return res.status(422).json({ error: 'Could not download PDF. The link may point to a web page instead of a direct PDF file.' });
});

export default router;
