var router = require('express').Router();

// const Usuario = require('../models/usuario');

// /** 
//  * Inserir documento em Usuario 
//  */
// router.post('/usuario', (req, res, next) => {
//   const { nome, sobreNome, email, password, permissionLevel } = req.body;
  
//   const usuario = new Usuario({
//     nome: nome, 
//     sobreNome: sobreNome, 
//     email: email, 
//     password: password, 
//     permissionLevel: permissionLevel
//   })

//   usuario.save()
//     .then(result => res.json(result))
//     .catch(error => res.send(error));
// });

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;