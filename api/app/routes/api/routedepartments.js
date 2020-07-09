const router = require('express').Router();
const Department = require('../../schemas/department');
const User = require ('../../schemas/user');

var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões

/**
 * Lista todos os departamentos.
 */
router.get(
  '/',
  auth.required,
  routePermission.check(permissionModule.DEPARTMENT.select),
  (req, res, next) => {
    Department.find().populate(['departResponsible'])
      .then(departments => res.json(departments))
      .catch(next);
  }
);

/**
 * Listar por ID.
 */
router.get(
  '/:id',
  auth.required,
  routePermission.check(permissionModule.DEPARTMENT.select),
  (req, res, next) => {
    const { id } = req.params;
    Department.findById(id).populate(['departResponsible'])
      .then(department => {
          if( department !== null) res.json(department);
          else res.json({ message: 'ID Não encontrado'});
      })
      .catch(next);
  }
);


/** 
 * Remove departamento e relacionamentos (_id - departamento) em Users.                   
 */
router.delete(
  '/:id',
  auth.required,
  routePermission.check(permissionModule.DEPARTMENT.delete),
  (req, res, next) => {
    const { id } = req.params;
      //TODO: FIX: Antes de apagar _id do responsável verificar em User se só a um depto associado ao usuário..
      Department.findByIdAndDelete( id )
      .then( department => {
        if( department !== null){
          res.json( { department } );
          // department.unrelateDepartUserTables();
          department.departResponsible.forEach( user => { // TODO: Migrar bloco para modelo Department
            User.findByIdAndUpdate(user, { $pull: { departments: department._id } }) // Procura em Department e remove
              .catch(next);
        });
        } else res.json({ message: 'ID Não encontrado'}); 
      })
      .catch(next); 
    }
);

/**
 * Insere novo Departamento e relaciona Departamento oas usuários apontados.
 */
router.post(
  '/', // Rota
  auth.required, // Validação JWT
  routePermission.check(permissionModule.DEPARTMENT.insert), // Permissão de acesso a rota 
  async (req, res, next) => {
      try{
        const { description, departResponsible } = req.body.department;

        await Department.create({ description,  departResponsible } )
        .then(async(department) => {
            //department.relatesDepartUserTables();
            if ( departResponsible !== undefined )
                await Promise.all(departResponsible.map(responsible => { // TODO: Migrar bloco para modelo Department
                  // TODO: verifica se ID sendo inserido já não existe em campo
                  User.findById(responsible)
                    .then(async (user) => {        
                      let isIdUserExists = false;

                      // Verifica se ID já existem em "departments"
                      user.departments.forEach(department => {
                        if(department.toString() === responsible) {
                          isIdUserExists = true; 
                          return;
                        }
                      });
                      
                      // Salva se não existe
                      if (!isIdUserExists){
                        user.departments.push(department); // { $push: { departments: department } } 
                        await user.save().catch((err) => {throw err;});                          
                      }
                    })
                    .catch((err) => {throw err;});
                }));
            return department; 
        })
        .then( department => { 
            res.json( { department } ); 
        })
        .catch((err) => {throw err;});
      } catch (err) { return res.status(500).send({ message: err.message}); }
  });

/**
 * Atualiza informações de um departamento
 */

router.patch(
  '/:id', 
  auth.required, 
  routePermission.check(permissionModule.DEPARTMENT.update), 
  async (req, res, next) => {
    const { id } = req.params;
    const reqDepartResponsible = req.body.department.departResponsible;
    
    try{
      await Department.findByIdAndUpdate(
        id, 
        req.body.department)
          .then(async department => {
            if(department !== null && Array.isArray( reqDepartResponsible ) ) // TODO: FIX: Esta reinserindo relacionamento em User mesmo se já há.
              await Promise.all(reqDepartResponsible.map(async (responsible) => { // TODO: Migrar bloco para modelo Department
                await User.findById(responsible)
                  .then(async (user) => {
                    let isIdUserExists = false;

                    // Verifica se ID já existem em "departments"
                    user.departments.forEach(department => {
                      if(department.toString() === id) {
                        isIdUserExists = true; 
                        return;
                      }
                    });
                    
                    // Salva se não existe
                    if (!isIdUserExists){
                      user.departments.push(department); // { $push: { departments: department } } 
                      await user.save().catch((err) => {throw err;});                          
                    }
                  })
                  .catch((err) => { throw err; });
              }));
            return department;
          })
          .then(department => {
              department 
              ? res.json({ department: { id: department._id, message:'Departamento alterado'} }) 
              : res.status(400).json({ department: { message: 'ID não encontrado' } });
          });
    }catch(err){
      return res.status(500).send({ message: err.message});
    }
});

module.exports = router;