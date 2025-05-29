const express = require('express');
const router = express.Router();
const db = require('../config/db');
const checkAuth = require('../middlewares/checkAuth');
const checkAdmin = require('../middlewares/checkAdmin');

// Ruta para obtener datos del dashboard
router.get('/dashboard', checkAuth, checkAdmin, async (req, res) => {
    try {
        // Obtener total de canchas
        const [canchas] = await db.query('SELECT COUNT(*) as total FROM canchas');
        
        // Obtener reservas pendientes
        const [reservas] = await db.query(
            "SELECT COUNT(*) as total FROM reservas WHERE estado = 'PENDIENTE'"
        );
        
        // Obtener comentarios nuevos (últimos 7 días)
        const [comentarios] = await db.query(
            'SELECT COUNT(*) as total FROM comentarios WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        );
        
        res.json({
            totalCanchas: canchas[0].total,
            reservasPendientes: reservas[0].total,
            comentariosNuevos: comentarios[0].total
        });
    } catch (error) {
        console.error('Error al obtener datos del dashboard:', error);
        res.status(500).json({ error: 'Error al cargar datos del dashboard' });
    }
});

// Ruta para obtener todas las canchas (admin)
router.get('/canchas', checkAuth, checkAdmin, async (req, res) => {
    try {
        const [canchas] = await db.query('SELECT * FROM canchas');
        res.json(canchas);
    } catch (error) {
        console.error('Error al obtener canchas:', error);
        res.status(500).json({ error: 'Error al cargar las canchas' });
    }
});

// Ruta para obtener todas las reservas (admin)
router.get('/reservas', checkAuth, checkAdmin, async (req, res) => {
    try {
        const [reservas] = await db.query(
            `SELECT r.id, c.nombre as cancha, u.nombre as usuario, 
                    DATE_FORMAT(r.fecha, '%Y-%m-%d') as fecha, 
                    TIME_FORMAT(r.hora, '%H:%i') as hora, 
                    r.estado 
             FROM reservas r 
             JOIN canchas c ON r.cancha_id = c.id 
             JOIN usuarios u ON r.usuario_id = u.id 
             ORDER BY r.fecha DESC, r.hora ASC`
        );
        res.json(reservas);
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ error: 'Error al cargar las reservas' });
    }
});

// Ruta para obtener todos los comentarios (admin)
router.get('/comentarios', checkAuth, checkAdmin, async (req, res) => {
    try {
        const [comentarios] = await db.query(
            `SELECT c.id, c.comentario as texto, c.calificacion, 
                    u.nombre as usuario, ca.nombre as cancha,
                    DATE_FORMAT(c.fecha_creacion, '%Y-%m-%d %H:%i') as fecha
             FROM comentarios c
             JOIN usuarios u ON c.usuario_id = u.id
             JOIN canchas ca ON c.cancha_id = ca.id
             ORDER BY c.fecha_creacion DESC`
        );
        res.json(comentarios);
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({ error: 'Error al cargar los comentarios' });
    }
});

module.exports = router;