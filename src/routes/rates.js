import { Router } from 'express';
import supabase from '../db/client.js';

const router = Router();

// GET /api/rates/:countryKey/:chapter
// Returns full stacked rate for a country + chapter combination
router.get('/:countryKey/:chapter', async (req, res) => {
  try {
    const { countryKey, chapter } = req.params;
    const chapterCode = chapter.padStart(2, '0');

    // Fetch country, chapter, and any specific overrides in parallel
    const [countryResult, chapterResult, overrideResult] = await Promise.all([
      supabase.from('countries').select('*').eq('key', countryKey).single(),
      supabase.from('hts_chapters').select('*').eq('chapter', chapterCode).single(),
      supabase.from('tariff_rates')
        .select('*')
        .eq('country_key', countryKey)
        .eq('chapter', chapterCode)
        .maybeSingle(),
    ]);

    if (countryResult.error) throw countryResult.error;
    if (chapterResult.error) throw chapterResult.error;

    const country = countryResult.data;
    const chapterData = chapterResult.data;
    const override = overrideResult.data;

    if (!country) return res.status(404).json({ error: 'Country not found' });
    if (!chapterData) return res.status(404).json({ error: 'Chapter not found' });

    // Build stacked rates
    // Country baseline rate
    const baselineRate = country.baseline_rate;

    // MFN rate — midpoint of range as default estimate
    const mnfRate = chapterData.mnf_high > 0
      ? parseFloat(((chapterData.mnf_low + chapterData.mnf_high) / 2).toFixed(2))
      : 0;

    // Section 301 — only applies to China, use override if exists
    const s301Rate = countryKey === 'china' && chapterData.s301_applies
      ? (override?.s301_rate ?? chapterData.s301_rate)
      : 0;

    // Section 232 — use override if exists
    const s232Rate = chapterData.s232_applies
      ? (override?.s232_rate ?? chapterData.s232_rate)
      : 0;

    // Special rate from override
    const specialRate = override?.special_rate ?? 0;

    // Section 232 products are exempt from Section 122 baseline
    const effectiveBaseline = chapterData.s232_applies ? 0 : baselineRate;

    const totalStackedRate = mnfRate + effectiveBaseline + s301Rate + s232Rate + specialRate;

    // Build warnings
    const warnings = [];
    if (chapterData.s232_applies) {
      warnings.push('Section 232 products are exempt from the Section 122 baseline tariff. Baseline set to 0%.');
    }
    if (countryKey === 'china' && chapterData.chapter === '85') {
      warnings.push('Semiconductors (HTS 8541/8542) are at 50%, not 25%. Verify your specific 10-digit code.');
    }
    if (countryKey === 'china' && chapterData.chapter === '87') {
      warnings.push('Electric vehicles from China are at 100%. Verify your specific 10-digit code.');
    }
    if (country.usmca) {
      warnings.push('USMCA-qualifying goods may be duty free. Verify rules of origin for your product.');
    }

    res.json({
      country: countryKey,
      chapter: chapterCode,
      countryLabel: country.label,
      chapterDescription: chapterData.description,
      mnfRate,
      mnfRateRange: { low: chapterData.mnf_low, high: chapterData.mnf_high },
      baselineRate: effectiveBaseline,
      s301Rate,
      s232Rate,
      specialRate,
      totalStackedRate: parseFloat(totalStackedRate.toFixed(2)),
      notes: override?.notes || chapterData.notes,
      warnings,
      lastUpdated: chapterData.last_updated,
    });
  } catch (err) {
    console.error('Error fetching rates:', err.message);
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

export default router;