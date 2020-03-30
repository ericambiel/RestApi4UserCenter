const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
//const mongoose = require('mongoose');
//const User = mongoose.model('User');
const User = require('../models/user')

passport.use(new LocalStrategy({
  usernameField: 'user[userName]',
  passwordField: 'user[password]'
}, function(userName, password, done) {
  User.findOne({userName: userName}).then(user => {
    if(!user || !user.validPassword(password)){
      return done(null, false, {errors: {'Usuário ou Senha': 'é invalido'}});
    }

    return done(null, user);
  }).catch(done);
}));