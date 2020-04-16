var router = require('express').Router();

var auth = require('../../common/auth'); // Verifica validade do TOKEN
const routePermission = require('../../common/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../common/PermissionModule'); // Tipos de permissões

const Permission = require('../../models/Permission')

/** 
 * Listar as permissões de módulos. 
 */ 
router.get('/', auth.required, routePermission.check(permissionModule.ROOT.select), (req, res) => {
    Permission.find()
    .then(result => res.json(result))
    .catch(error => res.send(error))
  });
  
  /**
   * Insere permissão ao BD.
   * Já faz a ligação entre Body da request e objeto modelo Permissão.
   */
  router.post('/', auth.required, routePermission.check(permissionModule.ROOT.insert), (req, res) => {
    const permissions = new Permission(req.body.permission)
    permissions.save()
      .then(result => res.json(result))
      .catch(error => res.send(error));
  });
  
  /**
   * Atualiza dPermissões.
   * Pode ser enviado somente objeto com valor a ser atualizado.
   */
  router.patch('/:id', auth.required, routePermission.check(permissionModule.ROOT.update), (req, res) => {
    const { id } = req.params; // Obtém parâmetro informado na URL
    
    Permission.findByIdAndUpdate( 
      id, // Id a ser modificado
      req.body, // Novos valores para serem atualizados, caso ele não encontre algum objeto iro somente utilizar os encontrados 
      { new: true }) // Diz para o Mongo trazer as informações do documento já atualizadas ao invés de um pré visualização
        .then(result => res.json(result))
        .catch(error => res.send(error));
  });
  
  /** 
   * Deletar uma permissão.
   */ 
  router.delete('/:id', auth.required, routePermission.check(permissionModule.ROOT.delete), (req, res) => {
    const { id } = req.params;
  
    Permission.findByIdAndDelete( id )
      .then(result => res.json(result)) // Envia Resultados das mudanças
      .catch(error => res.send(error)); // Caso contrario envia mensagem de erro 
  });

module.exports = router;