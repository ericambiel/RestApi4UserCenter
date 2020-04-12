const router = require('express').Router();
const Department = require('../../models/department');
const User = require ('../../models/user');

var auth = require('../../common/auth'); // Verifica validade do TOKEN
const routePermission = require('../../common/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../common/PermissionModule'); // Tipos de permissões


/** 
 * Remove departamento e relacionamentos (_id - departamento) em Users.                   
 */
router.delete(
    '/:id',
    auth.required,
    routePermission.check( [ [permissionModule.DEPARTMENT.delete],[permissionModule.ROOT.delete] ] ),
    (req, res, next) => {
        const { id } = req.params;
    
        Department.findByIdAndDelete( id )
        .then( department => {
            if( department !== null){
                res.json( { department } );
                // department.unrelateUserTables();
                department.departResponsible.forEach( user => { // TODO: Migrar bloco para modelo Department
                    User.findByIdAndUpdate(user, { $pull: { departments: department._id } }) // Procura em Department e remove
                        .catch(next);
                })
            } else res.json({ error: 'ID Não encontrado'}); 
        }
        ).catch(next); 
    }
);

/**
 * Insere novo Departamento e relaciona Departamento oas usuários apontados.
 */
router.post(
        '/', // Rota
        auth.required, // Validação JWT
        routePermission.check( [ [permissionModule.DEPARTMENT.insert],[permissionModule.ROOT.insert] ] ), // Permissão de acesso a rota 
        async (req, res, next) => {
            try{
                const { description, departResponsible } = req.body.department;
    
                await Department.create({ description,  departResponsible } )
                .then( department => { 
                    res.json( { department } ); 
                    return department; 
                })
                .then( department => {
                    //department.relatesUserTables();
                    if ( departResponsible !== undefined ){
                        departResponsible.forEach(user => { // TODO: Migrar bloco para modelo Department
                            User.findByIdAndUpdate(user, { $push: { departments: department } })
                                .catch(next);
                        });
                    }
                }).catch(next);

                // Exemplo, mesma coisa do de cima
                // const department = new Department({ description, departResponsible });
                // department.save()
                // .then( () => res.json({ department }))
                // .then( () =>{
                //     // department.relatesUserTables()
                //     if ( departResponsible !== undefined ){
                //         departResponsible.forEach(user => { // TODO: Migrar bloco para modelo Department
                //             User.findByIdAndUpdate(user, { $push: { departments: department } })
                //                 .catch(next) 
                //         });
                //     }
                // })
                // .catch(next);
            } catch (err) {
                return res.status(400).send({ error: err.message})
            }
        });

module.exports = router;