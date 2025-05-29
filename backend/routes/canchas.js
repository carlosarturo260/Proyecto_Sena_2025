const router      = require('express').Router();
const db          = require('../config/db');
const checkAuth   = require('../middlewares/checkAuth');
const checkAdmin  = require('../middlewares/checkAdmin');

// GET  ▸  todas las canchas
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM canchas');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener canchas' });
  }
});

// GET  ▸  obtener cancha por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM canchas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cancha no encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la cancha' });
  }
});

// POST ▸  crear cancha  (solo admin)
router.post('/', checkAuth, checkAdmin, async (req, res) => {
  const { nombre, ciudad, precio, tipo, techada, imagen, descripcion } = req.body;

  // ¿existe ya?
  const [dup] = await db.query(
    'SELECT id FROM canchas WHERE nombre=? AND ciudad=?',
    [nombre, ciudad]
  );
  if (dup.length) {
    return res.status(409).json({ error: 'La cancha ya existe' });
  }

  await db.query(
    'INSERT INTO canchas (nombre, ciudad, precio, tipo, techada, imagen, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombre, ciudad, precio, tipo, techada, imagen, descripcion]
  );
  res.json({ message: 'Cancha creada exitosamente' });
});



// PUT  ▸  actualizar cancha  (solo admin)
router.put('/:id', checkAuth, checkAdmin, async (req, res) => {
  const { nombre, ciudad, precio, tipo, techada, imagen, descripcion } = req.body;
  try {
    await db.query(
      'UPDATE canchas SET nombre=?, ciudad=?, precio=?, tipo=?, techada=?, imagen=?, descripcion=? WHERE id=?', 
      [nombre, ciudad, precio, tipo, techada, imagen, descripcion, req.params.id]
    );
    res.json({ message: 'Cancha actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la cancha' });
  }
});


// DELETE ▸ eliminar cancha (solo admin)
router.delete('/:id', checkAuth, checkAdmin, async (req, res) => {
  try {
    // Verificar si la cancha existe
    const [cancha] = await db.query('SELECT id FROM canchas WHERE id = ?', [req.params.id]);
    if (cancha.length === 0) {
      return res.status(404).json({ error: 'Cancha no encontrada' });
    }

    // Verificar si hay reservas asociadas a esta cancha
    const [reservas] = await db.query('SELECT id FROM reservas WHERE cancha_id = ? LIMIT 1', [req.params.id]);
    if (reservas.length > 0) {
      return res.status(409).json({ error: 'No se puede eliminar la cancha porque tiene reservas asociadas' });
    }

    // Eliminar comentarios asociados a la cancha
    await db.query('DELETE FROM comentarios WHERE cancha_id = ?', [req.params.id]);

    // Eliminar la cancha
    await db.query('DELETE FROM canchas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cancha eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la cancha' });
  }
});

/* ───────────────── BÚSQUEDA ───────────────────────────
   Ejemplo:
   /api/canchas/search?city=Cali&tipo=F5&techo=1
   Parámetros:
     city   (obligatorio)   => nombre exacto de la ciudad
     tipo   (opcional)      => F5 | F6 | F8 | F11
     techo  (opcional)      => 1  (solo techadas)
     date   (opcional)      => YYYY-MM-DD
     time   (opcional)      => HH:MM   (24 h)
────────────────────────────────────────────────────────*/
router.get('/search', async (req, res) => {
  const { city, tipo, techo, date, time } = req.query;
  if (!city) return res.status(400).json({ error: 'city es obligatorio' });

  // 1) WHERE dinámico
  const where  = ['ciudad = ?'];
  const params = [city];

  if (tipo)  { where.push('tipo = ?');     params.push(tipo); }
  if (techo) { where.push('techada = 1');  }

  // 2) Disponibilidad opcional
  let sql = `SELECT c.* FROM canchas c `;
  if (date && time) {
    sql += `
      LEFT JOIN reservas r
        ON r.cancha_id = c.id
       AND r.fecha     = ?
       AND r.hora      = ?
       AND r.estado   <> 'CANCELADA'
    `;
    params.unshift(time);   // primero hora, luego fecha
    params.unshift(date);
    where.push('r.id IS NULL');
  }
  sql += `WHERE ${where.join(' AND ')}`;

  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error al buscar canchas' });
  }
});


module.exports = router;
