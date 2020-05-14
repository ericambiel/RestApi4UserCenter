const mongoose = require('mongoose'); // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator'); // Verifica se é o único no banco

const LogPrinterSchema = new Schema({
   wasPrinted: { type: Boolean },
   message: { type: String }
},{ timestamps: { updatedAt: false }, _id : false });

const InventorySchema = new Schema({
   asset: { type: Number, required: [true, 'Não pode estar em branco'], unique: true }, // Ativo
   subAsset: { type: Number, required: [true, 'Não pode estar em branco'] },// Sub numero Ativo
   class: { type: Number, required: [true, 'Não pode estar em branco'] },
   description: { type: String, required: [true, 'Não pode estar em branco'] },
   descriptionComp: { type: String }, // Descrição complementar
   InventoryNum: { type: Number, required: [true, 'Não pode estar em branco'] },
   capitalizedOn: { type: Date, required: [true, 'Não pode estar em branco'] }, // Data de Incorporação
   costCenter: { type: Number },
   logPrinter: [ LogPrinterSchema ]
},{ timestamps: true, collection: 'Inventory' });

InventorySchema.plugin(uniqueValidator, { message: 'Esse valor já existe!' }); // Apply the uniqueValidator plugin to userSchema.

module.exports = mongoose.model('Inventory', InventorySchema, 'Inventory');