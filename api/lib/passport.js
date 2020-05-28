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
    try{
      const user = await new UserController().findOneUser(userName).catch(err => {throw err});

      // Local user, DB
      if (user !== null && user.userName === userName && user.validPassword(password)){
        new ConsoleLog('info').printConsole(`[PASSPORT] ${userName} - Logou no sistema`);
        return callback(null, user);
      } 
      
      // Remote user - LDAP - AD
      else if (user !== null && user.adUser !== null && user.adUser === userName && process.env.LDAP_SERVER !== '') {
        await new LDAP().getUserAD(userName, password, userName)
          .then(res => {
            if (res.status !== undefined) { 
              new ConsoleLog('info').printConsole(`[PASSPORT] ${userName} - Servidor LDAP retornou: ${res.message}`);
              return callback(null, false, res);
            }
            new ConsoleLog('info').printConsole(`[PASSPORT] ${userName} - Logou no sistema via LDAP`);
            return callback(null, user);
          }).catch(err => { throw err; });
      }
  
      else {
        new ConsoleLog('warn').printConsole(`[PASSPORT] ${userName} - Digitou senha incorreta`);
        return callback(null, false, { message: 'Usuário ou senha inválidos ou não é cadastrado no sistema.' });
      }
    } catch (err) { return callback(err); }
  })
);