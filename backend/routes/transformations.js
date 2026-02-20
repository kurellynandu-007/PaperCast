import express from 'express';

const router = express.Router();

// In-memory store for custom transformations (can swap for Supabase later)
const customTransformations = [];

// GET all custom transformations
router.get('/', (req, res) => {
    res.json({ transformations: customTransformations });
});

// POST create new custom transformation
router.post('/', (req, res) => {
    const { name, title, description, systemPrompt } = req.body;

    if (!name || !title || !systemPrompt) {
        return res.status(400).json({ error: 'name, title, and systemPrompt are required' });
    }

    if (customTransformations.find(t => t.name === name)) {
        return res.status(409).json({ error: 'A transformation with that name already exists' });
    }

    const t = { name, title, description: description || '', systemPrompt, isDefault: false, createdAt: new Date().toISOString() };
    customTransformations.push(t);
    res.status(201).json(t);
});

// PUT update transformation
router.put('/:name', (req, res) => {
    const idx = customTransformations.findIndex(t => t.name === req.params.name);
    if (idx === -1) return res.status(404).json({ error: 'Transformation not found' });

    customTransformations[idx] = { ...customTransformations[idx], ...req.body };
    res.json(customTransformations[idx]);
});

// DELETE transformation
router.delete('/:name', (req, res) => {
    const idx = customTransformations.findIndex(t => t.name === req.params.name);
    if (idx === -1) return res.status(404).json({ error: 'Transformation not found' });

    customTransformations.splice(idx, 1);
    res.json({ success: true });
});

export default router;
