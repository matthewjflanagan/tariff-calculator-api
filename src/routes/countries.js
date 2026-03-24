import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

// GET /api/countries
// GET /api/countries?region=Asia+Pacific
router.get('/', async (req, res) => {
  try {
    const { region } = req.query;

    let query = supabase
      .from('countries')
      .select('*')
      .order('region')
      .order('label');

    if (region) {
      query = query.eq('region', region);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error fetching countries:', err.message);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// GET /api/countries/:key
router.get('/:key', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('key', req.params.key)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Country not found' });

    res.json(data);
  } catch (err) {
    console.error('Error fetching country:', err.message);
    res.status(500).json({ error: 'Failed to fetch country' });
  }
});

export default router;