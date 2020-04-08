/**
 * Trabalha em conjunto jwtExpress para fornecer suporte 
 * a permissões de acesso a uma rota
 */
const guard = require("express-jwt-permissions")({
    requestProperty: 'payload', //default 'user'
    // permissionsProperty: 'permissions'
});

module.exports = guard;