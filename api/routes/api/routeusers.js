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
        if ( user.departments )
          user.departments.map(department => {
             Department.findByIdAndUpdate(department, { $push: { departResponsible: user._id } })
                .catch( next );
          })
        await res.json({user: user}); 
        // await res.json({user: await user.toAuthJSON()}); //Retorna JWT
      }).catch(next);
  });

// TODO: Segmentar por funções
// function deleteUser(id, callback, err){
//   User.findByIdAndDelete(id)
//       .then( user => {
//         if (user)
//           return user.departments.map(department => {
//             return Department.findByIdAndUpdate(department, { $pull: { departResponsible: user._id } }, { new:true })
//                 .then( department => { return department; })
//                 .catch(err);
//           })
//         else return false;
//       }).then( (department) => { 
//          department 
//           ? callback = { user: {id: id, message:'Usuário Removido'}, department: department } 
//           : callback = { user: { message: 'ID não encontrado' } };
//       })
//       .catch(err);
// }

/** Deleta um usurário do sistema */
router.delete(
  '/:id', 
  auth.required, 
  routePermission.check([ [permissionModule.RH.update], [permissionModule.ROOT.delete] ]), 
  (req, res, next) => {
    const { id } = req.params;

    // TODO: Verificar como segmentar por funções
    // deleteUser(id, callback => {
    //   res.json(callback)
    // }, err => console.log(err))
      
    User.findByIdAndDelete(id)
      .then( user => {
        if (user)
          return user.departments.map(department => {
            return Department.findByIdAndUpdate(department, { $pull: { departResponsible: user._id } }, { new:true })
                .then( department => { return department; })
                .catch( next );
          })
        else return false;
      }).then( (department) => { 
        department 
          ? res.json({ user: {id: id, message:'Usuário Removido'}, department: department }) 
          : res.json({ user: { message: 'ID não encontrado' } }); 
      })
      .catch( next );
  }
)

/** Atualiza dados do Usuário pelo seu ID, relaciona Deptos ao Usuários */
// TODO: Verificar em Schema User, esta deixando atualizar sem informações em um array.
router.patch(
  '/:id', 
  auth.required, 
  routePermission.check([ [permissionModule.RH.update], [permissionModule.ROOT.update] ]), 
  (req, res, next) => {
    const { id } = req.params;
    const  reqDepartments  = req.body.user.departments;
    delete req.body.user.userName; // Remove a userName dos itens

    User.findByIdAndUpdate(id, req.body.user)
      .then(async user => {
        if(user) { 
          user.setPassword(req.body.user.password);
          // TODO: Verificar pq trás undefined mesmo satisfazendo promessas, depto apagado não esta sendo exibido no retorno.
          await user.save().then( user => {  // Apaga todos os relacionamentos antigos entre depto. e usuário
            user.departments.map( department => {
              return Department.findByIdAndUpdate(department, { $pull: { departResponsible: user._id } }, { new:true } )
                  .then( department => { return department; })
                  .catch( next );
            })
            // Refaz todos os relácionamentos novos entre depto. e usuário.
            if( Array.isArray( reqDepartments ) )
              reqDepartments.forEach( reqDepartment => {
                return Department.findByIdAndUpdate(reqDepartment, { $push: { departResponsible: user._id } }, { new:true })
                  .then( department => { return department })
                  .catch( next );
            });
          });
          return user;
        }
      }).then(user => {
        user 
        ? res.json({ user: { id: user._id, message:'Usuário Alterado'} }) 
        : res.status(400).json({ user: { message: 'ID não encontrado' } }); 
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