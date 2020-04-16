var router = require('express').Router();

var auth = require('../../common/auth'); // Verifica validade do TOKEN
const routePermission = require('../../common/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../common/PermissionModule'); // Tipos de permissões

const Contrato = require('../../models/Contrato')

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

function isResponsible(payloadJWT) {
  let isResponsible = false;
  payloadJWT.responsible.forEach(responsible => {
    if (payloadJWT._id === responsible) isResponsible = true;
  });
  return isResponsible;
}

/** Lista contratos filtrando pelo departamento do usuário. */
router.get(
  '/',
  auth.required, 
  routePermission.check([ [permissionModule.CONTRATO.select],[permissionModule.ROOT.select] ]), 
  async(req, res) => {
    const payloadJWT = req.payload;
    try{
      if(isResponsible(req.payload)){
        // //TODO: Quando os relacionamentos entre departamentos dos contratos e usuários forem feitos, receba somente _IDs dos usuários.
        // // MAP retorna array com departamentos do usuário  
        const departments = payloadJWT.departments.map(department => {return department.description});
        // find trás contratos para os responsáveis que estão em Depto. Participantes OU Responsáveis para qualquer contrato.
        Contrato.find(
            { $or:[ 
              {'deptoPartList.departamento': departments}, {'deptoResponsavel': departments} 
            ]} 
        )
        .then(result => res.json(result) )
        .catch(error => res.json(error) );
      } else res.status(400).json({
          errors: {contratos: 'Você não permissão para visualizar os contratos, contate a administração.'} });
    }catch(err){
      return res.status(400).send({ errors: err.message})
    }
});

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
      {new: true }) // Diz para o Mongo trazer as informações do documento já atualizadas ao invés de um pré visualização
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