var router = require('express').Router();

//TODO
router.get('/contrato/', function(req, res, next) {
  //res.send('Enviando arquivo!!!');
  const file = path.join(__dirname, '../public/files/contratos/file.txt');
  res.sendFile( file , { root: diretorio } );
});

module.exports = router;