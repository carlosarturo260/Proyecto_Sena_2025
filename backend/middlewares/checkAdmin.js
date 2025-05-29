module.exports = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Acceso sólo para administradores' });
  }
  next();
};
