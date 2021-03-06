const router = require('express').Router();
const passport = require('passport');
const LDAP = require('../../../lib/LDAP');

// var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
// const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
// const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões

// const User = require('../../schemas/user');


/** Faz login do usuário no sistema */
router.post('/login', (req, res, next) => {  
  if(!req.body.userName){
    return res.status(422).json({message: 'Usuário não pode estar em branco' });
  }

  if(!req.body.password){
    return res.status(422).json({message: 'Senha não pode estar em branco' });
  }
  
  // session: false - Pq usamos JWT ao invés de seções
  passport.authenticate('local', {session: false}, async (err, user, info) => {
    if(err && err.status !== undefined) 
      return res.status(err.status).json(err.error);
    else if(err)
      return next(err);

    if(user){
      // user.token = user.generateJWT();
      return res.json({user: await user.toAuthJSON()});
    } else {
      return res.status(401).json(info.error);
    }
  })(req, res, next);
});

router.get('/ldap_status', async (req, res, next) => {
  await new LDAP().ldapServerStatus()
      .then((client, message) => res.json({message: message}) )
      .catch(err => err.status ? res.status(err.status).json(err.error) : next(err) );
})

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