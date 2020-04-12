const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator'); //Verifica se é dado é no banco

const EstabFiscalSchema = new Schema({
  descricao: { 
      type: String, 
      required: [true, 'Necessário uma descrição para Estabelecimento Fiscal'] },
  razaoSocial: { 
      type: String },
  nomeFantasia: { 
      type: String },
  cnpj: { 
      type: Number, 
      unique: true },
  inscricaoEstadual: { 
      type: String },
  inscricaoMunicipal: { 
      type: String },
}, {timestamps: true, collection: 'EstabFiscal'})

EstabFiscalSchema.plugin(uniqueValidator, { message: 'Esse valor já existe!' }); // Apply the uniqueValidator plugin to userSchema.

module.exports = mongoose.model('EstabFiscal', EstabFiscalSchema);
