var router = require('express').Router();
const passport = require('passport');

// var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
// const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
// const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões

// const User = require('../../schemas/user');


/** Faz login do usuário no sistema */
router.post('/login', (req, res, next) => {  
  if(!req.body.userName){
    return res.status(422).json({errors: {userName: "não pode estar em branco"}});
  }

  if(!req.body.password){
    return res.status(422).json({errors: {password: "não pode estar em branco"}});
  }
  
  // session: false - Pq usamos JWT ao invés de seções
  passport.authenticate('local', {session: false}, async (err, user, info) => {
    if(err){ return next(err); }

    if(user){
      // user.token = user.generateJWT();
      return res.json({user: await user.toAuthJSON()});
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

/**
 * Verifica se ID no payload do JWT é valido
 * e devolve um novo JWT valido.
 * OBS:SOMENTE PARA DEV, PODE SER COMENTADO.
 * @param {String} JWT
*/
// router.get('/', auth.required, auth.required, routePermission.check(permissionModule.ROOT.select), (req, res, next) => {
//   // Pode verificar conteúdo do payload aqui (req.payload)
//   User.findById(req.payload._id).then( async user => {
//     if(!user){ return res.sendStatus(401); }
//     // carregar id no payload
//     return res.json({user: await user.toAuthJSON()});
//   }).catch(next);
// });

module.exports = router;