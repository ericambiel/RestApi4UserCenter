require("dotenv-safe").config();
var jwt = require('jsonwebtoken');

class JWT{
    constructor() {}

    /**
     * 
     * @param {*} _id ID do usuário no BD
     * @returns novo Token.
     */
    createNewJWT(_id){
        return jwt.sign({ _id }, process.env.SECRET_JWT, {
            expiresIn: 300 // expires in 5min
        });
    }

    /**
     * Verifica se Token JWT é valido ou não. 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    verifyJWT(req, res, next){
        var token = req.headers['x-access-token'];
        if (!token) return res.status(401).send({ auth: false, message: 'Nenhum Token recebido.' });
        
        jwt.verify(token, process.env.SECRET_JWT, function(err, decoded) {
            if (err) return res.status(500).send({ auth: false, message: 'Falha ao autenticar seu token!' });
            
            // se tudo estiver ok, salva no request para uso posterior
            req.userId = decoded.id;
            next();
        });
    }
}

module.exports = JWT;