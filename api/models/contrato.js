const mongoose = require('mongoose'); // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const Schema = mongoose.Schema;

const Departamento = require('./departamento');
const Documento = require('./documento');

const contratoSchema = new Schema({ // Define o Schema a ser usado pelo mongoDB
    objeto: { type: String, require: true },
    estabFiscal: { type: String, require: true },
    parceiro: { type: String, require: true },
    cnpj: { type: Number, require: true },
    status: { type: String },
    situacao: { type: String },
    valTotal: { type: Number },         // Valor total
    valMensal: { type: Number },
    dataInicio: { type: Date },
    dataFim: { type: Date },
    deptoPartList: { type : [ Departamento ] }, // Lista de Departamentos associados
    indReajuste: { type: String },
    diaAntecedencia: { type: Number },  // Dias de antecedencia
    obs: { type: String },
    historico: { type: String },
    anaJuridico: { type: Boolean },     // Analise juridica
    documentoList: { type : [ Documento ] }   // Mudar diretorio
}, {collection: 'Contratos'});

module.exports = mongoose.model('Contratos', contratoSchema); // Exporta ao objeto criado na primeira vez o modelo criado