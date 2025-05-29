const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const checkAuth = require('../middlewares/checkAuth');

// Obtener todos los comentarios de una cancha específica
router.get('/:canchaId', async (req, res) => {
  try {
    const [comentarios] = await pool.query(
      'SELECT c.*, u.nombre as nombre_usuario FROM comentarios c ' +
      'JOIN usuarios u ON c.usuario_id = u.id ' +
      'WHERE c.cancha_id = ? ORDER BY c.fecha_creacion DESC',
      [req.params.canchaId]
    );
    res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// Crear un nuevo comentario (requiere autenticación)
router.post('/', checkAuth, async (req, res) => {
  try {
    const { cancha_id, calificacion, comentario } = req.body;
    const usuario_id = req.user.id; // Obtenido del middleware checkAuth
    
    if (!cancha_id || !calificacion || !comentario) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ error: 'La calificación debe estar entre 1 y 5' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO comentarios (usuario_id, cancha_id, calificacion, comentario) VALUES (?, ?, ?, ?)',
      [usuario_id, cancha_id, calificacion, comentario]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      mensaje: 'Comentario creado exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: 'Error al crear el comentario' });
  }
});

// Eliminar un comentario (solo el propietario o admin)
router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const comentarioId = req.params.id;
    const usuario = req.user;
    
    // Verificar si el usuario es el propietario del comentario o es admin
    const [comentario] = await pool.query('SELECT usuario_id FROM comentarios WHERE id = ?', [comentarioId]);
    
    if (comentario.length === 0) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }
    
    if (comentario[0].usuario_id !== usuario.id && !usuario.isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
    }
    
    await pool.query('DELETE FROM comentarios WHERE id = ?', [comentarioId]);
    res.json({ mensaje: 'Comentario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: 'Error al eliminar el comentario' });
  }
});

// Obtener calificación promedio de una cancha
router.get('/:canchaId/promedio', async (req, res) => {
  try {
    const [resultado] = await pool.query(
      'SELECT AVG(calificacion) as promedio, COUNT(*) as total FROM comentarios WHERE cancha_id = ?',
      [req.params.canchaId]
    );
    
    res.json({
      promedio: resultado[0].promedio || 0,
      total: resultado[0].total || 0
    });
  } catch (error) {
    console.error('Error al obtener promedio:', error);
    res.status(500).json({ error: 'Error al obtener la calificación promedio' });
  }
});

module.exports = router;