let mongoose = require('mongoose');

const server = '127.0.0.1:27017'; // REPLACE WITH YOUR DB SERVER
const database = 'usercenter_PRD';      // REPLACE WITH YOUR DB NAME

class Database {
  constructor() {
    this._connect()
  }
  
_connect() {
     mongoose.connect(`mongodb://${server}/${database}`)
       .then(() => {
         console.log(`Conexão ao banco: ${database} - OK!`)
       })
       .catch(err => {
         console.error(`Conexão ao banco: ${database} - FALHOU!`)
       })
  }
}

module.exports = new Database()