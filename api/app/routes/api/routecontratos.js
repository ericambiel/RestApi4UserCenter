var router = require('express').Router();

var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões
const controller = require('../../controllers/ContractController');

const Contrato = require('../../schemas/contrato');

// /** 
//  * Listar todos documentos de Contratos 
//  */ 
// router.get(
//   '/', 
//   auth.required, 
//   routePermission.check([ [permissionModule.CONTRATO.select],[permissionModule.ROOT.select] ]), 
//   (req, res) => {
//     Contrato.find()
//     .then(result => res.json(result))
//     .catch(error => res.send(error))
//   });

/** 
 * Lista contratos filtrando pelo departamento do usuário. 
 * Caso for do departamento "Controladoria" exibe todos, caso contrario e 
 * se responsável, exibe somente contratos associados ao seu departamento.
*/
router.get(
  '/',
  auth.required, 
  routePermission.check([ [permissionModule.CONTRATO.select],[permissionModule.ROOT.select] ]), 
  async(req, res) => {
    try{
      const auditDepartment = 'Controladoria'; // Responsável pelo depto. que pode ver todos os contratos.
      const _imResponsibleFor = controller.imResponsibleFor(req.payload);
    
      // TODO: Quando os relacionamentos entre departamentos dos contratos e usuários forem feitos, comparar com _id do departamento.
      // TODO: Passar para controller
      if( _imResponsibleFor.includes(auditDepartment) ) { // Se da Controladoria/Auditoria.
        Contrato.find()
          .then(result => res.json(result) )
          .catch(error => res.json(error) );
      } else if(_imResponsibleFor.length > 0 ) { // Se maior que 0, usuário é responsável por algum Depto.        
        // find trás contratos para os responsáveis que estão em Depto. Participantes OU Responsáveis para qualquer contrato.7
        Contrato.find(
            { $or:[ 
              {'deptoPartList.departamento': _imResponsibleFor}, 
              {'deptoResponsavel': _imResponsibleFor} 
            ]} 
          )
          .then(result => res.json(result))
          .catch(error => res.json(error));
      } else res.status(403).json({
        message: 'Você não possui permissão para visualizar os contratos,\n necessário ser responsável pelo departamento.'
        });
    }catch(err){
      return res.status(500).send({ message: err.message})
    }
});

/**
 * Altera campos de dados do tipo String para Date
 * e remove campos data que estiverem nulos
 * // TODO: Pode ser apagado quando forem feitas todas as
 * // conversoes no banco PRD.
 */
// router.post(
//   '/normalize_date_fields',
//   auth.required, 
//   routePermission.check([ [permissionModule.ROOT.remove], [permissionModule.ROOT.update] ]), 
//   async(req, res, next) => {
//     // const today = moment().startOf('day');
//     // const aYear = moment(today).endOf('year');
//     try{
//       // Remove campos dataFim = null
//       await Contrato.updateMany( { dataFim: null }, { $unset: { dataFim:1 } } )
//         .then(async () => {
//           // Converte campos StringDate para ISODate
//           await Contrato.find()
//           .then(async contratos => {
//             return await Promise.all(
//               contratos.map(async contrato => {
//                 if ( !isNaN(Date.parse(contrato.dataInicio)) ) // Se for possível converter para Date
//                   contrato.dataInicio = new Date(Date.parse(contrato.dataInicio)).setMilliseconds(1);
//                 if ( !isNaN(Date.parse(contrato.dataFim)) ) 
//                   contrato.dataFim = new Date(contrato.dataFim).setMilliseconds(1);
//                 contrato.documentoList.forEach(documento => {
//                     if ( !isNaN(Date.parse(documento.dataInsert)) ) 
//                       documento.dataInsert = new Date(documento.dataInsert).setMilliseconds(1);
//                 })
//                 return await contrato.save(contrato).catch(err => {throw err}); 
//               })
//             );
//           })
//           .then(contratos => res.json(contratos))
//           .catch(err => {throw err});
//         })
//         .catch(err => { throw err });
//     }catch(err) { next(err); }
// })

/**
 * Insere documento em Contratos
 * Já faz a ligação entre Body da request e objeto modelo Contrato 
 */
router.post(
  '/', 
  auth.required, 
  routePermission.check([ [permissionModule.CONTRATO.insert],[permissionModule.ROOT.insert] ]), 
  (req, res) => {
    const contrato = new Contrato(req.body)
    contrato.save()
      .then(result => res.json(result))
      .catch(error => res.send(error));
});

// TODO:FIX: Após criação de controller não trás mais itens enviados.
/** Envia email para Contratos expirados */
router.post(
  '/expirados',
  auth.required, 
  routePermission.check([ [permissionModule.ROOT.update], [permissionModule.ROOT.insert] ]), 
  async(req, res, next) => {
    try{ res.json(await controller.expiredContracts()); }
    catch(err){ next(err); }
})

router.post(
  '/expirando',
  auth.required, 
  routePermission.check([ [permissionModule.ROOT.update], [permissionModule.ROOT.insert] ]), 
  async(req, res, next) => {
    try{ res.json(await controller.expiringContracts()); }
    catch(err){ next(err); }
})

router.post(
  '/indeterminados',
  auth.required, 
  routePermission.check([ [permissionModule.ROOT.update], [permissionModule.ROOT.insert] ]), 
  async(req, res, next) => {
    try{ res.json(await controller.indeterminateContracts()); }
    catch(err){ next(err); }
})

/**
 * Atualiza documento em Contratos
 * Pode ser enviado somente objeto com valor a ser atualizado
 */
router.patch(
  '/:id', 
  auth.required, 
  routePermission.check([ [permissionModule.CONTRATO.update],[permissionModule.ROOT.update] ]), 
  (req, res) => {
    const { id } = req.params; // Obtém parâmetro informado na URL
    const items = req.body;
    
    Contrato.findByIdAndUpdate( 
      id, // Id a ser modificado
      items, // Novos valores para serem atualizados, caso ele não encontre algum objeto iro somente utilizar os encontrados 
      {// upsert: true, setDefaultsOnInsert: true, // Verifica "defaults" em Schema caso haja alteração.
       new: true }) // Diz para o Mongo trazer as informações do documento já atualizadas ao invés de um pré visualização
        .then(result => res.json(result))
        .catch(error => res.send(error));
});

/** 
 * Deletar documento em Contratos  
 */ 
router.delete(
  '/:id', 
  auth.required, 
  routePermission.check([ [permissionModule.CONTRATO.delete],[permissionModule.ROOT.select] ]), 
  (req, res) => {
    const { id } = req.params;
  
    Contrato.findByIdAndDelete( id )
      .then(result => res.json(result)) // Envia Resultados das mudanças
      .catch(error => res.send(error)); // Caso contrario envia mensagem de erro 
});

module.exports = router;