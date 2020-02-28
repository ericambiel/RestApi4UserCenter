var express = require('express');
var router = express.Router();

const ObjectID = require('mongoose').ObjectID;

const UserModel = require('../models/user');

/** Listar Contratos */ 
router.get('/contratos', (req, res, next) => {
  req.collection.find({})
    .toArray()
    .then(results => res.json(results))
    .catch(error => res.send(error));
});

/** Inserir Contratos */ 
router.post('/contratos', (req, res, next) => {
  const { appointmentDate, name, email } = req.body;
  if (!appointmentDate || !name || !email) {
    return res.status(400).json({
      message: 'ERRO! Verifique objeto.',
    });
  }

  const payload = { appointmentDate, name, email };
  req.collection.insertOne(payload)
    .then(result => res.json(result.ops[0]))
    .catch(error => res.send(error));
});

/** Atualizar contrato */ 
router.put('/contratos/:id', (req, res, next) => {
  const { id } = req.params;
  const _id = ObjectID(id); // Obtem parametro informado na URL
  const { appointmentDate, name, email } = req.body;
  if (!appointmentDate || !name || !email) {
    return res.status(400).json({
      message: 'ERRO! Verifique objeto.',
    });
  }

  //const payload = { appointmentDate, name, email };
  req.collection.updateOne(
      { _id },
      {$set: 
        { 
          appointmentDate,
          name,
          email 
        }
      })
    .then(result => res.json(result))
    .catch(error => res.send(error));
});

/** Deletar contrato  */ 
router.delete('/contratos/:id', (req, res, next) => {
  const { id } = req.params;
  const _id = ObjectID(id);
  req.collection.deleteOne({ _id })
    .then(result => res.json(result)) // Envia Resultados das mudanças
    .catch(error => res.send(error)); // Caso contrario envia menssagem de erro
});

/** Inserir usuario */
router.post('/user', (req, res, next) => {
  const { nome, sobreNome, email, password, permissionLevel } = req.body;
  
  const user = new UserModel({
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
