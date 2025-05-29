// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

const db = require('./config/db'); // (opcional, si lo necesitas aquí)
const authRoutes = require('./routes/auth'); // <--- Importamos nuestras rutas de auth
const canchasRoutes = require('./routes/canchas'); // < Enlazar este archivo en server.js
const reservasRoutes = require('./routes/reservas');// <Enlazar
const disponibilidadRoutes = require('./routes/disponibilidad');
const comentariosRoutes = require('./routes/comentarios'); // Importamos rutas de comentarios
const usuariosRoutes = require('./routes/usuarios'); // Importamos rutas de usuarios
const adminRoutes = require('./routes/admin'); // Importamos rutas de administración

app.use(cors());
app.use(express.json());

// Montamos las Rutas de autenticación con el prefijo /api/auth
app.use('/api/auth', authRoutes); 
app.use('/api/canchas', canchasRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/comentarios', comentariosRoutes); // Montamos las rutas de comentarios
app.use('/api/usuarios', usuariosRoutes); // Montamos las rutas de usuarios
app.use('/api/admin', adminRoutes); // Montamos las rutas de administración

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '¡Servidor funcionando!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
