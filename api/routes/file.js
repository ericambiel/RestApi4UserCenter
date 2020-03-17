var router = require('express').Router();
const path = require('path');
const config = require('../config');
const multipartMiddleware = require('connect-multiparty').multipart({ uploadDir: `../${config.diretorioContratos}` });

router.get('/contrato/:file', function(req, res, next) {
  const { file } = req.params;

  var dirFile = path.dirname(__dirname); //Volta um diretorio.
  dirFile = path.join(dirFile, config.diretorioContratos); //pasta onde os arquivos estão após API


  // res.sendFile( file, { root: dirFile }); //Tratar menssagem de erro caso arquivo não seja encontrado
  res.download( dirFile + "/" + file); // Mais completo que sendFiles
});

router.post('/contrato', multipartMiddleware, (req, res) => {
  const files = req.files;
  console.log(`Armazendo arquivo: ${file}`);
  res.json({ message: files }); // Tratar erros de retorno aqui.
})



module.exports = router;