const ReadWriteFiles = require('../../lib/ReadWriteFiles');
const Printer = require('../../lib/printer');
const ConsoleLog = require('../../lib/ConsoleLog');

const Inventory = require('../schemas/inventory');

let fileLocation = 'api/public/zpl/assetZPL.zpl'; // Template usado para gerar RAW

class InventoryController {
   constructor() { }

   /**
    * Lista todo o inventário.
    * @returns {Inventory} Model com todos os ativos
    */
   async listInventory() {
      return await Inventory.find()
      //.sort({ createdAt: 'asc' });
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

   /**
    * Imprime etiqueta do ativo em impressora Zebra
    * @param {Inventory} asset Modelo com dados da etiqueta ser impressa.
    * @returns {int} JobID da impressão gerada pelo SPOOL do sistema/impressora.
    */
   async printAssetZPL(asset) {
      const templeteZPL = readZPLTemplete(fileLocation);
      const zPL = matchTagDate(asset, templeteZPL);
      const printer = new Printer(process.env.ZPL_PRINTER);

      return await printer.printZPL(`${asset.assetNum}/${asset.subAssetNum}`, zPL)
      .then(async jobID => {
         const jobInfo = await printer.checkStatusPrinting(jobID); 
         return await logPrint(asset, 'jobInfo', jobInfo).catch(err => { throw err });
      })
      .catch(async err => { 
         await logPrint(asset, 'jobInfo', err).catch(err => { throw err });
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
   zPL = zPL.replace('_capitalizedOn_', asset.capitalizedOn.toLocaleDateString());
   zPL = zPL.replace('_barCode_', `${asset.assetNum}/${asset.subAssetNum}`)
   zPL = zPL.replace('_description_', asset.description.toUpperCase());
   zPL = zPL.replace('_descriptionComp_', asset.descriptionComp.toUpperCase());
 
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

//  /**
//  * Faz chamadas a função que realizara uma consulta no banco NoSQL,
//  * chama função que imprime e função que registra se etiqueta foi ou não impressa.
//  * @param {*} firstParamAnd Campo contendo primeiro nível de procura AND
//  * @param {*} secondParamAnd Campo contendo segundo nível de procura AND
//  * @param {*} thirdParamAnd Campo contendo terceiro nível de procura AND
//  * @param {*} firstParamProject Compo para filtrar valores encontrados.
//  * @param {String} fieldToLog Campo para inserir estado do envio de email, também usado para definir templete.
//  */
// async function corePrintAsset(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject, fieldToLog) {

// }

module.exports = new InventoryController;