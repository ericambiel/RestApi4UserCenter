const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const permissionSchema = new Schema({
    permission: { type: String, 
    required: [ true, 'Não pode estar em branco' ] },
}, {timestamps: true, collection: 'Permissions'} )

module.exports = mongoose.model('Permission', permissionSchema);
