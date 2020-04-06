var router = require('express').Router();
const passport = require('passport');

var auth = require('../../common/auth');
const routePermission = require('../../common/PermissionRoutes');
const permission = require('../../common/PermissionModule');

const User = require('../../models/user');


/** Faz login do usuário no sistema */
router.post('/login', (req, res, next) => {  
  if(!req.body.userName){
    return res.status(422).json({errors: {userName: "não pode estar em branco"}});
  }

  if(!req.body.password){
    return res.status(422).json({errors: {password: "não pode estar em branco"}});
  }
  
  // session: false - Pq usamos JWT ao invés de seções
  passport.authenticate('local', {session: false}, (err, user, info) => {
    if(err){ return next(err); }

    if(user){
      user.token = user.generateJWT();
      return res.json({user: user.toAuthJSON()});
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

/**  Verifica se ID no payload do JWT é valido */
router.get('/', auth.required, routePermission.check(permission.BASIC.read), (req, res, next) => {
  // Pode verificar conteúdo do payload aqui (req.payload)
  User.findById(req.payload._id).then(user => {
    if(!user){ return res.sendStatus(401); }
    // carregar id no payload
    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});

module.exports = router;