var router = require('express').Router();
const path = require('path');
const multipart = require('connect-multiparty'); // Middleware automatiza gravação e leitura de arquivos
require('dotenv-safe').config({allowEmptyValues: true});

var fs = require('fs');

var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões

//var dirFile = path.dirname(__dirname); //Volta um diretório. // Descometar para gravar em public quando dev
//const multipartMiddleware = multipart({ uploadDir: `./${config.diretorioContratos}` }) // Descometar para gravar em public quando dev
const ConsoleLog = require('../../../lib/ConsoleLog');

var dirFile = (process.cwd()); // Quando for compilar descomentar

dirFile = path.join(dirFile, process.env.UPLOAD_DIR_CONTRATOS); //pasta onde os arquivos estão após API

const multipartMiddleware = multipart({ uploadDir: `${dirFile}` }) // Quando for compilar descomentar

/**
 * Renomeia arquivo.
 * @param {string} dirFile Diretório do arquivo.
 * @param {string} fileName Nome do arquivo a ser renomeado.
 * @param {string} newFileName Novo nome do arquivo.
 */
function renameFile(dirFile, fileName ,newFileName) {
  // TODO: FIX: Arquivos de mesmo nome estão sendo sobrescritos, enviar mensagem que arquivo já existe!!!
  fs.rename(`${dirFile}/${fileName}`, `${dirFile}/${newFileName}`, err => {
    if ( err ) {
      new ConsoleLog('error').printConsole(`[FILES] - ${err.message}`)
      return err;
    }
  });
}

/** Baixa arquivo */
router.get('/contrato/:file', 
           auth.required, 
           routePermission.check(permissionModule.FILE.select), 
           (req, res) =>{
  const { file } = req.params;

  // res.sendFile( file, { root: dirFile }); //TODO: Tratar mensagem de erro caso arquivo não seja encontrado
  res.download( dirFile + "/" + file); // Mais completo que sendFiles
});

/** Insere arquivo */
// TODO: Os arquivos com mesmo nome são sobrescritos mas add ao banco verificar
router.post('/contrato',
            auth.required, 
            routePermission.check(permissionModule.FILE.insert), 
            multipartMiddleware, (req, res) => {
  const files = req.files;
  //console.log(`Armazenando arquivo: ${file}`);

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