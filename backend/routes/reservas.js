// backend/routes/reservas.js
const router     = require('express').Router();
const db         = require('../config/db');
const checkAuth  = require('../middlewares/checkAuth');
const checkAdmin = require('../middlewares/checkAdmin');

// 1.  crear reserva  (con chequeo de disponibilidad)
router.post('/', checkAuth, async (req, res) => {
  const { cancha_id, fecha, hora } = req.body;
  const userId = req.user.userId;

  // ¿ya existe reserva esa hora?
  const [dup] = await db.query(
    `SELECT id FROM reservas
      WHERE cancha_id=? AND fecha=? AND hora=? AND estado<>'CANCELADA'`,
    [cancha_id, fecha, hora]
  );
  if (dup.length) {
    return res.status(409).json({ error: 'Esa hora ya está reservada' });
  }

  await db.query(
    'INSERT INTO reservas (usuario_id, cancha_id, fecha, hora, estado) VALUES (?,?,?,?,?)',
    [userId, cancha_id, fecha, hora, 'PENDIENTE']
  );
  res.json({ message: 'Reserva creada exitosamente' });
});


// ── 2. Listar reservas del usuario ─────────────────
router.get('/', checkAuth, async (req, res) => {
  const userId = req.user.userId;
  const [rows] = await db.query(
    `SELECT r.*, c.nombre AS nombre_cancha, c.ciudad
       FROM reservas r
       JOIN canchas c ON r.cancha_id = c.id
      WHERE r.usuario_id = ?`,
    [userId]
  );
  res.json(rows);
});

// ── 3. Listar TODAS las reservas (solo admin) ─────
router.get('/todas', checkAuth, checkAdmin, async (_req, res) => {
  const [rows] = await db.query(
    `SELECT r.*, u.nombre AS usuario, c.nombre AS cancha, c.ciudad
       FROM reservas r
       JOIN usuarios u ON r.usuario_id = u.id
       JOIN canchas  c ON r.cancha_id = c.id`
  );
  res.json(rows);
});

// ── 4.  Mis reservas (usuario logueado) ───────────────────────
router.get('/mis', checkAuth, async (req, res) => {
  const userId = req.user.userId;
  const [rows] = await db.query(
    `SELECT r.id, c.nombre AS cancha, c.ciudad,
            DATE_FORMAT(r.fecha,'%Y-%m-%d') AS fecha,
            TIME_FORMAT(r.hora,'%H:%i')        AS hora,
            r.estado
       FROM reservas r
       JOIN canchas  c ON c.id = r.cancha_id
      WHERE r.usuario_id = ?
      ORDER BY r.fecha, r.hora`,            // lo recibirá ordenado
    [userId]
  );
  res.json(rows);
});


// PATCH  /api/reservas/:id   body { estado: 'CONFIRMADA' | 'CANCELADA' }
router.patch('/:id', checkAuth, checkAdmin, async (req, res) => {
  const { estado } = req.body;
  if (!['CONFIRMADA', 'CANCELADA'].includes(estado))
    return res.status(400).json({ error: 'Estado no permitido' });

  await db.query('UPDATE reservas SET estado=? WHERE id=?', [estado, req.params.id]);
  res.json({ message: 'Estado actualizado' });
});


module.exports = router;
