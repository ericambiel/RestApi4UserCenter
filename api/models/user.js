require("dotenv-safe").config(); // Configurações de ambiente.
require('./estabFiscal'); // Necessários caso use referencia ao Model
require('./Department');
const Permissions = require('./Permission');
const mongoose = require('mongoose') // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const Schema = mongoose.Schema;
const validator = require('validator') // Classe usada para validações de dados
const uniqueValidator = require('mongoose-unique-validator'); //Verifica se é dado é no banco
const bcrypt = require('bcrypt'); // Criptografa senha a partir de um token.
const mongooseHidden = require('mongoose-hidden')();
var jwt = require('jsonwebtoken'); // Gerador Token JWT. 

const UserSchema = new Schema({ // Define o Schema a ser usado pelo mongoDB
    userName: { 
        type: String, 
        required: [true, 'Não pode estar em branco'],
        //match: [/^[a-zA-Z0-9]$/, 'Usuário Invalido'],
        unique: true,
        index: true, 
        lowercase: true },
    name: { 
        type: String, 
        required: [true, 'Não pode estar em branco'] },
    surname: { 
        type: String, 
        required: [true, 'Não pode estar em branco'] },
    email: {
        type: String, 
        // required: [true, 'Não pode estar em branco'], // Não deixa salvar no BD caso não seja informado.
        unique: true, // Não deixa outro documento ter mesmo valor para este campo
        index: true,
        lowercase: true, // salva oque foi digitado em minusculo
        validate: (value) => { return validator.isEmail(value) } }, // Verifica se email é valido antes de salvar
    phone: {
        type: [ Number ] },
    birthDate: {
        type: Date },
    cpf: {
        type: Number },
    adUser: { 
        type: String },
    hashedPass: {
        type: String, 
        required: [true, 'Não pode estar em branco'],
        hide: true }, // Esconde campo em um request 
    image: {
        type: String },
    isActive: { 
        type: Boolean,
        default: true },
    departments: {
        type: [ { 
            type: Schema.Types.ObjectId,
            ref: 'Department' } ],
        default: undefined, // Quando vier vazio respeita condição de required
        required: [ true, 'Necessário apontar um ID de Departamento' ] } ,
    estabFiscal: {
        type: Schema.Types.ObjectId, 
        ref: 'EstabFiscal',
        required: [ true, 'Necessário apontar um ID de Estabelecimento Fiscal' ] },
    permissions:  { 
        type:  [ { 
            type: Schema.Types.ObjectId, 
            ref: 'Permission' } ],
        default: undefined, 
        required: [ true, 'Necessário apontar um ID de Permissão' ],
        //validate : { validator : (array) => { return array.every((v) => typeof v === 'string'); } }    
    },
    refreshToken: {
        type: String,
        // TODO: Implantar AKA Session Token
    },
    
}, {timestamps: true, collection: 'Users'} )

/** Criptografa a senha ao criar usuário */
UserSchema.methods.setPassword = function(password) {
    if(typeof password !== 'undefined'){
        const saltRounds = 12; // >= 12 mais seguro, maior mais lento.
        this.hashedPass = bcrypt.hashSync(password, saltRounds, (err, result) => { // TODO: Mudar para Assíncrono.
            console.log(`(Sistema): Hashing a senha - ${!err?'bcrypt':err} - ${Date()}`);
            return result;
        });
    }
};

UserSchema.methods.validPassword = function(password) {
    // Síncrono
    const result = bcrypt.compareSync(password, this.hashedPass);
    console.log(`(Login): ${this.userName} - ${result?'Logou no sistema':'Digitou senha incorreta'} - ${Date()}`);
    return result;
    
    // TODO: (Assíncrono) verificar como entregar ao endpoint resposta bcrypt de forma assíncrona para evitar bloqueio da thread principal.
    // return bcrypt.compare(password, this.hashedPass, (err, result) => {
    //     console.log(`(Login): ${this.userName} - ${result?'Logou no sistema':'Tentativa de Login falhou'} - ${Date()}`);
    //     return result;
    // });
};

/** Gera um Token JWT, dados do usuário e permissões de acesso.*/
UserSchema.methods.generateJWT = async function() {
    /* //caso não use opção expiresIn descomentar
    // var today = new Date();
    // var exp = new Date(today);
    // exp.setMinutes(today.getMinutes() + Number(process.env.EXPIRE_USER_TIME));*/

    let _permissions = [];

    await Permissions.find( { _id: this.permissions })
        .then( permissions => {
            // _permissions = permissions; // Enviar objeto inteiro com _id, comentar linhas map
            permissions.map( permission => {
                _permissions.push(permission.permission);
            })
        });
        
    // Cria Payload, aqui você deve definir qual objetos estarão no Payload do JWT.
    return jwt.sign({
        _id: this._id, // Usado pelo Rest por algum get do Front 
        userName: this.userName,
        name: this.name,
        surname: this.surname,
        image: this.image,
        departments: this.departments,
        permissions: _permissions,
        //exp: parseInt(exp.getTime() / 1000), // caso não use opção expiresIn descomentar
    }, process.env.SECRET_JWT, 
    {
        expiresIn: Number(process.env.EXPIRE_USER_TIME) 
    })
}
    

/** Devolve Autenticação TOKEN JWT + objetos fora do token se precisar */
UserSchema.methods.toAuthJSON = async function() {    
    // Retorna esses valores para o endPoint
    return {
//        userName: this.userName,
//        permissions: this.permissions,
//        email: this.email,
//        image: this.image,
       token: await this.generateJWT(),
    };
};

UserSchema.plugin(uniqueValidator, { message: 'Esse valor já existe!' }); // Apply the uniqueValidator plugin to userSchema.
UserSchema.plugin(mongooseHidden, {defaultHidden: { autoHideJSON: 'false', autoHideObject: 'false' } }) // Biblioteca necessária para esconder campos. 'false' exibe _id

module.exports = mongoose.model('User', UserSchema)