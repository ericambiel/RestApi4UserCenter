const mongoose = require('mongoose')

const contratoSchema = new mongoose.Schema({
  nome: { type: String, require: true },
  descricao: { type: String },
  diretorio: { type: String },
  tipo: { type: String },
  numAditivo: { type: Number }, // Sequência logica do documento
  dataInsert: { type: Date },
})
