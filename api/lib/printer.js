const printer = require('printer');
const printerName = 'ZPL_PRINTER_TESTE';
const ConsoleLog = require('./ConsoleLog');

const codigo = 1234567890;
const sub = 1112;
const classe = 4000
const dataIncorporacao = new Date().toLocaleDateString();
const denominacao = "Denominacao aqui";
const local = "Local aqui"

let templete =  "^XA" +
            
            "^CF0,18" +
            "^FO220,16^FD" + codigo + " / " + sub + "         " + classe + "^FS" +
            "^FO220,40^FD" + dataIncorporacao + "^FS" +
            "^BY5,2,270" +
            "^FO90,63^BY2^BCN,40,N,N,N^FN1^FD" + codigo + "/" + sub +  "^FS" +
            "^CF0,15" +
            "^FO0,113^FD" + denominacao + "^FS" +
            "^FO0,135^FD" + local + "^FS" +
            "^XZ";

class Printer {
  constructor() { }
  
  printZPL() {
    try{
      return printer.printDirect({
        data: templete,
        printer: printerName,
        type: 'RAW',
        success: () => {
          new ConsoleLog().printConsole(`[INFO][PRINT_ZPL] ZPL em '${printerName}' impresso com sucesso.`);
          return 'impresso com sucesso.';
        },
        error: err => {
          new ConsoleLog().printConsole(`[ERRO][PRINT_ZPL] ZPL em '${printerName}' Falha ao imprimir: ${err.message}`);
          throw err; 
        }
      });
    } catch(err){ throw new Error(err.message); }
  }
}

module.exports = new Printer;