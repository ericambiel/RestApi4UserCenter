const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator'); //Verifica se é dado é no banco

const PermissionSchema = new Schema({
    description: { type: String, 
    required: [ true, 'Não pode estar em branco' ],
    unique: true, },
}, {timestamps: true, collection: 'Permissions'} )

PermissionSchema.plugin(uniqueValidator, { message: 'Esse valor já existe!' }); // Apply the uniqueValidator plugin to userSchema.

module.exports = mongoose.model('Permission', PermissionSchema);
