require('./User'); // Necessário para referencias
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const uniqueValidator = require('mongoose-unique-validator'); //Verifica se é dado é no banco

const DepartmentSchema = new Schema({
  description: { 
    type: String, 
    required: [ true, 'Necessário uma descrição para departamento' ],
    unique: true },
  departResponsible:  {  
    type: [ { 
      type: Schema.Types.ObjectId , 
      ref: 'User'} ] } 
}, {timestamps: true, collection: 'Departments'} )

// TODO: Criar controle para des-relacionar Departamento/Usuário em Modelo, esta sendo feito no endPoint
DepartmentSchema.methods.relatesDepartUserTables = async function() {
//   if ( this.departResponsible !== undefined ){
//     this.departResponsible.forEach(user => { 
//         await User.findByIdAndUpdate(user, { $push: { departments: this._id } }) // findByIdAndUpdate is not a function quando chamado pelo endPoint
//                   .catch(err => console.log(err)) 
//     });
//   }
}

// TODO: Criar controle para des-relacionar Departamento/Usuário em Modelo, esta sendo feito no endPoint
DepartmentSchema.methods.unrelateDepartUserTables = async function() {
  // this.departResponsible.forEach( async user => { 
  //   await User.findByIdAndUpdate(user, { $pull: { departments: this._id } }) // findByIdAndUpdate is not a function quando chamado pelo endPoint
  //             .catch();
  // })
}

DepartmentSchema.plugin(uniqueValidator, { message: 'Esse valor já existe!' }); // Apply the uniqueValidator plugin to userSchema.

module.exports = mongoose.model('Department', DepartmentSchema);
