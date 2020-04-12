const mongoose = require('mongoose'); // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const Schema = mongoose.Schema;

// const Departamento = require('./departamento');
const Documento = require('./documento');

const ContratoSchema = new Schema({ // Define o Schema a ser usado pelo mongoDB
    objeto: { type: String, required: [true, 'Não pode estar em branco'] },
    estabFiscal: { type: String},
    parceiro: { type: String, required: [true, 'Não pode estar em branco'] },
    cnpj: { type: Number, required: [true, 'Não pode estar em branco'] },
    status: { type: String },
    situacao: { type: String },
    deptoResponsavel: { type: String },
    valTotal: { type: Number },         // Valor total
    valMensal: { type: Number },
    dataInicio: { type: Date },
    dataFim: { type: Date },
    deptoPartList: { type : [ {departamento: { type: String } } ], default: [] }, // TODO: Criar referências entre modelo departamento. 
    indReajuste: { type: String },
    diaAntecedencia: { type: Number },  // Dias de antecedencia
    obs: { type: String },
    historico: { type: String },
    anaJuridico: { type: Boolean },     // Analise juridica
    documentoList: { type : Documento, default: [] },
    natureza: { type: String } 
}, {collection: 'Contratos'});

// Objeto sem segmentação por classes
// # A sample schema, like what we'd get from json.load()
// schema = {
//     "type" : "object",
//     "properties" : {
//         "id": { "type": "number" },
//         "objeto": { "type": "string" },
//         "estabFiscal": { "type": "string" },
//         "parceiro": { "type": "string" },
//         "cnpj": { "type": "number" },
//         "status": { "type": "string" },
//         "situacao": { "type": "string" },
//         "valTotal": { "type": "number" },
//         "valMensal": { "type": "number" },
//         "dataInicio": { "type": "date" },
//         "dataFim": { "type": "date" },
//         "deptoPartList": { "type": [ {"departamento": { "type": "string" } } ] },
//         "indReajuste": { "type": "string" },
//         "diaAntecedencia": { "type": "number" },
//         "obs": { "type": "string" },
//         "historico": { "type": "string" },
//         "anaJuridico": { "type": "boolean" },
//         "documentoList": { "type" : [ 
//                                   { "nome": { "type": "string" } },
//                                   { "diretorio": { "type": "string" } },
//                                   { "tipo": { "type": "string" } },
//                                   { "numAditivo": { "type": "number" } },
//                                   { "dataInsert": { "type": "date" } } 
//                                 ] 
//                        }
//     },
// }

module.exports = mongoose.model('Contrato', ContratoSchema); // Exporta ao objeto criado na primeira vez o modelo criado