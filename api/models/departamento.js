const mongoose = require('mongoose')

const departamentoSchema = new mongoose.Schema({
  departamento: { type: String }
})

//module.exports = mongoose.model('Departamento', departamentoSchema);
