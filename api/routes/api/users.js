const router = require('express').Router();
const User = require('../../models/user');

var auth = require('../../common/auth'); // Verifica validade do TOKEN
const routePermission = require('../../common/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../common/PermissionModule'); // Tipos de permissões

// const mongoose = require('mongoose');
// const User = mongoose.model('User');

/** Atualiza dados do usuário */
router.put('/', auth.required, routePermission.check(permissionModule.USER.select), function(req, res, next){
  User.findById(req.payload.id)
    .then((user) => {
      if(!user){ return res.sendStatus(401); }

      // only update fields that were actually passed...
      if(typeof req.body.user.name !== 'undefined'){
        user.name = req.body.user.name;
      }
      if(typeof req.body.user.surname !== 'undefined'){
        user.surname = req.body.user.surname;
      }
      if(typeof req.body.user.email !== 'undefined'){
        user.email = req.body.user.email;
      }
      if(typeof req.body.user.password !== 'undefined'){
        user.setPassword(req.body.user.password);
      }
      if(typeof req.body.user.permissions !== 'undefined'){
        user.permissions = req.body.user.permissions;
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
router.post('/', auth.required, routePermission.check(permissionModule.USER.select), (req, res, next) => {
  let user = new User(req.body.user);

  //user = req.body;
  // user.userName = req.body.userName;
  // user.name = req.body.name; 
  // user.surname = req.body.surname; 
  // user.email = req.body.email; 
  user.setPassword(req.body.user.password);
  // user.adUser = req.body.adUser;
  
  user.save()
    .then( () => res.json({user: user.toAuthJSON()}))
    .catch(next);
});

/* GET users list. */
router.get('/', auth.required, routePermission.check(permissionModule.USER.select), (req, res) => {
  User
    .find() // Trás todos
    .populate(['estabFiscal', 'departments', 'permissions']) // Troca todos id referenciados pelo valor dentro da Coleção
  .then(result => res.json(result))
  .catch(error => res.send(error))
});

module.exports = router;