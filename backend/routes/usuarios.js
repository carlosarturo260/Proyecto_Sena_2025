const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const checkAuth = require('../middlewares/checkAuth');

// Obtener datos del usuario por ID (protegido)
router.get('/:id', checkAuth, async (req, res) => {
    try {
        // Verificar que el usuario solo pueda acceder a su propia información
        // a menos que sea administrador
        if (req.params.id != req.user.userId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'No tienes permiso para acceder a esta información' });
        }

        const [rows] = await db.query(
            'SELECT id, nombre, email, telefono FROM usuarios WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Actualizar datos del usuario (protegido)
router.put('/:id', checkAuth, async (req, res) => {
    try {
        // Verificar que el usuario solo pueda actualizar su propia información
        // a menos que sea administrador
        if (req.params.id != req.user.userId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'No tienes permiso para modificar esta información' });
        }

        const { nombre, telefono } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        await db.query(
            'UPDATE usuarios SET nombre = ?, telefono = ? WHERE id = ?',
            [nombre, telefono || null, req.params.id]
        );

        res.json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Cambiar contraseña (protegido)
router.put('/:id/password', checkAuth, async (req, res) => {
    try {
        // Verificar que el usuario solo pueda cambiar su propia contraseña
        if (req.params.id != req.user.userId) {
            return res.status(403).json({ error: 'No tienes permiso para cambiar esta contraseña' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // Verificar contraseña actual
        const [rows] = await db.query('SELECT password FROM usuarios WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password);

        if (!isMatch) {
            return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
        }

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña
        await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);

        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;