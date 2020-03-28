const mongoose = require('mongoose') // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const validator = require('validator') // Classe usada para validações de dados
const uniqueValidator = require('mongoose-unique-validator'); //Verifica se é dado é no banco

const userSchema = new mongoose.Schema({ // Define o Schema a ser usado pelo mongoDB
    userName: { 
        type: String, 
        required: true,
        unique: true, 
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
        lowercase: true, // salva oque foi digitado em minusculo
        validate: (value) => { return validator.isEmail(value) } }, // Verifica se email é valido antes de salvar
    password: { 
        type: String, 
        require: true },
    permissionLevel:  { 
        type: [String], 
        default: 'basic'} ,
    adUser: { 
        type: String }
}, {collection: 'Users'})

userSchema.plugin(uniqueValidator); // Apply the uniqueValidator plugin to userSchema.

module.exports = mongoose.model('Users', userSchema) // Exporta ao objeto criado na primeira vez o modelo criado