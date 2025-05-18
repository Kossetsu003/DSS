const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

const cors = require('cors');
app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use(express.json());


app.get('/registro', (req, res) => {
  console.log(req.body);
  res.status(200).json({ mensaje: "Registro exitoso" });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
