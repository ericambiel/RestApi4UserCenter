const router = require('express').Router();
const User = require('../../schemas/user');
const Department = require('../../schemas/department');

var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões

const LDAP = require('../../../lib/LDAP');
// const MockUsersAD = require('../../test/mocks/LDAPUsers');

/**
 * Compara valores de dois arrays e retorna valores
 * que não estão no array atual.
 * @param {Array} previousArray Lista com valores antigos 
 * @param {Array} currentArray Lista com valores atuais
 * @returns {Array} Lista com valores não encontrados no array atual.
 */
function missingInArray(previousArray, currentArray){
  if( Array.isArray( previousArray ) && Array.isArray( currentArray )) {
    let currentSet = new Set(currentArray);
    return previousArray.filter(x => !currentSet.has(x));
  }
}

/**
 * Retorna usuários do Microsoft AD em um server LDAP.
 */
router.get(
  '/ldap_ad_users', 
  auth.required, 
  routePermission.check(permissionModule.RH.select), 
  async(req, res, next) => {
    try {
      // res.json(new MockUsersAD().usersADString); 
      res.json(await new LDAP().getUserAD().catch(err => { throw err } ));
    } catch(err) { next(err); }
  }
)

/**
 * Listar todos os Usuário
 */
router.get(
  '/', 
  auth.required, 
  routePermission.check(permissionModule.RH.select), 
  (req, res, next) => {
    User
      .find() // Trás todos
      .populate(['estabFiscal', 'departments', 'permissions']) // Troca todos id referenciados pelo valor dentro da Coleção
    .then(users => res.json(users))
    .catch(next)
  });

/**
 * Listar usuário (Ele mesmo)
 */
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
  routePermission.check(permissionModule.RH.insert), 
  (req, res, next) => {

    let user = new User(req.body.user);
    
    user.setPassword(req.body.user.password);

    user.save()
      .then( async user => {
        // if ( user.departments ) // TODO: Não é necessário ao inserir(apagar bloco).
        //   user.departments.map(department => {
        //      Department.findByIdAndUpdate(department, { $push: { departResponsible: user._id } })
        //         .catch( next );
        //   })
        await res.json({user: user}); 
        // await res.json({user: await user.toAuthJSON()}); //Retorna JWT
      }).catch(next);
  });

// TODO: Segmentar para funções, ler TODO abaixo
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
  routePermission.check(permissionModule.RH.update), 
  (req, res, next) => {
    const { id } = req.params;

    // TODO: Verificar como extrair bloco para função separada
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
  routePermission.check(permissionModule.RH.update), 
  (req, res, next) => {
    const { id } = req.params;
    const  reqDepartments  = req.body.user.departments;
    delete req.body.user.userName; // Remove a userName dos itens para que não possa altera-lo

    User.findByIdAndUpdate(id, req.body.user)
      .then(async user => {
        if(user) { 
          await user.setPassword(req.body.user.password);
          // TODO: Verificar pq trás undefined mesmo satisfazendo promessas, depto apagado não esta sendo exibido no retorno.
          // TODO: Alertar quando usuário a ser modificado for responsável da area. Remove do campo responsibleDep... quando responsável da depto.
          user.save().then( user => {  // Apaga todos os relacionamentos antigos entre depto. e usuário se responsável do depto.        
            // Converte Array Mongo ObjectId para Array String
            const previousDepartment = user.departments.map(department => { return department._id.toString() });
            // Retorna _IDs dos deptos que foram apagadas do usuário
            const missingDepartsID = missingInArray(previousDepartment, reqDepartments);

            if(missingDepartsID.length > 0)
              // Removera ID do do usuário do departamento ao qual ele não faz mais parte
              missingDepartsID.forEach( missingDepartID => {
                return Department.findByIdAndUpdate(missingDepartID, { $pull: { departResponsible: user._id } }, { new:true } )
                    .then( department => { return department; })
                    .catch( next );
              });           
          });
          return user;
        }
      }).then(user => {
        user 
        ? res.json({ user: { id: user._id, message:'Usuário alterado'} }) 
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