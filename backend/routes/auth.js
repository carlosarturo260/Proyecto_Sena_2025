// backend/routes/auth.js
const router = require('express').Router();
const db     = require('../config/db');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

// ---------- REGISTRO ----------
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, isAdmin } = req.body;

    // ¿existe?
    const [existe] = await db.query('SELECT 1 FROM usuarios WHERE email=?', [email]);
    if (existe.length) {
      return res.status(400).json({ error: 'Correo ya registrado' });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO usuarios (nombre, email, password, is_admin) VALUES (?,?,?,?)',
      [nombre, email, hash, isAdmin ? 1 : 0]
    );

    res.json({ message: 'Usuario creado' });
  } catch (err) {
    console.error('Error /register:', err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// ---------- LOGIN ----------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query('SELECT * FROM usuarios WHERE email=?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { userId: user.id, isAdmin: user.is_admin === 1 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        isAdmin: user.is_admin === 1
      }
    });
  } catch (err) {
    console.error('Error /login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

module.exports = router;
