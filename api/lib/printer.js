const printer = require('printer');
const ReadWriteFiles = require('../lib/ReadWriteFiles')

require('dotenv-safe').config();
const ConsoleLog = require('./ConsoleLog');

let templeteZPL; // Template usado para gerar RAW

let printing; // RAW que sera impresso

class Printer {
  
  constructor(model) { 
    this.model = model; // Modelo usado para gerar o RAW
  }
  
  async printZPL(fileLocation, docName) {
    let status;
    try{
      templeteZPL = readZPLTemplete(fileLocation);
      printing = matchTagDate(this.model, templeteZPL);
      // console.log(printing);
      console.log(process.env.ZPL_PRINTER);
      // throw new Error('Erro3');
      printer.printDirect({
        data: printing,
        printer: process.env.ZPL_PRINTER,
        docname: `Etiqueta Ativo: ${docName}`,
        type: 'RAW',
        success: jobID => {
          new ConsoleLog().printConsole(`[INFO][PRINT_ZPL] ZPL em '${process.env.ZPL_PRINTER}' enviado ao SPOOL, impressão JOB: ${jobID}.`);
          status = jobID;
        },
        error: err => {
          new ConsoleLog().printConsole(`[ERRO][PRINT_ZPL] ZPL em '${process.env.ZPL_PRINTER}' Falha ao imprimir: ${err.message}`);
          throw err; 
        }
      });
      return `ZPL Enviado ao SPOOL, impressão JOB: ${status}`;
    } catch(err){ throw new Error(err.message); }
  }
}

function readZPLTemplete(fileLocation) {
  fileLocation = new ReadWriteFiles().setPathFile(fileLocation);
  return new ReadWriteFiles().readFileSync(fileLocation, 'string');
}

/**
 * Liga dados do objeto Inventory com template ZPL
 * @param {*} inventory 
 * @param {string} templeteZPL 
 */
function matchTagDate(inventory, templeteZPL) {
  let zPL = '';

  zPL = templeteZPL.replace('_logo_', process.env.ZPL_LOGO);
  zPL = zPL.replace('_header_', `${inventory.asset} / ${inventory.subAsset}         ${inventory.class}`);
  zPL = zPL.replace('_capitalizedOn_', inventory.capitalizedOn.toLocaleDateString());
  zPL = zPL.replace('_barCode_', `${inventory.asset}/${inventory.subAsset}`)
  zPL = zPL.replace('_description_', inventory.description.toUpperCase());
  zPL = zPL.replace('_descriptionComp_', inventory.descriptionComp.toUpperCase());

  return zPL;
}

module.exports = Printer;