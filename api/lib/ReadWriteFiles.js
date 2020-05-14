const fs = require('fs');
const path = require('path');
let rootPath;

class ReadWriteFiles {
   constructor() { }

   /** Returns the project's root directory. */
   getRootPath() {
      rootPath = path.resolve(__dirname);   
      
      while(rootPath){
         if(fs.existsSync(rootPath + path.sep + 'package.json')){
            break;
         }
         rootPath = rootPath.substring(0, rootPath.lastIndexOf(path.sep));
      }
      return rootPath;
   }
   /**
    * Full path to the informed file informed.
    * @param {string} pathFile Path from the project's root directory to the informed file.
    */
   setPathFile(pathFile) {
      pathFile = path.join(this.getRootPath(), pathFile); //pasta onde os arquivos estão após API
      return pathFile
   }

   /**
    * Read the file in your directory and return a buffer.
    * @param {string} pathFile File to be read.
    * @param {string} option string to return string.
    * @returns {Buffer|string} Return a Buffer from file was read.
    */
   readFileSync(pathFile, option) {
      let data;
      data = fs.readFileSync(pathFile, (err, data) => {
         if(err) throw err;
         return data;
      });

      option === 'string' ? data = data.toString() : data

      return data
   }
}

module.exports = ReadWriteFiles;

