var router = require('express').Router();
const path = require('path');
const multipart = require('connect-multiparty');
const config = require('../config');
var fs = require('fs');

const multipartMiddleware = multipart({ uploadDir: `./${config.diretorioContratos}` })
var dirFile = path.dirname(__dirname); //Volta um diretorio.
dirFile = path.join(dirFile, config.diretorioContratos); //pasta onde os arquivos estão após API

/**
 * Renomeia arquivo.
 * @param {string} dirFile Diretório do arquivo.
 * @param {string} fileName Nome do arquivo a ser renomeado.
 * @param {string} newFileName Novo nome do arquivo.
 */
function renameFile(dirFile, fileName ,newFileName) {
  // TODO: Arquivos de mesmo noele ele substitui, enviar menssagem que arquivo já existe!!!
  fs.rename(`${dirFile}/${fileName}`, `${dirFile}/${newFileName}`, err => {
    if ( err ) {
      console.log('ERROR: ' + err);
      return err;
    }
  });
}

router.get('/contrato/:file', (req, res, next) =>{
  const { file } = req.params;

  // res.sendFile( file, { root: dirFile }); //Tratar menssagem de erro caso arquivo não seja encontrado
  res.download( dirFile + "/" + file); // Mais completo que sendFiles
});

/** Insere arquivo */
router.post('/contrato', multipartMiddleware, (req, res) => {
  const files = req.files;
  //console.log(`Armazendo arquivo: ${file}`);

  if (files.file.length > 0){
    files.file.forEach(file => {
      renameFile(dirFile, path.basename(file.path), file.name);
    });
  } else {
    renameFile(dirFile, path.basename(files.file.path), files.file.name);
  }
  res.json({ message: files }); // Tratar erros de retorno aqui.
})

module.exports = router;