const express = require('express');
const app = express();
const PORT = 4000;
const bcrypt = require('bcrypt');

app.use(express.json());

const cors = require('cors');
app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use(express.json());


app.post('/registro', async (req, res) => {
  const { carnet, password } = req.body;
  console.log(req.body);

  // Validación de contraseña
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;

  if (!regex.test(password)) {
    return res.status(400).json({
      mensaje: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un símbolo.'
    });
  }

  try {
    // Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Simular guardado en base de datos
    console.log('Carnet:', carnet);
    console.log('Password hasheada:', hashedPassword);

    return res.json({ mensaje: 'Usuario registrado con éxito.' });
  } catch (err) {
    console.error('Error al hashear:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
