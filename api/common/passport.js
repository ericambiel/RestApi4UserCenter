/**
 * Classe responsável por descrever estratégias do Passport
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
//const mongoose = require('mongoose');
//const User = mongoose.model('User');
const User = require('../models/user')

passport.use(new LocalStrategy({
  usernameField: 'userName', // Caso queira pegar de dentro de um objeto "user[username]"
  passwordField: 'password'
}, function(userName, password, done) {
  User.findOne({userName: userName}).then(user => {
    if(!user || !user.validPassword(password)){
      return done(null, false, {errors: {'credentials': 'Usuário ou senha inválidos.'}});
    }

    return done(null, user);
  }).catch(done);
}));