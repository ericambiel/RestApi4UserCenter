const router = require('express').Router();
const Departament = require('../../models/department');
const User = require ('../../models/user');

var auth = require('../../common/auth'); // Verifica validade do TOKEN
const routePermission = require('../../common/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../common/PermissionModule'); // Tipos de permissões



/**
 * Insere novo Departamento
 */
router.post(
        '/', // Rota
        auth.required, // Validação JWT
        routePermission.check( [ [permissionModule.DEPARTAMENT.insert],[permissionModule.ROOT.insert] ] ), // Permissão de acesso a rota 
        async (req, res, next) => {            
            const { description, departResponsible } = req.body.departament;

            await Departament.create({ description,  departResponsible } )
            .then( department => { 
                res.json( { department } ); 
                return department; 
            })
            .then( department => {
                //department.relatesUserTables();
                if ( departResponsible !== undefined ){
                    departResponsible.forEach(user => { // TODO: Migrar bloco para modelo
                        User.findByIdAndUpdate(user, { $push: { departments: department } })
                            .catch(next) 
                    });
                }
            }).catch(next);
            
            // Exemplo, mesma coisa do de cima
            // const department = new Departament({ description, departResponsible });
            // department.save()
            // .then( () => res.json({ department }))
            // .then( () =>{
            //     if ( departResponsible !== undefined ){
            //         // department.relatesUserTables()
            //         departResponsible.forEach(user => { // TODO: Migrar bloco para modelo
            //             User.findByIdAndUpdate(user, { $push: { departments: department } })
            //                 .catch(next) 
            //         });
            //     }
            // })
            // .catch(next);
        });

module.exports = router;