const express = require('express');
const app = express();
const PORT = 4000;
const session = require('express-session');
const { poolPromise, sql } = require('./db');

app.use(express.json());

const cors = require('cors');
app.use(cors({
  origin: 'http://localhost',
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(session({
  secret: 'DpMbh0gC3RAoN3G',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 30
  }
}));

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

app.get('/perfil', requireLogin, (req, res) => {
  res.json({
    id:   req.session.userId,
    rol:  req.session.role
  });
});

app.post('/login', async (req, res) => {
  const { carnet, password } = req.body;

  if (!carnet || !password) {
    return res.status(400).json({ message: 'Carnet y contraseña son obligatorios' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('codigo', sql.VarChar, carnet)
      .input('password', sql.VarChar, password)
      .query('SELECT id, rol FROM usuarios WHERE codigo = @codigo AND password = @password');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const usuario = result.recordset[0];

    req.session.user = {
      id: usuario.id,
      rol: usuario.rol
    };

    res.json({ message: 'Login exitoso', rol: usuario.rol });
  } catch (err) {
    console.error('Error en /login:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

function requireLogin(req, res, next) {
  console.log(req.session.user);
  if (!req.session.user) {
    return res.status(401).json({ error: 'No estás autenticado' });
  }
  next();
}

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.status(500).json({ mensaje: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid');
    res.json({ mensaje: 'Sesión cerrada correctamente' });
  });
});
