require('./user'); // Necessario para referencias
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const departmentSchema = new Schema({
  description: { 
    type: String, 
    required: [ true, 'Necessário uma descrição para departamento' ] },
  departResponsible:  {  
    type: [ { 
      type: Schema.Types.ObjectId , 
      ref: 'User' } ] } 
}, {timestamps: true, collection: 'Departments'} )

module.exports = mongoose.model('Department', departmentSchema);
