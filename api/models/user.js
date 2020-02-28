const mongoose = require('mongoose') // Associa o mesmo objeto instanciado "mongoose" na primeira vez
const validator = require('validator') // Classe usada para validações de dados

const userSchema = new mongoose.Schema({ // Define o Schema a ser usado pelo mongoDB
    nome: { type: String, require: true },
    sobreNome: { type: String, require: true },
    email: { type: String, 
        require: true, 
        unique: true, // Não deixa outro documento ter mesmo valor para este campo
        lowercase: true, // salva oque foi digitado em minusculo
        validate: (value) => { return validator.isEmail(value) } }, // Verifica se email é valido antes de salvar
    password: { type: Number, require: true },
    permissionLevel: { type: Number, require: true}
})

module.exports = mongoose.model('Users', userSchema) // Exporta ao objeto criado na primeira vez o modelo criado