var router = require('express').Router();

var auth = require('../../common/auth'); // Verifica validade do TOKEN
const routePermission = require('../../common/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../common/PermissionModule'); // Tipos de permissões

const Contrato = require('../../models/Contrato')

/** 
 * Listar todos documentos de Contratos 
 */ 
router.get(
  '/', 
  auth.required, 
  routePermission.check([ [permissionModule.CONTRATO.select],[permissionModule.ROOT.select] ]), 
  (req, res) => {
    Contrato.find()
    .then(result => res.json(result))
    .catch(error => res.send(error))
  });

  router.get(
    '/',
    auth.required, 
    routePermission.check([ [permissionModule.CONTRATO.select],[permissionModule.ROOT.select] ]), 
    (req, res) => {
      Contrato.find()
      .then(result => res.json(result))
      .catch(error => res.send(error))
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