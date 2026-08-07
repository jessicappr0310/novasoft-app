const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Cualquier ruta no encontrada devuelve la landing (sitio de una sola página)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✨ NovaSoft landing corriendo en el puerto ${PORT}`);
});
