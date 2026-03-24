import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

// GET /api/bulletin
// Returns the current active rate bulletin with alerts and sources
router.get('/', async (req, res) => {
  try {
    // Get the active bulletin
    const { data: bulletin, error: bulletinError } = await supabase
      .from('rate_bulletin')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (bulletinError) throw bulletinError;
    if (!bulletin) return res.status(404).json({ error: 'No active bulletin found' });

    // Get alerts and sources in parallel
    const [alertsResult, sourcesResult] = await Promise.all([
      supabase
        .from('rate_bulletin_alerts')
        .select('*')
        .eq('bulletin_id', bulletin.id)
        .order('sort_order'),
      supabase
        .from('rate_bulletin_sources')
        .select('*')
        .eq('bulletin_id', bulletin.id),
    ]);

    if (alertsResult.error) throw alertsResult.error;
    if (sourcesResult.error) throw sourcesResult.error;

    res.json({
      version: bulletin.version,
      lastVerified: bulletin.last_verified,
      alerts: alertsResult.data.map(a => ({
        level: a.level,
        title: a.title,
        body: a.body,
      })),
      sources: sourcesResult.data.map(s => ({
        label: s.label,
        url: s.url,
      })),
    });
  } catch (err) {
    console.error('Error fetching bulletin:', err.message);
    res.status(500).json({ error: 'Failed to fetch bulletin' });
  }
});

export default router;