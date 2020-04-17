const router = require('express').Router();
const Department = require('../../models/Department');
const User = require ('../../models/User');

var auth = require('../../common/auth'); // Verifica validade do TOKEN
const routePermission = require('../../common/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../common/PermissionModule'); // Tipos de permissões

/**
 * Lista todos os departamentos.
 */
router.get(
    '/',
    auth.required,
    routePermission.check( [ [permissionModule.DEPARTMENT.select],[permissionModule.ROOT.select] ] ),
    (req, res, next) => {
        Department.find().populate(['departResponsible'])
            .then(departments => res.json(departments))
            .catch(next)
    }
)

/**
 * Listar por ID.
 */
router.get(
    '/:id',
    auth.required,
    routePermission.check( [ [permissionModule.DEPARTMENT.select],[permissionModule.ROOT.select] ] ),
    (req, res, next) => {
        const { id } = req.params;
        Department.findById(id).populate(['departResponsible'])
            .then(department => {
                if( department !== null) res.json(department)
                else res.json({ error: 'ID Não encontrado'});
            })
            .catch(next)
    }
)


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
                // department.unrelateDepartUserTables();
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
                    //department.relatesDepartUserTables();
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
                return res.status(400).send({ errors: err.message})
            }
        });

/**
 * Atualiza informações de um departamento
 */
//TODO: FIX: Antes de apagar _id do responsável verificar em User se só a um depto associado ao usuário..
router.patch(
    '/:id', 
    auth.required, 
    routePermission.check([ [permissionModule.DEPARTMENT.update],[permissionModule.ROOT.update] ]), 
    async (req, res, next) => {
        const { id } = req.params;
        const reqDepartResponsible = req.body.department.departResponsible;
        
        try{
            await Department.findByIdAndUpdate(
                id, 
                req.body.department)
                    .then(department => {
                        //department.relatesDepartUserTables();
                        if ( department !== null ){
                        // TODO: Bloco remove departamento do usuário caso deixe de ser responsável, não é mais a politica mais, apagar!!! 
                        //     department.departResponsible.forEach(async user => { // TODO: Migrar bloco para modelo Department
                        //         await User.findByIdAndUpdate(user, { $pull: { departments: department._id } })
                        //             .catch(next); // TODO: FIX: Não esta indo para response quando há erros
                        //         });
                            if( Array.isArray( reqDepartResponsible ) ) // TODO: FIX: Esta reinserindo relacionamento em User mesmo se já há.
                                reqDepartResponsible.forEach(responsible => {
                                    User.findByIdAndUpdate(responsible, { $push: { departments: department._id } })
                                        .catch(next); // TODO: FIX: Não esta indo para response quando há erros
                                    });
                        }
                        return department 
                    })
                    .then(department => {
                        department 
                        ? res.json({ department: { id: department._id, message:'Departamento alterado'} }) 
                        : res.status(400).json({ department: { message: 'ID não encontrado' } });
                    });
        }catch(err){
            return res.status(400).send({ errors: err.message})
        }
});

module.exports = router;