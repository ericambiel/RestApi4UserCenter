const router = require('express').Router();
var auth = require('../../common/auth');
const User = require('../../models/user');

// const mongoose = require('mongoose');
// const User = mongoose.model('User');

/** Atualiza dados do usuário */
router.put('/', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    // only update fields that were actually passed...
    if(typeof req.body.user.email !== 'undefined'){
      user.email = req.body.user.name;
    }
    if(typeof req.body.user.surname !== 'undefined'){
      user.email = req.body.user.email;
    }
    if(typeof req.body.user.email !== 'undefined'){
      user.email = req.body.user.email;
    }
    if(typeof req.body.user.password !== 'undefined'){
      user.setPassword(req.body.user.password);
    }
    if(typeof req.body.user.permissionLevel !== 'undefined'){
      user.email = req.body.user.email;
    }
    if(typeof req.body.user.image !== 'undefined'){
      user.image = req.body.user.image;
    }

    return user.save().then(function(){
      return res.json({user: user.toAuthJSON()});
    });
  }).catch(next);
});

/**
 * Insere novo usuário ao BD
 */
router.post('/', (req, res, next) => {
  const { userName, name, surname, email, password, 
    permissionLevel, adUser } = req.body;
  
  const user = new User();

  user.userName = userName;
  user.name = name; 
  user.surname = surname; 
  user.email = email; 
  user.setPassword(password);
  user.permissionLevel = permissionLevel;
  user.adUser = adUser;

  user.save()
    .then( () => res.json({user: user.toAuthJSON()}))
    .catch(next);
});

// /* GET users list. */
// router.get('/', (req, res, next) => {
//   User.find()
//   .then(result => res.json(result))
//   .catch(error => res.send(error))
// });

module.exports = router;