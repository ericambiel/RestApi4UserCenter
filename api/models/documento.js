const mongoose = require('mongoose');
const config = require('../config');

const documentoSchema = new mongoose.Schema({
  nome: { type: String, require: true },
  descricao: { type: String },
  diretorio: { type: String , default: config.diretorioContratos },
  tipo: { type: String },
  numAditivo: { type: Number }, // Sequência logica do documento
  dataInsert: { type: Date },
})

//module.exports = mongoose.model('Documento', documentoSchema);
