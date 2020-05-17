const mongoose = require('mongoose'); // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator'); // Verifica se é o único no banco

const LogPrinterSchema = new Schema({
   sentToPool: { type: Boolean },
   jobInfo: { },
   message: { type: String }
},{ timestamps: { updatedAt: false }, _id : false });

const InventorySchema = new Schema({
   assetNum: { type: Number, required: [true, 'Não pode estar em branco'], unique: true }, // Nº Ativo
   subAssetNum: { type: Number, required: [true, 'Não pode estar em branco'] },// Sub N° Ativo
   class: { type: Number, required: [true, 'Não pode estar em branco'] },
   description: { type: String, required: [true, 'Não pode estar em branco'] },
   descriptionComp: { type: String }, // Descrição complementar
   inventoryNum: { type: Number, required: [true, 'Não pode estar em branco'] },
   capitalizedOn: { type: Date, required: [true, 'Não pode estar em branco'] }, // Data de Incorporação
   costCenter: { type: Number },
   logPrinter: [ LogPrinterSchema ]
},{ timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true }, collection: 'Inventory' });

/**
 * Retorna ID único simplificado, 4 caracteres.
 */
InventorySchema.virtual('id').get(function() {
   /* 
       timestamp → 5220bb43 Generation timestamp (4 bytes)
       machine → b754af First 3 bytes of the MD5 hash of the machine host name, or of the mac/network address, or the virtual machine id.
       pid → 4118 First 2 bytes of the process (or thread) ID generating the ObjectId.
       inc → 000001 ever incrementing integer value.
   */
   const objID = this._id;
   const contractId = objID.toString().substr(20); // Default 18
   return contractId
});

InventorySchema.plugin(uniqueValidator, { message: 'Esse valor já existe!' }); // Apply the uniqueValidator plugin to userSchema.

module.exports = mongoose.model('Inventory', InventorySchema, 'Inventory');