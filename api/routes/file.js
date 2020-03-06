var router = require('express').Router();
const path = require('path');

//TODO
router.get('/contrato/:file', function(req, res, next) {
  const { file } = req.params;

  var dirFile = path.dirname(__dirname); //Volta um diretorio.
  dirFile = path.join(dirFile, 'public/files/contratos'); //pasta onde os arquivos estão após API

  //res.send(dirFile);
  res.sendFile( file, { root: dirFile }); //Tratar menssagem de erro caso arquivo não seja encontrado
});

module.exports = router;