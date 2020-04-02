var router = require('express').Router();
const passport = require('passport');
var auth = require('../../common/auth');

const User = require('../../models/user');


/** Faz login do usuário no sistema */
router.post('/login', (req, res, next) => {  
  if(!req.body.user.userName){
    return res.status(422).json({errors: {userName: "não pode estar em branco"}});
  }

  if(!req.body.user.password){
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

/**  Verifica se o JWT do usuário é valido */
router.get('/', auth.required, (req, res, next) => {
  // Pode verificar conteúdo do payload aqui (req.payload)
  User.findById(req.payload.id).then(user => {
    if(!user){ return res.sendStatus(401); }

    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});

module.exports = router;