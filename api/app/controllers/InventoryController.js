const ReadWriteFiles = require('../../lib/ReadWriteFiles');
const ConsoleLog = require('../../lib/ConsoleLog');
const Printer = require('../../lib/Printer');
const printer = new Printer(process.env.ZPL_PRINTER);

const Inventory = require('../schemas/inventory');

let fileLocation = 'api/public/zpl/assetZPL.zpl'; // Template usado para gerar RAW

class InventoryController {
   constructor() { }

   /**
    * Lista todo o inventário.
    * @returns {Inventory} Model com todos os ativos.
    */
   async listInventory() {
      return await Inventory.find().catch(err => {throw err});
      //.sort({ createdAt: 'asc' });
   }

   /**
    * Insere um ativo ao inventario.
    * @param {JSON} asset JSON com objetos a serem inseridos.
    * @returns {Inventory} Model com ativo inserido.
    */
   async insertOneAsset(asset) {
      return await Inventory.create(asset).catch(err => {throw err});
   }

   /**
    * Remove um ativo do inventário.
    * @param {string} id ID completo do ativo no BD.
    * @returns {Inventory} Model com ativo removido.
    */
   async deleteOneAsset(id) {
      return await Inventory.findByIdAndRemove(id)
      // .lean()
      .then(asset => {
         let response = { message: 'Ativo não existe, tente outro ID.' }
         if (asset !== null) {
            response = {'asset': asset }
            response.message = `Ativo '${asset.assetNum} - ${asset.subAssetNum}' apagado.`
         }
         return response;
      })
      .catch(err => {throw err});
   }

    /**
    * Atualiza um ativo do inventário.
    * @param {JSON} asset Ativo a ser atualizado.
    * @returns {Inventory} Model com ativos atualizado.
    */
   async updateOneAsset(asset) {
      return await Inventory.findByIdAndUpdate(asset._id, asset, { new: true }).catch(err => {throw err});
   }

   /**
    * Tentara inserir um novo ativo, se o numero do ativo já existir atualiza dados.
    * @param {JSON} asset JSON com objetos a serem inseridos ou atualizados
    * @returns {Inventory} Retorna modelo com ativo já inserido.
    */
   async insertOrUpdateAsset(asset) {
   return await Inventory.findOneAndUpdate(
      { assetNum: asset.assetNum }, 
      asset,
      { new: true, upsert: true }) // New true pois necessita para imprimir se não over etiqueta ainda no BD.
   .catch(err => { throw err });
   }

   // async rePrint(id) {
   //    Inventory.findById(id)
   //       .then(asset => {
   //          // printer.checkStatusPrinting(asset.logPrinter[asset.logPrinter.length - 1].id)
   //          // TODO: Verificar se a impressão foi finalizada antes de reprimir novamente
   //       })
   //       .catch(err => { throw err})
   // }

   /**
    * Imprime etiqueta do ativo em impressora Zebra
    * @param {Inventory} assetModel Modelo com dados da etiqueta ser impressa.
    * @returns {int | Object} JobID da impressão gerada pelo POOL do sistema/impressora e informações de impressão.
    */
   async printAssetZPL(assetModel) {
      const templeteZPL = readZPLTemplete(fileLocation);
      const zPL = matchTagDate(assetModel, templeteZPL);
      // const printer = new Printer(process.env.ZPL_PRINTER);

      return await printer.printZPL(`${assetModel.assetNum} - ${assetModel.subAssetNum}`, zPL)
      .then(async jobID => {
         const jobInfo = await printer.checkStatusPrinting(jobID);
         const asset = await logPrint(assetModel, 'jobInfo', jobInfo).catch(err => { throw err })
         return  { asset, jobInfo };
      })
      .catch(async err => { 
         await logPrint(assetModel, 'jobInfo', err).catch(err => { throw err });
         throw err });
   }
}

/**
 * Registra informações de horários e mensagens de erro ou não
 * no envio de impressões de ativo.
 * @param {Inventory} inventory Model do ativo que foi atualizado.
 * @param {String} fieldToLog Campo que sera usado para registro.
 * @param {printer} jobInfo Contem informações de impressão do ativo.
 */
async function logPrint(inventory, fieldToLog, jobInfo) {
   const query = {
      $push: { 
         logPrinter: { 
            message: jobInfo instanceof Error ? jobInfo.message.toString() : 'Enviado ao POOL de impressão' } 
      }
   }
   query.$push.logPrinter[fieldToLog] = jobInfo instanceof Error ? jobInfo.message.toString() : jobInfo; // Se erro false
   return await Inventory.findByIdAndUpdate(inventory._id, query, { new: true })
   .then(asset => { 
     new ConsoleLog().printConsole(jobInfo instanceof Error
       ? `[ERROR][INVENTARIO] ${fieldToLog} - Erro ao imprimir Ativo; ativo: _id: ${inventory._id}`
       : `[INFO][INVENTARIO] ${fieldToLog} - Estado: '${jobInfo.status.toString()}'; ativo: _id: ${inventory._id}`);
     return asset; })
   .catch(err => { throw err; });
 }

 /**
 * Liga dados do objeto Inventory com template ZPL
 * @param {Inventory} asset Modelo a ser usado no cruzamento de informações.
 * @param {string} templeteZPL Templete a ser usado para cruzar informações com modelo.
 */
function matchTagDate(asset, templeteZPL) {
   let zPL = '';
 
   zPL = templeteZPL.replace('_logo_', process.env.ZPL_LOGO);
   zPL = zPL.replace('_header_', `${asset.assetNum} / ${asset.subAssetNum}         ${asset.class}`);
   zPL = zPL.replace('_capitalizedOn_', new Date(asset.capitalizedOn).toLocaleDateString());
   zPL = zPL.replace('_barCode_', `${asset.assetNum}/${asset.subAssetNum}`)
   zPL = zPL.replace('_description_', asset.description !== null ? asset.description.toUpperCase() : '');
   zPL = zPL.replace('_descriptionComp_', asset.descriptionComp !== null ? asset.descriptionComp.toUpperCase() : '');
 
   return zPL;
 }

 /**
 * Lê arquivo ZPL em diretório dentro do projeto. SÍNCRONO.
 * @param {string} fileLocation Local no projeto para o arquivo ZPL.
 * @returns {string} String com ZPL lido do arquivo.
 */
function readZPLTemplete(fileLocation) {
   fileLocation = new ReadWriteFiles().setPathFile(fileLocation);
   return new ReadWriteFiles().readFileSync(fileLocation, 'string');
 }

module.exports = new InventoryController;