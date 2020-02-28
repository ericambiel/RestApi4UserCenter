var router = require('express').Router();

const Contrato = require('../models/contrato')

/** 
 * Listar todos documentos de Contratos 
 */ 
router.get('/', (req, res, next) => {
    Contrato.find()
    .then(result => res.json(result))
    .catch(error => res.send(error))
  });
  
  /**
   * Insere documento em Contratos
   * Já faz a ligação entre Body da request e obejeto modelo Contrato 
   */
  router.post('/', (req, res, next) => {
    const contrato = new Contrato(req.body)
    contrato.save()
      .then(result => res.json(result))
      .catch(error => res.send(error));
  });
  
  /**
   * Atualiza documento em Contratos
   * Pode ser enviado somente objeto com valor a ser atualizado
   */
  router.patch('/:id', (req, res, next) => {
    const { id } = req.params; // Obtem parametro informado na URL
    const items = req.body;
    
    Contrato.findByIdAndUpdate( 
      id, // Id a ser modificado
      items, // Novos valores para serem atualizados, caso ele não encontrel algum objeto iro somente utilizar os encontrados 
      {new: true }) // Diz para o Mongo trazer as informações do documento já atualizadas ao invez de um pré visualização
        .then(result => res.json(result))
        .catch(error => res.send(error));
  });
  
  /** 
   * Deletar documento em Contratos  
   */ 
  router.delete('/:id', (req, res, next) => { 
    const { id } = req.params;
  
    Contrato.findByIdAndDelete( id )
      .then(result => res.json(result)) // Envia Resultados das mudanças
      .catch(error => res.send(error)); // Caso contrario envia menssagem de erro 
  });

module.exports = router;