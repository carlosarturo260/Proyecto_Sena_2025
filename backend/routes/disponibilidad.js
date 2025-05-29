// backend/routes/disponibilidad.js
const router = require('express').Router();
const db     = require('../config/db');

/* ------------------------------------------------
   GET /api/disponibilidad?cancha_id=1&fecha=2025-05-20
   Devuelve 2 arrays:  reserved[] y free[]
--------------------------------------------------*/
router.get('/', async (req, res) => {
  const { cancha_id, fecha } = req.query;

  if (!cancha_id || !fecha) {
    return res.status(400).json({ error: 'cancha_id y fecha son obligatorios' });
  }

  try {
    // 1. horas ya reservadas (excepto CANCELADAS)
    const [rows] = await db.query(
      `SELECT hora
         FROM reservas
        WHERE cancha_id = ?
          AND fecha     = ?
          AND estado   <> 'CANCELADA'`,
      [cancha_id, fecha]
    );
    const reserved = rows.map(r => r.hora);          // ["10:00:00", ...]

    // 2. generar lista completa de slots hora 00–23
    const all = Array.from({ length: 18 }, (_, i) => {
      const h = i + 6;                               // 06 a 23
      return (h < 10 ? '0' : '') + h + ':00:00';
    });

    const free = all.filter(h => !reserved.includes(h));

    res.json({ reserved, free });
  } catch (err) {
    console.error('Error disponibilidad:', err);
    res.status(500).json({ error: 'Error al consultar disponibilidad' });
  }
});

module.exports = router;
