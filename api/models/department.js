const User = require('./user'); // Necessario para referencias
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const uniqueValidator = require('mongoose-unique-validator'); //Verifica se é dado é no banco

const departmentSchema = new Schema({
  description: { 
    type: String, 
    required: [ true, 'Necessário uma descrição para departamento' ],
    unique: true },
  departResponsible:  {  
    type: [ { 
      type: Schema.Types.ObjectId , 
      ref: 'User'} ] } 
}, {timestamps: true, collection: 'Departments'} )

// departmentSchema.methods.relatesUserTables = async function() {
//   if ( this.departResponsible !== undefined ){
//     await this.departResponsible.forEach(user => { 
//         User.findByIdAndUpdate(user, { $push: { departments: this._id } }) // TODO: erro: findByIdAndUpdate is not a function
//             .catch(err => console.log(err)) 
//     });
//   }
// }

departmentSchema.plugin(uniqueValidator, { message: 'Esse valor já existe!' }); // Apply the uniqueValidator plugin to userSchema.

module.exports = mongoose.model('Department', departmentSchema);
