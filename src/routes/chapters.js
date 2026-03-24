import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

// GET /api/chapters
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hts_chapters')
      .select('*')
      .order('chapter');

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error fetching chapters:', err.message);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// GET /api/chapters/:code
router.get('/:code', async (req, res) => {
  try {
    const chapter = req.params.code.padStart(2, '0');

    const { data, error } = await supabase
      .from('hts_chapters')
      .select('*')
      .eq('chapter', chapter)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Chapter not found' });

    res.json(data);
  } catch (err) {
    console.error('Error fetching chapter:', err.message);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
});

export default router;