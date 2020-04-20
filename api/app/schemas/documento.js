const mongoose = require('mongoose');
require('dotenv-safe').config();

const DocumentoSchema = new mongoose.Schema({
  nome: { type: String },
  descricao: { type: String },
  diretorio: { type: String , default: process.env.UPLOAD_DIR_CONTARTOS }, // TODO: FIX: Default não funciona, verificar export.module abaixo
  tipo: { type: String },
  numAditivo: { type: Number }, // Sequência logica do documento
  dataInsert: { type: Date },
})

// module.exports = mongoose.model('Documento', documentoSchema);
