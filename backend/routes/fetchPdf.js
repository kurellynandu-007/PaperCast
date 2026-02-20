import express from 'express';
const router = express.Router();

/**
 * Proxy endpoint to fetch a remote PDF and stream it to the frontend,
 * bypassing browser CORS restrictions on external PDF downloads.
 * GET /api/fetch-pdf?url=<encodedPdfUrl>
 */
router.get('/', async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing url query parameter' });
    }

    // Simple safety check — only allow HTTP(S) PDF links
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (PaperCast; research tool)'
            },
            follow: 10
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Remote fetch failed: ${response.statusText}` });
        }

        const contentType = response.headers.get('content-type') || 'application/pdf';
        res.set('Content-Type', contentType);
        res.set('Content-Disposition', 'inline; filename="paper.pdf"');

        // Stream binary PDF data back to the client
        response.body.pipe(res);
    } catch (error) {
        console.error('[fetch-pdf proxy] Error:', error);
        res.status(500).json({ error: 'Failed to fetch PDF' });
    }
});

export default router;
