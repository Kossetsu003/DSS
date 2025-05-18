const express = require('express');
const app = express();
const PORT = 4000;
const bcrypt = require('bcrypt');

app.use(express.json());

const cors = require('cors');
app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
