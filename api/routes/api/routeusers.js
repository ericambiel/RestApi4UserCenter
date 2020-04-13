const router = require('express').Router();
const User = require('../../models/User');
const Department = require('../../models/Department');

var auth = require('../../common/auth'); // Verifica validade do TOKEN
const routePermission = require('../../common/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../common/PermissionModule'); // Tipos de permissões

// const mongoose = require('mongoose');
// const User = mongoose.model('User');

/* Listar todos os Usuário */
router.get(
  '/', 
  auth.required, 
  routePermission.check([ [permissionModule.RH.select], [permissionModule.ROOT.select] ]), 
  (req, res, next) => {
    User
      .find() // Trás todos
      .populate(['estabFiscal', 'departments', 'permissions']) // Troca todos id referenciados pelo valor dentro da Coleção
    .then(users => res.json(users))
    .catch(next)
  });

  /* Listar usuário (Ele mesmo) */
router.get(
  '/myself', 
  auth.required, 
  routePermission.check([ [permissionModule.USER.select], [permissionModule.ROOT.select] ]), 
  (req, res, next) => {
    User
      .findById(req.payload.id)
      .populate(['estabFiscal', 'departments', 'permissions']) // Troca todos id referenciados pelo valor dentro da Coleção
    .then(user => res.json(user))
    .catch(next)
  });

/**
 * Insere novo usuário ao BD
 */
router.post(
  '/', 
  auth.required, 
  routePermission.check([ [permissionModule.RH.insert], [permissionModule.ROOT.insert] ]), 
  (req, res, next) => {

    let user = new User(req.body.user);
    
    user.setPassword(req.body.user.password);

    user.save()
      .then( async user => {
        if ( user.departResponsible )
          user.departments.map(department => {
             Department.findByIdAndUpdate(department, { $push: { departResponsible: user._id } })
                .catch( next );
          })
        await res.json({user: user}); 
        // await res.json({user: await user.toAuthJSON()}); //Retorna JWT
      }).catch(next);
  });

/** Deleta um usurário do sistema */
// TODO: Criar método para apagar usuário do sistema, testar!!!
router.delete(
  '/:id', 
  auth.required, 
  routePermission.check([ [permissionModule.RH.update], [permissionModule.ROOT.delete] ]), 
  (req, res, next) => {
    const { id } = req.params;
    
    User.findByIdAndDelete(id)
      .then( user => {
        if ( user )
          return user.departments.map(department => {
            Department.findByIdAndUpdate(department, { $pull: { departResponsible: user._id } })
                .then( department => { return department; })
                .catch( next );
          })
        else return false;
      }).then( (depart) => { 
        depart ? res.json( {user: {id: id, message:'Usuário Removido'} }) : res.json({user: { message: 'ID não encontrado' } }); 
      })
      .catch( next );
  }
)

/** Atualiza dados do Usuário pelo seu ID */
//TODO: Falta relacionar com tabela de Departamentos
router.patch(
  '/:id', 
  auth.required, 
  routePermission.check([ [permissionModule.RH.update], [permissionModule.ROOT.update] ]), 
  function(req, res, next) {
    const { id } = req.params;
    delete req.body.user.userName; // Remove a userName dos itens

    User.findByIdAndUpdate(id, req.body.user, {new: true })
      .then((user) => {
        if(!user) return res.sendStatus(401); 
        else {
          user.setPassword(req.body.user.password);

          return user.save().then(user => {
            return res.json({user: user});
          });
        }
    }).catch(next);
});

/** Atualiza dados do usuário (Ele mesmo) */
//TODO: Remover IFs, verificar post "routedepartments" 
router.patch(
  '/myself', 
  auth.required, 
  routePermission.check([ [permissionModule.USER.update], [permissionModule.ROOT.update] ]), 
  function(req, res, next) {
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
        if(typeof req.body.user.image !== 'undefined'){
          user.image = req.body.user.image;
        }

        return user.save().then(user => {
          return res.json({user: user});
        });
    }).catch(next);
});

module.exports = router;