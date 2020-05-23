let now;

class ConsoleLog {
   constructor(type) {
     this.type = this.type === undefined ? '' : type.toString().toLowerCase();
     now = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
   }
   
   /**
    * Imprime no console mensagens de erro
    * [INFO] - console.info
    * [ERROR] - console.erro
    * @param {String} message
    * @return {string} Retorna erro ou informação ao STDIO 
    */
   printConsole(message){
     switch (this.type) {
        case 'info': console.info(`${now} [INFO]${message}`); break;
        case 'error': console.error(`${now} [ERROR]${message}`); break;
        case 'warn': console.warn(`${now} [WARN]${message}`); break;
        case 'debug': console.debug(`${now} [WARN]${message}`); break;
        default: console.log(`${now} ${message}`);
     }
   }
}

module.exports = ConsoleLog;