const fs = require('fs');
const path = require('path');

class ReadWriteFiles {
   constructor() { }

   /** Returns the project's root directory. 
    * @returns {string} Returns two paths, one for 
    * instance of object, and other to process.
   */
   getRootPath() {
      let rootPath = path.resolve(__dirname); //Path to instance that is executing. 
      let rootPathCWD = path.resolve(process.cwd()); //Path to system process.
      
      while(rootPath){
         if(fs.existsSync(rootPath + path.sep + 'package.json')){
            break;
         }
         rootPath = rootPath.substring(0, rootPath.lastIndexOf(path.sep));
      }
      return { rootPath, rootPathCWD };
   }

   /**
    * Discovery full path to the file informed.
    * @param {string} pathFile Path from the project's root directory to the informed file.
    * @returns {string} Returns two full paths, one for 
    * instance of object, and other to process..
    */
   setPathFile(pathFile) {
      const  { rootPath, rootPathCWD } = this.getRootPath();
      const pathFileCWD = path.join(rootPathCWD, pathFile);
      pathFile = path.join(rootPath, pathFile);
      return { pathFile, pathFileCWD }
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

      option === 'string' ? data = data.toString() : data;

      return data;
   }
}

module.exports = ReadWriteFiles;

