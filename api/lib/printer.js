
// const util = require('util');
const printer = require('printer');

const ConsoleLog = require('./ConsoleLog');

let printing; // RAW que sera impresso

/** Possui métodos diversos de impressão */
class Printer {
  
  /**
   * Possui métodos diversos de impressão.
   * @param {string} printer Nome da impressora no sistema.
   */
  constructor(printer) { 
    this.printer = printer;
  }
  
  /**
   * Imprime etiqueta em impressora ZEBRA com código ZPL.
   * @param {string} docName Nomo do documento a ser exibido no painel de gerencia do POOL.
   * @param {string} zPL ZPL a ser impresso. 
   * @returns {int} JobID da impressão gerada pelo POOL do sistema/impressora.
   */
  async printZPL(docName, zPL) {
    try{
      let _infoPrint;

      printing = zPL
      printer.printDirect({
        data: printing,
        printer: this.printer,
        docname: `Etiqueta Ativo: ${docName}`,
        type: 'RAW',
        success: jobID => {
          new ConsoleLog().printConsole(`[INFO][PRINT_ZPL] ZPL enviado ao POOL de '${process.env.ZPL_PRINTER}', impressão: ${docName}.`);          
          _infoPrint = jobID;
        },
        error: err => {
          new ConsoleLog().printConsole(`[ERRO][PRINT_ZPL] ZPL em '${process.env.ZPL_PRINTER}' Falha ao imprimir: ${err.message}`);
          throw err; 
        }
      });
      return _infoPrint;
    } catch(err){ throw new Error(err.message); }
  }

  /**
   * Checa o estado da impressão no sistema.
   * @param {int} jobID id da impressão gerada pelo sistema.
   * @returns {Object} Objeto contendo dados da impressão.
   */
  async checkStatusPrinting(jobID) {
    var jobInfo = printer.getJob(this.printer, jobID);
    // console.log("current job info:"+util.inspect(jobInfo, {depth: 10, colors:true}));
    return jobInfo;    
  }
}

module.exports = Printer;