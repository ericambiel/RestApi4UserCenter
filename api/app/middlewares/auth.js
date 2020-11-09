const jwt = require('express-jwt');

/**
 * Ira pegar do cabeçalho da requisição enviado pelo cliente
 * e verificar se existe um JWT .
 * @param {*} req Dados de requisição que veio de algum endPoint
 * @return {*} Somente JWT
 */
function getTokenFromHeader(req){
  const token = req.headers['x-access-token'] || req.headers['authorization'] || ''; // Express headers are auto converted to lowercase
  if (token !== '' || token.startsWith('Bearer ')) { // Tipo do token
    return token.split(' ')[1];
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
    userProperty: 'payload', // default 'user' 
    credentialsRequired: false,
    getToken: getTokenFromHeader
  })
};

module.exports = auth;