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
  User.findById(req.payload.id).then(user => {
    if(!user){ return res.sendStatus(401); }

    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});

// require("dotenv-safe").config();
// const JWT = require("../../common/jwt");
//
// /**
//  * Autenticara usuário no sistema
//  */
// app.post('/login', (req, res, next) => {
//   User.findOne()
//   if(req.body.user === 'luiz' && req.body.pwd === '123'){
//     //auth ok
//     const id = 1; //esse id viria do banco de dados
//     var token = JWT.createNewJWT({ id }, process.env.SECRET_JWT, {
//       expiresIn: 300 // expires in 5min
//     });
//     res.status(200).send({ auth: true, token: token });
//   }
  
//   res.status(500).send('Login inválido!');
// })

// app.get('/logout', function(req, res) {
//   res.status(200).send({ auth: false, token: null });
// });

module.exports = router;