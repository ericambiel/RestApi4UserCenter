const mongoose = require('mongoose'); // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const Schema = mongoose.Schema;

// const Departamento = require('./departamento'); 
const Documento = require('./documento');

/**
 * Contracts options
 */
const OptionsSchema = new Schema({
    sendEmailAlerts: { type: Boolean, default: true },
    sendEmailRegularly: { type: Number, default: 30 }
},{ _id : false });

/**
 * Record of emails sent.
 */
const LogEmailSchema = new Schema({
    expiredEmailSent: { type: Boolean },            // Contrato vencido enviado
    expiringEmailSent: { type: Boolean },           // Contrato pra vencer
    expiringEmailSentRegularly: { type: Boolean },  // Contratos pra vencer e que são enviados regularmente
    indeterminateEmailSent: { type: Boolean },      // Contrato indeterminado
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
    options: { type: OptionsSchema, default: { OptionsSchema } },
    logEmail: [ LogEmailSchema ],
    dateToSendEmail: { type: Date, default: null}
}, { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }, collection: 'Contratos' });

ContratoSchema.virtual('id').get(function() {
    /* 
        _id = 5220bb43 b754af 4118 000001
        timestamp → 5220bb43 Generation timestamp (4 bytes)
        machine → b754af First 3 bytes of the MD5 hash of the machine host name, or of the mac/network address, or the virtual machine id.
        pid → 4118 First 2 bytes of the process (or thread) ID generating the ObjectId.
        inc → 000001 ever incrementing integer value.
    */
    const objID = this._id;
    const contractId = objID.toString().substr(20); // Default 18
    return contractId
});

// Trigger
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

module.exports = mongoose.model('Contrato', ContratoSchema); // Exporta ao objeto criado na primeira vez o modelo criado