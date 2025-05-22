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
    id: req.session.user.id,
    rol: req.session.user.rol
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

app.get('/seccionesListar', async (req, res) => {
  const pool = await poolPromise;
  const secciones = (await pool.request().query('SELECT * FROM secciones')).recordset;
  res.json(secciones);
});

app.get('/secciones/:id/integrantes', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const integrantes = (await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          u.codigo, 
          u.nombre AS nombre 
        FROM integrantesSecciones i
        JOIN usuarios u 
          ON u.id = i.id_alumno
        WHERE i.id_seccion = @id
      `)).recordset;
    res.json(integrantes);
  } catch (err) {
    console.error('Error al obtener integrantes:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.get('/alumnos', async (req, res) => {
  const pool = await poolPromise;
  const alumnos = (await pool.request()
    .query(`
      SELECT id,
             codigo,
             nombre
      FROM usuarios
      WHERE rol = 1
    `)).recordset;
  res.json(alumnos);
});

app.post('/secciones/:id/matricular', async (req, res) => {
  const { id } = req.params;
  const { id_alumno: idAlumno } = req.body;

  if (!idAlumno || isNaN(idAlumno)) {
    return res.status(400).json({ error: 'ID del alumno es inválido o no enviado.' });
  }

  const pool = await poolPromise;

  try {
    const yaExiste = await pool.request()
      .input('id', sql.Int, id)
      .input('idAlumno', sql.Int, idAlumno)
      .query(`
        SELECT COUNT(*) AS total
        FROM integrantesSecciones
        WHERE id_seccion = @id AND id_alumno = @idAlumno
      `);

    if (yaExiste.recordset[0].total > 0) {
      return res.status(400).json({ error: 'El alumno ya está matriculado en esta sección.' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .input('idAlumno', sql.Int, idAlumno)
      .query(`
        INSERT INTO integrantesSecciones (id_seccion, id_alumno)
        VALUES (@id, @idAlumno)
      `);

    res.status(201).json({ mensaje: 'Alumno matriculado correctamente.' });
  } catch (err) {
    console.error('Error al matricular alumno:', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});


app.delete('/secciones/:id/integrantes/:alumnoId', async (req, res) => {
  const { id, alumnoId } = req.params;
  console.log(req.params)
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id_seccion', sql.Int, alumnoId ? parseInt(id) : null)
      .input('id_alumno', sql.VarChar, alumnoId)
      .query(`
        DELETE FROM integrantesSecciones
        WHERE id_seccion = @id_seccion
          AND carnet_alumno  = @id_alumno
      `);
    res.json({ message: 'Alumno eliminado de la sección' });
  } catch (err) {
    console.error('Error al eliminar integrante:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/tareas', requireLogin, async (req, res) => {
  const { id_seccion, tipo_tarea } = req.body;
  const id_maestro = req.session.user.id;

  if (!id_seccion || isNaN(id_seccion)) {
    return res.status(400).json({ error: 'Debe seleccionar una sección válida.' });
  }
  if (![1,2,3].includes(Number(tipo_tarea))) {
    return res.status(400).json({ error: 'Tipo de tarea inválido.' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('idSeccion', sql.Int, id_seccion)
      .input('idMaestro', sql.Int, id_maestro)
      .input('tipo',     sql.TinyInt, tipo_tarea)
      .query(`
        INSERT INTO tareas (id_seccion, id_maestro, tipo_tarea)
        VALUES (@idSeccion, @idMaestro, @tipo)
      `);

    res.status(201).json({ message: 'Tarea creada correctamente.' });
  } catch (err) {
    console.error('Error al crear tarea:', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});
