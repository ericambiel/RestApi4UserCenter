var router = require('express').Router();

const User = require('../models/user');

/** 
 * Inserir documento em User
 */
router.post('/', (req, res, next) => {
  const { userName, nome, surname, email, password, 
    permissionLevel, adUser } = req.body;
  
  const user = new User({
    userName: userName,
    nome: nome, 
    surname: surname, 
    email: email, 
    password: password, 
    permissionLevel: permissionLevel,
    adUser: adUser
  })

  user.save()
    .then(result => res.json(result))
    .catch(error => res.send(error));
});

/* GET users list. */
router.get('/', (req, res, next) => {
  User.find()
  .then(result => res.json(result))
  .catch(error => res.send(error))
});


module.exports = router;