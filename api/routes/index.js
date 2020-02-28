var express = require('express');
var router = express.Router();

//const ObjectID = require('mongoose').ObjectID;

const Contrato = require('../models/contrato')
const User = require('../models/user');

// /** Listar Contratos */ 
// router.get('/contratos', (req, res, next) => {
//   req.collection.find({})
//     .toArray()
//     .then(results => res.json(results))
//     .catch(error => res.send(error));
// });

router.get('/contratos', (req, res, next) => {
  Contrato.find()
  .then(result => res.json(result))
  .catch(error => res.send(error))
});

// /** Inserir Contratos */ 
// router.post('/contratos', (req, res, next) => {
//   const { appointmentDate, name, email } = req.body;
//   if (!appointmentDate || !name || !email) {
//     return res.status(400).json({
//       message: 'ERRO! Verifique objeto.',
//     });
//   }

//   const payload = { appointmentDate, name, email };
//   req.collection.insertOne(payload)
//     .then(result => res.json(result.ops[0]))
//     .catch(error => res.send(error));
// });

router.post('/contratos', (req, res, next) => {
  const contrato = new Contrato({
    objeto: req.body.objeto, 
    estabFiscal: req.body.estabFiscal, 
    parceiro: req.body.parceiro, 
    cnpj: req.body.cnpj, 
    status: req.body.status,
    situacao: req.body.situacao,
    valTotal: req.body.valTotal,         // Valor total
    valMensal: req.body.valMensal,
    dataInicio: req.body.dataInicio,
    dataFim: req.body.dataFim,
    deptoPartList: req.body.deptoPartList, // Lista de Departamentos associados
    indReajuste: req.body.indReajuste,
    diaAntecedencia: req.body.diaAntecedencia,  // Dias de antecedencia
    obs: req.body.obs,
    historico: req.body.historico,
    anaJuridico: req.body.anaJuridico,     // Analise juridica
    documentoList: req.body.documentoList
  })
  contrato.save()
    .then(result => res.json(result))
    .catch(error => res.send(error));
});

// /** Atualizar contrato */ 
// router.put('/contratos/:id', (req, res, next) => {
//   const { id } = req.params;
//   const _id = ObjectID(id); 
//   const { appointmentDate, name, email } = req.body;
//   if (!appointmentDate || !name || !email) {
//     return res.status(400).json({
//       message: 'ERRO! Verifique objeto.',
//     });
//   }

//   //const payload = { appointmentDate, name, email };
//   req.collection.updateOne(
//       { _id },
//       {$set: 
//         { 
//           appointmentDate,
//           name,
//           email 
//         }
//       })
//     .then(result => res.json(result))
//     .catch(error => res.send(error));
// });

/**
 * Atualiza Contrato
 * Pode ser enviado somente objeto com valor a ser atualizado
 */
router.put('/contratos/:id', (req, res, next) => {
  const { id } = req.params; // Obtem parametro informado na URL
  const items = req.body;

  Contrato.findByIdAndUpdate( 
    id, // Id a ser modificado
    items, // Novos valores para serem atualizados, caso ele não encontrel algum objeto iro somente utilizar os encontrados 
    {new: true }) // Diz para o Mongo trazer as informações do documento já atualizadas ao invez de um pré visualização
      .then(result => res.json(result))
      .catch(error => res.send(error));
});

// /** Deletar contrato  */ 
// router.delete('/contratos/:id', (req, res, next) => {
//   const { id } = req.params;
//   const _id = ObjectID(id);
//   req.collection.deleteOne({ _id })
//     .then(result => res.json(result)) // Envia Resultados das mudanças
//     .catch(error => res.send(error)); // Caso contrario envia menssagem de erro
// });

router.delete('/contratos/:id', (req, res, next) => { 
  const { id } = req.params;

  Contrato.deleteOne( { _id: id } )
    .then(result => res.json(result)) // Envia Resultados das mudanças
    .catch(error => res.send(error)); // Caso contrario envia menssagem de erro 
});

/** Inserir usuario */
router.post('/user', (req, res, next) => {
  const { nome, sobreNome, email, password, permissionLevel } = req.body;
  
  const user = new User({
    nome: nome, 
    sobreNome: sobreNome, 
    email: email, 
    password: password, 
    permissionLevel: permissionLevel
  })

  user.save()
    .then(result => res.json(result))
    .catch(error => res.send(error));
});

module.exports = router;
