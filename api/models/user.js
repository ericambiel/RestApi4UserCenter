const mongoose = require('mongoose') // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const validator = require('validator') // Classe usada para validações de dados
const uniqueValidator = require('mongoose-unique-validator'); //Verifica se é dado é no banco
const bcrypt = require('bcrypt'); // Criptografa senha a partir de um token.
var jwt = require('jsonwebtoken'); // Gerador Token JWT.
require("dotenv-safe").config(); // Configurações de ambiente.

const UserSchema = new mongoose.Schema({ // Define o Schema a ser usado pelo mongoDB
    userName: { 
        type: String, 
        required: [true, 'Não pode estar em branco'],
        //match: [/^[a-zA-Z0-9]$/, 'Usuário Invalido'],
        unique: true,
        index: true, 
        lowercase: true },
    name: { 
        type: String, 
        require: true },
    surname: { 
        type: String, 
        require: true },
    email: { 
        type: String, 
        require: true, // Não deixa salvar no BD caso não seja informado.
        unique: true, // Não deixa outro documento ter mesmo valor para este campo
        index: true,
        lowercase: true, // salva oque foi digitado em minusculo
        validate: (value) => { return validator.isEmail(value) } }, // Verifica se email é valido antes de salvar
    hashedPass: { 
        type: String, 
        require: true },
    permissionLevel:  { 
        type: [String], 
        default: 'basic'} ,
    image: {
        type: String
    },
    adUser: { 
        type: String }
}, {timestamps: true, collection: 'Users'} )

/** Criptografa a senha ao criar usuário */
UserSchema.methods.setPassword = function(password) {
    const saltRounds = 12; // >= 12 mais seguro, maior mais lento.
    this.hashedPass = bcrypt.hashSync(password, saltRounds, (err, result) => {
        console.log(`(Sistema): Em Hashing a senha - ${!err?'bcrypt':err} - ${Date()}`);
        return result;
    });
};

UserSchema.methods.validPassword = function(password) {
    return bcrypt.compare(password, this.hashedPass, (err, result) => {
        console.log(`(Login): ${this.userName} - ${!err?'Senha invalida':err} - ${Date()}`);
        return result;
    });
};

/** Gera um Token JWT para usuário */
UserSchema.methods.generateJWT = function() {
    // var today = new Date();
    // var exp = new Date(today);

    // exp.setMinutes(today.getMinutes() + Number(process.env.EXPIRE_USER_TIME));
    
    // Cria Payloader
    return jwt.sign({
        id: this._id,
        userName: this.userName,
        //exp: parseInt(exp.getTime() / 1000), // caso não use opção expiresIn
    }, process.env.SECRET_JWT, 
    {
        expiresIn: Number(process.env.EXPIRE_USER_TIME) //
    });
};

/** Devolve Autenticação um TOKEN JWT */
UserSchema.methods.toAuthJSON = function() {
    var exp = new Date();

    exp.setUTCSeconds(exp.getSeconds() + Number(process.env.EXPIRE_USER_TIME));
    
    return {
        userName: this.userName,
//        email: this.email,
//        image: this.image,
        token: this.generateJWT(),
        tokenExpire: exp
    };
};

UserSchema.plugin(uniqueValidator, { message: 'Esse valor já existe!' }); // Apply the uniqueValidator plugin to userSchema.

module.exports = mongoose.model('User', UserSchema)