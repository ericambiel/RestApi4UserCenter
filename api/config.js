module.exports = {
  apiRestPort: 3000, 
  dbHost: 'localhost',
  dbPort: 27017, // MongoDB => API REST
  dbName: 'usercenter-app',
  dbUser: 'dev',
  dbPassword: 'dev',
  dbCollection: 'contratos',
  diretorioContratos: 'public/files/contratos' //Diretório dos Arquivos de contrato após pasta "api" 
};
// TODO: Apagar, foi substituído por ".env.example"