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

    console.log(req.session.user);

    res.json({ message: 'Login exitoso', rol: usuario.rol, id: usuario.id });
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
  if (![1, 2, 3].includes(Number(tipo_tarea))) {
    return res.status(400).json({ error: 'Tipo de tarea inválido.' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('idSeccion', sql.Int, id_seccion)
      .input('idMaestro', sql.Int, id_maestro)
      .input('tipo', sql.TinyInt, tipo_tarea)
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

app.get('/tareas/usuario/:alumnoId', requireLogin, async (req, res) => {
  const { alumnoId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('alumnoId', sql.Int, parseInt(alumnoId, 10))
      .query(`
        SELECT 
          t.id,
          t.tipo_tarea,
          s.nombre     AS seccion_nombre,
          s.anio       AS seccion_anio,
          CASE 
            WHEN EXISTS(
              SELECT 1 FROM credito_fiscal            cf WHERE cf.id_tarea = t.id
            ) THEN 1
            WHEN EXISTS(
              SELECT 1 FROM FacturaConsumidorFinal    fcf WHERE fcf.id_tarea = t.id
            ) THEN 1
            WHEN EXISTS(
              SELECT 1 FROM nota_credito              nc WHERE nc.id_tarea = t.id
            ) THEN 1
            ELSE 0
          END AS realizado
        FROM integrantesSecciones i
        JOIN tareas t
          ON t.id_seccion = i.id_seccion
        JOIN secciones s
          ON s.id = i.id_seccion
        WHERE i.id_alumno = @alumnoId
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener tareas de usuario:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/credito-fiscal/:tareaId', async (req, res) => {
  const { tareaId } = req.params;
  const {
    id_alumno,
    cliente_nombre, fecha, direccion,
    municipio, departamento, nit, registro, giro,
    nota_remision, fecha_nota, condicion, venta_cta_de,
    total_literal,
    suma, iva13, sub_total, iva_retenido,
    ventas_exentas, ventas_no_sujetas, venta_total,
    entregado_nombre, entregado_dui, entregado_firma,
    recibido_nombre, recibido_dui, recibido_firma,
    detalles
  } = req.body;

  // 1) Validaciones generales
  if (!id_alumno) {
    return res.status(400).json({ error: 'Falta id_alumno.' });
  }
  const requiredText = [
    ['cliente_nombre', cliente_nombre],
    ['fecha', fecha],
    ['direccion', direccion],
    ['condicion', condicion],
  ];
  for (const [field, val] of requiredText) {
    if (!val || String(val).trim() === '') {
      return res.status(400).json({ error: `${field} es obligatorio.` });
    }
  }

  // 2) Validación de totales (no negativos)
  const numericFields = [
    ['suma', suma],
    ['iva13', iva13],
    ['sub_total', sub_total],
    ['iva_retenido', iva_retenido],
    ['ventas_exentas', ventas_exentas],
    ['ventas_no_sujetas', ventas_no_sujetas],
    ['venta_total', venta_total],
  ];
  for (const [field, val] of numericFields) {
    if (val == null || isNaN(val) || Number(val) < 0) {
      return res.status(400).json({ error: `${field} debe ser un número >= 0.` });
    }
  }

  // 3) Validar detalles
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ error: 'Debe incluir al menos una línea de detalle.' });
  }
  for (let i = 0; i < detalles.length; i++) {
    const d = detalles[i];
    if (!d.descripcion || d.descripcion.trim() === '') {
      return res.status(400).json({ error: `Descripción detalle #${i + 1} es obligatoria.` });
    }
    if (
      d.cantidad == null || isNaN(d.cantidad) || Number(d.cantidad) <= 0 ||
      d.precio_unitario == null || isNaN(d.precio_unitario) || Number(d.precio_unitario) < 0 ||
      d.no_sujetas == null || isNaN(d.no_sujetas) || Number(d.no_sujetas) < 0 ||
      d.exentas == null || isNaN(d.exentas) || Number(d.exentas) < 0 ||
      d.gravadas == null || isNaN(d.gravadas) || Number(d.gravadas) < 0
    ) {
      return res.status(400).json({
        error: `Valores numéricos inválidos en detalle #${i + 1}. Deben ser >= 0 (cantidad > 0).`
      });
    }
  }

  // 4) Inserción en transacción
  const pool = await poolPromise;
  const trx = new sql.Transaction(pool);

  try {
    await trx.begin();

    // Cabecera
    const headerReq = new sql.Request(trx)
      .input('tarea', sql.Int, tareaId)
      .input('alumno', sql.Int, id_alumno)
      .input('cliente_nombre', sql.NVarChar(100), cliente_nombre)
      .input('fecha', sql.Date, fecha)
      .input('direccion', sql.NVarChar(200), direccion)
      .input('municipio', sql.NVarChar(100), municipio)
      .input('departamento', sql.NVarChar(100), departamento)
      .input('nit', sql.NVarChar(20), nit)
      .input('registro', sql.NVarChar(20), registro)
      .input('giro', sql.NVarChar(150), giro)
      .input('nota_remision', sql.NVarChar(50), nota_remision)
      .input('fecha_nota', sql.Date, fecha_nota)
      .input('condicion', sql.NVarChar(50), condicion)
      .input('venta_cta_de', sql.NVarChar(150), venta_cta_de)
      .input('total_literal', sql.NVarChar(300), total_literal)
      .input('suma', sql.Decimal(10, 2), suma)
      .input('iva13', sql.Decimal(10, 2), iva13)
      .input('sub_total', sql.Decimal(10, 2), sub_total)
      .input('iva_retenido', sql.Decimal(10, 2), iva_retenido)
      .input('ventas_exentas', sql.Decimal(10, 2), ventas_exentas)
      .input('ventas_no_sujetas', sql.Decimal(10, 2), ventas_no_sujetas)
      .input('venta_total', sql.Decimal(10, 2), venta_total)
      .input('entregado_nombre', sql.NVarChar(100), entregado_nombre)
      .input('entregado_dui', sql.NVarChar(20), entregado_dui)
      .input('entregado_firma', sql.NVarChar(100), entregado_firma)
      .input('recibido_nombre', sql.NVarChar(100), recibido_nombre)
      .input('recibido_dui', sql.NVarChar(20), recibido_dui)
      .input('recibido_firma', sql.NVarChar(100), recibido_firma);

    const headerResult = await headerReq.query(`
      INSERT INTO credito_fiscal (
        id_tarea, id_alumno,
        cliente_nombre, fecha, direccion,
        municipio, departamento, nit, registro, giro,
        nota_remision, fecha_nota, condicion, venta_cta_de,
        total_literal,
        suma, iva13, sub_total, iva_retenido,
        ventas_exentas, ventas_no_sujetas, venta_total,
        entregado_nombre, entregado_dui, entregado_firma,
        recibido_nombre, recibido_dui, recibido_firma
      )
      OUTPUT INSERTED.id_credito
      VALUES (
        @tarea, @alumno,
        @cliente_nombre, @fecha, @direccion,
        @municipio, @departamento, @nit, @registro, @giro,
        @nota_remision, @fecha_nota, @condicion, @venta_cta_de,
        @total_literal,
        @suma, @iva13, @sub_total, @iva_retenido,
        @ventas_exentas, @ventas_no_sujetas, @venta_total,
        @entregado_nombre, @entregado_dui, @entregado_firma,
        @recibido_nombre, @recibido_dui, @recibido_firma
      );
    `);

    const idCredito = headerResult.recordset[0].id_credito;

    // Detalles: cada uno con su propio Request para evitar parámetros duplicados
    for (const d of detalles) {
      await new sql.Request(trx)
        .input('credito', sql.Int, idCredito)
        .input('cantidad', sql.Int, d.cantidad)
        .input('descripcion', sql.NVarChar(200), d.descripcion)
        .input('precio_unitario', sql.Decimal(10, 2), d.precio_unitario)
        .input('no_sujetas', sql.Decimal(10, 2), d.no_sujetas)
        .input('exentas', sql.Decimal(10, 2), d.exentas)
        .input('gravadas', sql.Decimal(10, 2), d.gravadas)
        .query(`
          INSERT INTO credito_fiscal_detalle (
            id_credito, cantidad, descripcion,
            precio_unitario, no_sujetas, exentas, gravadas
          )
          VALUES (
            @credito, @cantidad, @descripcion,
            @precio_unitario, @no_sujetas, @exentas, @gravadas
          );
        `);
    }

    await trx.commit();
    res.status(201).json({ mensaje: 'Guardado exitoso', id_credito: idCredito });
  } catch (err) {
    await trx.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/nota-credito/:tareaId', requireLogin, async (req, res) => {
  const { tareaId } = req.params;
  const {
    id_alumno,
    cliente_nombre,
    fecha_emision: fecha,
    direccion,
    doc_modifica_tipo,
    serie_numero,
    fecha_original,
    motivo_modificacion,
    subtotal = 0,
    igv = 0,
    total = 0,
    detalles
  } = req.body;

  // 1) Validaciones básicas
  if (!id_alumno) return res.status(400).json({ error: 'Falta id_alumno' });
  for (let [k, v] of [
    ['cliente_nombre', cliente_nombre],
    ['direccion', direccion],
    ['doc_modifica_tipo', doc_modifica_tipo],
    ['serie_numero', serie_numero]
  ]) {
    if (!v || !String(v).trim())
      return res.status(400).json({ error: `${k} es obligatorio` });
  }
  if (!Array.isArray(detalles) || detalles.length === 0)
    return res.status(400).json({ error: 'Debes enviar al menos un detalle' });
  detalles.forEach((d, i) => {
    if (!d.descripcion || !d.descripcion.trim())
      throw { status: 400, msg: `Falta descripción en detalle #${i + 1}` };
    if (d.cantidad <= 0 || d.precio_unitario < 0 || d.descuento < 0 || d.valor_venta < 0)
      throw { status: 400, msg: `Valores inválidos en detalle #${i + 1}` };
  });

  const pool = await poolPromise;
  const trx = new sql.Transaction(pool);
  try {
    await trx.begin();

    // 2) Inserción cabecera con id_alumno y los totales
    const headerReq = new sql.Request(trx)
      .input('tarea',       sql.Int,         parseInt(tareaId, 10))
      .input('alumno',      sql.Int,         parseInt(id_alumno, 10))
      .input('cliente',     sql.NVarChar(100), cliente_nombre)
      .input('fecha',       sql.Date,        fecha)
      .input('direccion',   sql.NVarChar(200), direccion)
      .input('tipo',        sql.NVarChar(50),  doc_modifica_tipo)
      .input('serie',       sql.NVarChar(50),  serie_numero)
      .input('fechaOrig',   sql.Date,        fecha_original)
      .input('motivo',      sql.NVarChar(300), motivo_modificacion)
      .input('subtotal',    sql.Decimal(10, 2), subtotal)
      .input('igv',         sql.Decimal(10, 2), igv)
      .input('total',       sql.Decimal(10, 2), total);

    const hdr = await headerReq.query(`
      INSERT INTO nota_credito (
        id_tarea, id_alumno,
        cliente_nombre, fecha_emision, direccion,
        doc_modifica_tipo, doc_modifica_serie_numero, fecha_original,
        motivo_modificacion,
        subtotal, igv, total
      )
      OUTPUT INSERTED.id_nota
      VALUES (
        @tarea, @alumno,
        @cliente, @fecha, @direccion,
        @tipo,    @serie,  @fechaOrig,
        @motivo,
        @subtotal, @igv, @total
      );
    `);
    const idNota = hdr.recordset[0].id_nota;

    // 3) Inserción de cada detalle
    for (let d of detalles) {
      await new sql.Request(trx)
        .input('nota',           sql.Int,         idNota)
        .input('item',           sql.Int,         parseInt(d.item, 10) || 0)
        .input('codigo',         sql.NVarChar(50), d.codigo)
        .input('cantidad',       sql.Int,         d.cantidad)
        .input('descripcion',    sql.NVarChar(200), d.descripcion)
        .input('precio_unitario',sql.Decimal(10,2), d.precio_unitario)
        .input('descuento',      sql.Decimal(10,2), d.descuento)
        .input('valor_venta',    sql.Decimal(10,2), d.valor_venta)
        .query(`
          INSERT INTO nota_credito_detalle (
            id_nota, item, codigo, cantidad,
            descripcion, precio_unitario, descuento, valor_venta
          ) VALUES (
            @nota, @item, @codigo, @cantidad,
            @descripcion, @precio_unitario, @descuento, @valor_venta
          );
        `);
    }

    await trx.commit();
    res.status(201).json({ mensaje: 'Nota de crédito guardada', id_nota: idNota });
  } catch (err) {
    await trx.rollback();
    console.error(err);
    if (err.status) return res.status(err.status).json({ error: err.msg });
    res.status(500).json({ error: 'Error del servidor' });
  }
});


app.post('/factura-final/:tareaId', requireLogin, async (req, res) => {
  const { tareaId } = req.params;
  const {
    id_alumno,
    dia, mes, anio,
    cliente_nombre, cliente_nit, cliente_direccion,
    venta_cta_de, son_texto,
    sumas, venta_exenta, venta_no_sujeta, iva_retenido, venta_total,
    entregado_nombre, entregado_dui, entregado_firma,
    recibido_nombre, recibido_dui, recibido_firma,
    detalles
  } = req.body;

  // Validaciones básicas
  if (!id_alumno || !cliente_nombre || dia == null || mes == null || anio == null)
    return res.status(400).json({ error: 'Datos incompletos' });

  if (!Array.isArray(detalles) || detalles.length === 0)
    return res.status(400).json({ error: 'Debes enviar al menos un detalle' });

  const pool = await poolPromise;
  const trx = new sql.Transaction(pool);

  try {
    await trx.begin();

    // Insertar cabecera
    const reqCabecera = new sql.Request(trx)
      .input('tarea', sql.Int, tareaId)
      .input('alumno', sql.Int, id_alumno)
      .input('dia', sql.TinyInt, dia)
      .input('mes', sql.TinyInt, mes)
      .input('anio', sql.SmallInt, anio)
      .input('cliente', sql.NVarChar(100), cliente_nombre)
      .input('nit', sql.NVarChar(20), cliente_nit)
      .input('direccion', sql.NVarChar(200), cliente_direccion)
      .input('cta', sql.NVarChar(100), venta_cta_de)
      .input('son', sql.NVarChar(300), son_texto)
      .input('sumas', sql.Decimal(10, 2), sumas)
      .input('venta_exenta', sql.Decimal(10, 2), venta_exenta)
      .input('venta_no_sujeta', sql.Decimal(10, 2), venta_no_sujeta)
      .input('iva_retenido', sql.Decimal(10, 2), iva_retenido)
      .input('venta_total', sql.Decimal(10, 2), venta_total)
      .input('entregado_nombre', sql.NVarChar(100), entregado_nombre)
      .input('entregado_dui', sql.NVarChar(20), entregado_dui)
      .input('entregado_firma', sql.NVarChar(100), entregado_firma)
      .input('recibido_nombre', sql.NVarChar(100), recibido_nombre)
      .input('recibido_dui', sql.NVarChar(20), recibido_dui)
      .input('recibido_firma', sql.NVarChar(100), recibido_firma);

    const cabecera = await reqCabecera.query(`
      INSERT INTO FacturaConsumidorFinal (
        Dia, Mes, Anio,
        NombreCliente, DUI_o_NIT, Direccion, VentaCuentaDe,
        SonTexto, Sumas, VentaExenta, VentaNoSujeta, IvaRetenido, VentaTotal,
        Entregado_Nombre, Entregado_DUI, Entregado_Firma,
        Recibido_Nombre, Recibido_DUI, Recibido_Firma,
        id_tarea, id_alumno
      ) OUTPUT INSERTED.IdFactura
      VALUES (
        @dia, @mes, @anio,
        @cliente, @nit, @direccion, @cta,
        @son, @sumas, @venta_exenta, @venta_no_sujeta, @iva_retenido, @venta_total,
        @entregado_nombre, @entregado_dui, @entregado_firma,
        @recibido_nombre, @recibido_dui, @recibido_firma,
        @tarea, @alumno
      )
    `);

    const idFactura = cabecera.recordset[0].IdFactura;

    // Insertar detalles
    for (const d of detalles) {
      await new sql.Request(trx)
        .input('factura', sql.Int, idFactura)
        .input('cantidad', sql.Int, d.cantidad)
        .input('descripcion', sql.NVarChar(200), d.descripcion)
        .input('precio_unitario', sql.Decimal(10, 2), d.precio_unitario)
        .input('venta_no_sujeta', sql.Decimal(10, 2), d.venta_no_sujeta)
        .input('venta_exenta', sql.Decimal(10, 2), d.venta_exenta)
        .input('venta_gravada', sql.Decimal(10, 2), d.venta_gravada)
        .query(`
          INSERT INTO DetalleFacturaConsumidorFinal (
            IdFactura, Cantidad, Descripcion, PrecioUnitario,
            VentaNoSujeta, VentaExenta, VentaGravada
          ) VALUES (
            @factura, @cantidad, @descripcion, @precio_unitario,
            @venta_no_sujeta, @venta_exenta, @venta_gravada
          )
        `);
    }

    await trx.commit();
    res.status(201).json({ mensaje: 'Factura guardada correctamente', IdFactura: idFactura });
  } catch (err) {
    await trx.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la factura' });
  }
});



app.get('/notas/usuario/:alumnoId', requireLogin, async (req, res) => {
  const { alumnoId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('alumnoId', sql.Int, parseInt(alumnoId, 10))
      .query(`
        SELECT 
          t.id                AS tareaId,
          t.tipo_tarea        AS tipo,
          cf.nota             AS nota
        FROM tareas t
        JOIN credito_fiscal cf 
          ON cf.id_tarea   = t.id
         AND cf.id_alumno  = @alumnoId
        WHERE cf.nota IS NOT NULL

        UNION ALL

        SELECT 
          t.id               AS tareaId,
          t.tipo_tarea       AS tipo,
          nc.nota            AS nota
        FROM tareas t
        JOIN nota_credito nc
          ON nc.id_tarea    = t.id
         AND nc.id_alumno   = @alumnoId
        WHERE nc.nota IS NOT NULL

        UNION ALL

        SELECT 
          t.id               AS tareaId,
          t.tipo_tarea       AS tipo,
          fcf.nota           AS nota
        FROM tareas t
        JOIN FacturaConsumidorFinal fcf
          ON fcf.id_tarea   = t.id
         AND fcf.id_alumno  = @alumnoId
        WHERE fcf.nota IS NOT NULL

        ORDER BY tareaId;
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener notas de usuario:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Devuelve todas las entregas (ya calificadas o no) de una sección,
app.post('/entregas/seccion/:id', requireLogin, async (req, res) => {
  const secId = parseInt(req.params.id, 10);
  const maestroId = parseInt(req.body.maestroId, 10);
  if (!maestroId || !secId) return res.status(400).json({ error: 'Datos incompletos' });

  const pool = await poolPromise;

  const qr = `
    SELECT cf.id_tarea AS tareaId, cf.id_alumno AS alumnoId, u.codigo, u.nombre, t.tipo_tarea
    FROM credito_fiscal cf
    JOIN tareas t 
      ON t.id = cf.id_tarea 
      AND t.id_seccion = @sec 
      AND t.id_maestro = @maestro
    JOIN usuarios u ON u.id = cf.id_alumno

    UNION ALL

    SELECT f.id_tarea, f.id_alumno, u.codigo, u.nombre, t.tipo_tarea
    FROM FacturaConsumidorFinal f
    JOIN tareas t 
      ON t.id = f.id_tarea 
      AND t.id_seccion = @sec 
      AND t.id_maestro = @maestro
    JOIN usuarios u ON u.id = f.id_alumno

    UNION ALL

    SELECT n.id_tarea, n.id_alumno, u.codigo, u.nombre, t.tipo_tarea
    FROM nota_credito n
    JOIN tareas t 
      ON t.id = n.id_tarea 
      AND t.id_seccion = @sec 
      AND t.id_maestro = @maestro
    JOIN usuarios u ON u.id = n.id_alumno;
  `;

  try {
    const result = await pool.request()
      .input('sec', sql.Int, secId)
      .input('maestro', sql.Int, maestroId)
      .query(qr);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/formulario/credito-fiscal/:tareaId/:alumnoId', requireLogin, async (req, res) => {
  const { tareaId, alumnoId } = req.params;
  const pool = await poolPromise;

  try {
    const cabecera = await pool.request()
      .input('tareaId', sql.Int, tareaId)
      .input('alumnoId', sql.Int, alumnoId)
      .query(`
        SELECT TOP 1 *
        FROM credito_fiscal
        WHERE id_tarea = @tareaId AND id_alumno = @alumnoId
      `);

    if (cabecera.recordset.length === 0) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    const datos = cabecera.recordset[0];

    const detalles = await pool.request()
      .input('id_credito', sql.Int, datos.id_credito)
      .query(`
        SELECT cantidad, descripcion, precio_unitario, no_sujetas, exentas, gravadas
        FROM credito_fiscal_detalle
        WHERE id_credito = @id_credito
      `);

    res.json({
      cliente_nombre: datos.cliente_nombre,
      fecha: datos.fecha,
      direccion: datos.direccion,
      municipio: datos.municipio,
      departamento: datos.departamento,
      nit: datos.nit,
      registro: datos.registro,
      giro: datos.giro,
      nota_remision: datos.nota_remision,
      fecha_nota: datos.fecha_nota,
      condicion: datos.condicion,
      venta_cta_de: datos.venta_cta_de,
      total_literal: datos.total_literal,
      suma: datos.suma,
      iva13: datos.iva13,
      sub_total: datos.sub_total,
      iva_retenido: datos.iva_retenido,
      ventas_exentas: datos.ventas_exentas,
      ventas_no_sujetas: datos.ventas_no_sujetas,
      venta_total: datos.venta_total,
      entregado_nombre: datos.entregado_nombre,
      entregado_dui: datos.entregado_dui,
      entregado_firma: datos.entregado_firma,
      recibido_nombre: datos.recibido_nombre,
      recibido_dui: datos.recibido_dui,
      recibido_firma: datos.recibido_firma,
      nota: datos.nota,
      detalles: detalles.recordset
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});


app.post('/calificar/credito-fiscal/:tareaId/:alumnoId', requireLogin, async (req, res) => {
  const { tareaId, alumnoId } = req.params;
  const { nota } = req.body;

  if (typeof nota !== 'number' || nota < 0 || nota > 10)
    return res.status(400).json({ error: 'La nota debe estar entre 0 y 10' });

  const pool = await poolPromise;
  try {
    const result = await pool.request()
      .input('nota', sql.Decimal(3, 1), nota)
      .input('tareaId', sql.Int, tareaId)
      .input('alumnoId', sql.Int, alumnoId)
      .query(`
        UPDATE credito_fiscal
        SET nota = @nota
        WHERE id_tarea = @tareaId AND id_alumno = @alumnoId
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: 'Registro no encontrado' });

    res.json({ mensaje: 'Nota actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET – obtener datos de FacturaConsumidorFinal + detalles
app.get('/formulario/factura-final', requireLogin, async (req, res) => {
  const { tarea, alumno } = req.query;
  if (!tarea || !alumno) {
    return res.status(400).json({ error: 'Faltan parámetros tarea o alumno' });
  }

  try {
    const pool = await poolPromise;

    // 1) Cabecera
    const cabeceraResult = await pool.request()
      .input('tarea', sql.Int, tarea)
      .input('alumno', sql.Int, alumno)
      .query(`
        SELECT 
          IdFactura, Dia, Mes, Anio,
          NombreCliente, DUI_o_NIT, Direccion, VentaCuentaDe,
          SonTexto, Sumas, VentaExenta, VentaNoSujeta, IvaRetenido, VentaTotal,
          Entregado_Nombre, Entregado_DUI, Entregado_Firma,
          Recibido_Nombre, Recibido_DUI, Recibido_Firma,
          id_tarea, id_alumno, nota
        FROM FacturaConsumidorFinal
        WHERE id_tarea = @tarea AND id_alumno = @alumno
      `);

    if (cabeceraResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    const factura = cabeceraResult.recordset[0];

    // 2) Detalles
    const detallesResult = await pool.request()
      .input('idFactura', sql.Int, factura.IdFactura)
      .query(`
        SELECT 
          IdDetalle, Cantidad, Descripcion, PrecioUnitario,
          VentaNoSujeta, VentaExenta, VentaGravada
        FROM DetalleFacturaConsumidorFinal
        WHERE IdFactura = @idFactura
      `);

    res.json({
      factura,
      detalles: detallesResult.recordset
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la factura' });
  }
});


// POST – actualizar solo la nota de FacturaConsumidorFinal
app.post('/formulario/factura-final/nota', requireLogin, async (req, res) => {
  const { tarea, alumno, nota } = req.body;
  const valor = parseFloat(nota);
  if (!tarea || !alumno || isNaN(valor) || valor < 0 || valor > 10) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('nota', sql.Decimal(3,1), valor)
      .input('tarea', sql.Int, tarea)
      .input('alumno', sql.Int, alumno)
      .query(`
        UPDATE FacturaConsumidorFinal
        SET nota = @nota
        WHERE id_tarea = @tarea AND id_alumno = @alumno
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Registro no encontrado para nota' });
    }

    res.json({ mensaje: 'Nota guardada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la nota' });
  }
});

// GET /formulario/nota-credito/:tareaId/:alumnoId
app.get('/formulario/nota-credito/:tareaId/:alumnoId', requireLogin, async (req, res) => {
  const { tareaId, alumnoId } = req.params;
  const pool = await poolPromise;
  try {
    // Cabecera
    const cab = await pool.request()
      .input('tarea', sql.Int, tareaId)
      .input('alumno', sql.Int, alumnoId)
      .query(`
        SELECT 
          id_nota, id_tarea, id_alumno,
          cliente_nombre, fecha_emision, direccion,
          doc_modifica_tipo, doc_modifica_serie_numero, fecha_original,
          motivo_modificacion,
          subtotal, igv, total,
          nota
        FROM nota_credito
        WHERE id_tarea = @tarea AND id_alumno = @alumno
      `);
    if (!cab.recordset.length) return res.status(404).json({ error: 'No encontrada' });
    const datos = cab.recordset[0];

    // Detalles
    const det = await pool.request()
      .input('id_nota', sql.Int, datos.id_nota)
      .query(`
        SELECT item, codigo, cantidad, descripcion,
               precio_unitario, descuento, valor_venta
        FROM nota_credito_detalle
        WHERE id_nota = @id_nota
        ORDER BY item
      `);

    res.json({
      // campo “ruc” lo puedes rellenar hardcode o traerlo de otro lado si aplica
      ruc: '20547836473',
      ...datos,
      detalles: det.recordset
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /calificar/nota-credito/:tareaId/:alumnoId
app.post('/calificar/nota-credito/:tareaId/:alumnoId', requireLogin, async (req, res) => {
  const { tareaId, alumnoId } = req.params;
  const { nota } = req.body;
  if (typeof nota !== 'number' || nota < 0 || nota > 10) {
    return res.status(400).json({ error: 'La nota debe estar entre 0 y 10' });
  }
  const pool = await poolPromise;
  try {
    const result = await pool.request()
      .input('nota', sql.Decimal(3,1), nota)
      .input('tarea', sql.Int, tareaId)
      .input('alumno', sql.Int, alumnoId)
      .query(`
        UPDATE nota_credito
        SET nota = @nota
        WHERE id_tarea = @tarea AND id_alumno = @alumno
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    res.json({ mensaje: 'Nota actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/entregas/seccion/:seccionId', requireLogin, async (req, res) => {
  const { seccionId } = req.params;
  const profesorId = req.session.user.id;
  try {
    const pool = await poolPromise;

    // Tareas de tipo Crédito Fiscal
    const cf = await pool.request()
      .input('sec', sql.Int, seccionId)
      .input('prof', sql.Int, profesorId)
      .query(`
        SELECT 
          u.codigo AS carnet,
          u.nombre,
          'Crédito Fiscal' AS prueba,
          cf.nota,
          t.id           AS tareaId,
          u.id           AS alumnoId
        FROM credito_fiscal cf
        JOIN tareas t         ON cf.id_tarea = t.id
        JOIN usuarios u       ON cf.id_alumno = u.id
        WHERE t.id_seccion = @sec
          AND t.id_maestro = @prof
          AND cf.nota IS NOT NULL
      `);

    // Factura Consumidor Final
    const fcf = await pool.request()
      .input('sec', sql.Int, seccionId)
      .input('prof', sql.Int, profesorId)
      .query(`
        SELECT 
          u.codigo AS carnet,
          u.nombre,
          'Factura Consumidor Final' AS prueba,
          fcf.nota,
          t.id           AS tareaId,
          u.id           AS alumnoId
        FROM FacturaConsumidorFinal fcf
        JOIN tareas t         ON fcf.id_tarea = t.id
        JOIN usuarios u       ON fcf.id_alumno = u.id
        WHERE t.id_seccion = @sec
          AND t.id_maestro = @prof
          AND fcf.nota IS NOT NULL
      `);

    // Nota de Crédito
    const nc = await pool.request()
      .input('sec', sql.Int, seccionId)
      .input('prof', sql.Int, profesorId)
      .query(`
        SELECT 
          u.codigo AS carnet,
          u.nombre,
          'Nota de Crédito' AS prueba,
          nc.nota,
          t.id           AS tareaId,
          u.id           AS alumnoId
        FROM nota_credito nc
        JOIN tareas t         ON nc.id_tarea = t.id
        JOIN usuarios u       ON nc.id_alumno = u.id
        WHERE t.id_seccion = @sec
          AND t.id_maestro = @prof
          AND nc.nota IS NOT NULL
      `);

    // Unir los tres conjuntos
    const entregas = [...cf.recordset, ...fcf.recordset, ...nc.recordset];
    res.json(entregas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener entregas' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});