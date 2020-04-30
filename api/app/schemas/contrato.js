const mongoose = require('mongoose'); // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const Schema = mongoose.Schema;

// const Departamento = require('./departamento'); 
const Documento = require('./documento');

/**
 * Contracts options
 */
const OptionsSchema = new Schema({
    sendEmailAlerts: { type: Boolean, default: true },
},{ _id : false });

/**
 * Record of emails sent.
 */
const LogEmailSchema = new Schema({
    expiredEmailSent: { type: Boolean }, // Contrato vencido enviado
    expiringEmailSent: { type: Boolean }, // Contrato pra vencer
    indeterminateEmailSent: { type: Boolean }, // Contrato indeterminado
    message: {type: String}
},{ timestamps: { updatedAt: false } , _id : false });

const ContratoSchema = new Schema({
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
    deptoPartList: { type : [ {departamento: { type: String } } ] }, // TODO: Criar referências entre modelo departamento. 
    indReajuste: { type: String },
    diaAntecedencia: { type: Number },  // Dias de antecedencia
    dataAntencedencia: { type: Date },
    obs: { type: String },
    historico: { type: String },
    anaJuridico: { type: Boolean },     // Analise juridica
    documentoList:  [ Documento.schema ], 
    natureza: { type: String },
    options: { type: OptionsSchema, default: OptionsSchema },
    logEmail: [ LogEmailSchema ]
}, { timestamps: true, collection: 'Contratos' });

// findByIdAndUpdate,findOne,findOneAndDelete, findOneAndRemove, findOneAndUpdate, update, updateOne,updateMany
// ContratoSchema.post(['findOneAndUpdate'], function() {
//     try{
//         console.log('Trigger - findOneAndUpdate');
//         if ( this._update.$set.diaAntecedencia !== undefined &&
//             this._update.$set.diaAntecedencia > 0 ){
//                 let date = new Date();
//                 date = new Date(date.setDate(date.getDate() + this._update.$set.diaAntecedencia ));
//                 return this
//                     .updateOne({ $set: { dataAntencedencia: date }})
//                     //.catch(err => {throw err});
//             } else {
//                 return this
//                     .updateOne({ $unset: {dataAntencedencia: ''} })
//                     .catch(err => {throw err});
//             }
//     }catch(err){ console.log(err); }
// });

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