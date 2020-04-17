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

/**
 * Listara quais departamentos o usuário em Payload é responsável
 * @param {*} payloadJWT Payload com informações do usuário.
 * @returns {Array} Retorna lista com departamentos responsável.
 */
function imResponsibleFor(payloadJWT) {
  try{
    let imResponsibleFor = new Set(); // Não deixa add valores repetidos.
    payloadJWT.departments.map(department => {
      department.departResponsible.map(responsible => {
        if (responsible === payloadJWT._id) 
          imResponsibleFor.add(department.description);
        });
    });
    imResponsibleFor = Array.from(imResponsibleFor); // Transforma em um Array
    return imResponsibleFor;
  }catch(err) { return new Error(err); }
}

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
      const _imResponsibleFor = imResponsibleFor(req.payload);
    
      //TODO: Quando os relacionamentos entre departamentos dos contratos e usuários forem feitos, comparar com _id do departamento.
      if( _imResponsibleFor.includes(auditDepartment) ) { // Se da Controladoria/Auditoria.
        Contrato.find()
          .then(result => res.json(result) )
          .catch(error => res.json(error) );
      } else if(_imResponsibleFor.length > 0 ) { // Se maior que 0, usuário é responsável por algum Depto.        
        // find trás contratos para os responsáveis que estão em Depto. Participantes OU Responsáveis para qualquer contrato.7
        Contrato.find(
            { $or:[ 
              {'deptoPartList.departamento': _imResponsibleFor}, {'deptoResponsavel': _imResponsibleFor} 
            ]} 
          )
          .then(result => res.json(result) )
          .catch(error => res.json(error) );
      } else res.status(400).json({
          errors: {contratos: 
            'Você não possui permissão para visualizar os contratos,\n necessário ser responsável do departamento.'} 
        });
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