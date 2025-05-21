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
    id:   req.session.user.id,
    rol:  req.session.user.rol
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

app.post('/secciones', async (req, res) => {
  const { nombre, anio } = req.body;

  if (!nombre || !anio) {
    return res.status(400).json({ message: 'Nombre y año son obligatorios' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('nombre', sql.VarChar, nombre)
      .input('anio', sql.Int, anio)
      .query('INSERT INTO secciones (nombre, anio) VALUES (@nombre, @anio)');

    res.json({ message: 'Sección insertada correctamente' });
  } catch (error) {
    console.error('Error al insertar sección:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// 1) Listar secciones
app.get('/seccionesListar', async (req, res) => {
  const pool = await poolPromise;
  const secciones = (await pool.request().query('SELECT * FROM secciones')).recordset;
  res.json(secciones);
});

// 2) Listar integrantes de una sección
app.get('/secciones/:id/integrantes', async (req, res) => {
  const { id } = req.params;
  const pool = await poolPromise;
  const integrantes = (await pool.request()
    .input('id', sql.Int, id)
    .query(`SELECT id_alumno, nombre_alumno 
            FROM integrantesSecciones 
            WHERE id_seccion = @id`)).recordset;
  res.json(integrantes);
});

// 3) Listar todos los alumnos (rol = 1)
app.get('/alumnos', async (req, res) => {
  const pool = await poolPromise;
  const alumnos = (await pool.request()
    .query(`SELECT id, codigo 
            FROM usuarios 
            WHERE rol = 1`)).recordset;
  res.json(alumnos);
});

// 4) Matricular un alumno en una sección
app.post('/secciones/:id/matricular', async (req, res) => {
  const { id } = req.params;
  const { id_alumno } = req.body;
  const pool = await poolPromise;
  await pool.request()
    .input('id_seccion', sql.Int, id)
    .input('id_alumno',  sql.Int, id_alumno)
    .input('nombre_alumno', sql.VarChar, /* podrías traerlo o replicarlo */ '')
    .query(`INSERT INTO integrantesSecciones (id_alumno, nombre_alumno, id_seccion)
            VALUES (@id_alumno, (SELECT codigo FROM usuarios WHERE id = @id_alumno), @id_seccion)`);
  res.json({ message: 'Alumno matriculado' });
});