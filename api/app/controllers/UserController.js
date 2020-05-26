const User = require('../schemas/user');

class UserController{
   constructor() {}
   
   /**
    * Encontra usuário por user name ou
    * @param {string} userName Nome do usuário.
    * @returns {User} Modelo do user populado.
    */
   findOneUser(userName) {
      return User
         .findOne({ $or: [{ userName: userName }, { adUser: userName }] })
         .catch(err => { throw err });
   }
}


module.exports = UserController;