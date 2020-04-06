const mongoose = require('mongoose') // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const validator = require('validator') // Classe usada para validações de dados
const uniqueValidator = require('mongoose-unique-validator'); //Verifica se é dado é no banco
const bcrypt = require('bcrypt'); // Criptografa senha a partir de um token.
var jwt = require('jsonwebtoken'); // Gerador Token JWT.
require("dotenv-safe").config(); // Configurações de ambiente.
permissionModule = require('../common/PermissionModule')

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
    refreshToken: {
        type: String
        // TODO: Implantar AKA Session Token
    },
    permissions:  { 
        type: [String], 
        default: permissionModule.BASIC.read,
        require: true },
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
    // Síncrono
    const result = bcrypt.compareSync(password, this.hashedPass);
    console.log(`(Login): ${this.userName} - ${result?'Logou no sistema':'Digitou senha incorreta'} - ${Date()}`);
    return result;
    
    // TODO: (Assíncrono) verificar como entregar ao endpoint resposta bcrypt de forma assíncrona para evitar gargalos de CPU.
    // return bcrypt.compare(password, this.hashedPass, (err, result) => {
    //     console.log(`(Login): ${this.userName} - ${result?'Logou no sistema':'Tentativa de Login falhou'} - ${Date()}`);
    //     return result;
    // });
};

/** Gera um Token JWT para usuário */
UserSchema.methods.generateJWT = function() {
    /* //caso não use opção expiresIn descomentar
    // var today = new Date();
    // var exp = new Date(today);
    // exp.setMinutes(today.getMinutes() + Number(process.env.EXPIRE_USER_TIME));*/
    
    // Cria Payloader, aqui você deve definir qual objetos estram no Payload do JWT.
    return jwt.sign({
        _id: this._id, // Usado pelo Rest por algum get do Front 
        userName: this.userName,
        name: this.name,
        surname: this.surname,
        image: this.image,
        permissions: this.permissions,
        //exp: parseInt(exp.getTime() / 1000), // caso não use opção expiresIn descomentar
    }, process.env.SECRET_JWT, 
    {
        expiresIn: Number(process.env.EXPIRE_USER_TIME) 
    });
};

/** Devolve Autenticação TOKEN JWT + objetos fora do token se precisar */
UserSchema.methods.toAuthJSON = function() {    
    // Retorna esses valores para o endPoint
    return {
//        userName: this.userName,
//        permissions: this.permissions,
//        email: this.email,
//        image: this.image,
        token: this.generateJWT(),
    };
};

UserSchema.plugin(uniqueValidator, { message: 'Esse valor já existe!' }); // Apply the uniqueValidator plugin to userSchema.

module.exports = mongoose.model('User', UserSchema)