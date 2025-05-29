const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  /* 1.  Leer el encabezado Authorization
         Debe venir con el formato:  Bearer <token>  */
  const authHeader = req.headers.authorization || '';     // puede ser undefined
  const parts      = authHeader.split(' ');               // ["Bearer", "<token>"]

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = parts[1];                                 // <token>

  try {
    /* 2.  Verificar el token */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* 3.  Guardar la info en req.user para las rutas siguientes */
    req.user = decoded;   // { userId, isAdmin, iat, exp }

    next();               // continuar
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
