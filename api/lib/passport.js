require('dotenv-safe').config({allowEmptyValues: true});
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const LDAP = require('../lib/LDAP');
const UserController = require('../app/controllers/UserController');
const ConsoleLog = require('../lib/ConsoleLog');

/**
 * Responsável por descrever estratégias do Passport
 */

 passport.use(new LocalStrategy({
  usernameField: 'userName', // Caso queira pegar de dentro de um objeto "user[username]"
  passwordField: 'password'
}, async (userName, password, callback) => {
  const user = await new UserController().findOneUser(userName);
    if(user !== null) {
      if (user.userName === userName && user.validPassword(password)){
        new ConsoleLog('info').printConsole(`[PASSPORT] ${userName} - Logou no sistema`);
        return callback(null, user);
      }
      if (user.adUser !== null && user.adUser === userName && process.env.LDAP_SERVER !== '') {
        const ldap = new LDAP();
        const response = await ldap.getUserAD(userName, password, userName);
        
        if (response.status > 400) { 
          new ConsoleLog('warn').printConsole(`[PASSPORT] ${userName} - Servidor LDAP retornou credenciais erradas`);
          return callback(null, false, { message: response.error.message });
        }
        new ConsoleLog('info').printConsole(`[PASSPORT] ${userName} - Logou no sistema via LDAP`);
        return callback(null, user);
      }
    } 
    new ConsoleLog('warn').printConsole(`[PASSPORT] ${userName} - Digitou senha incorreta`);
    return callback(null, false, { message: 'Usuário ou senha inválidos ou não é cadastrado no sistema.' });
  })
);