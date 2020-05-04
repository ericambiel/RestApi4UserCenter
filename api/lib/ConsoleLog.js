let now;

class ConsoleLog {
   constructor() {
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
     if (message.indexOf('[INFO]') === '[INFO]') console.info(`${now} [INFO] ${message}`);
     else if(message.indexOf('[ERROR]') === '[ERROR]') console.info(`${now} [ERROR] ${message}`);
     else (console.log(`${now} ${message}`));
   }
}

module.exports = ConsoleLog;