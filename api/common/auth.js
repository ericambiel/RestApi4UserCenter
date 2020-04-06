const jwt = require('express-jwt');
require('dotenv-safe').config();

/**
 * Ira pegar do cabeçalho o token enviado pelo cliente.
 * @param {*} req Dados de requisição que veio de algum endPoint
 */
function getTokenFromHeader(req){
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'x-access-token') {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

/* Ira verificar se o token recebido foi alterado e é valido */
const auth = {
  // Usado em paginas que necessitamos de autenticação.
  required: jwt({
    secret: process.env.SECRET_JWT,
    userProperty: 'payload', //default 'user'
    getToken: getTokenFromHeader
  }),
  // Usado em paginas que NÂO necessitam de autenticação.
  optional: jwt({
    secret: process.env.SECRET_JWT,
    userProperty: 'payload', //default 'user'
    credentialsRequired: false,
    getToken: getTokenFromHeader
  })
};

module.exports = auth;