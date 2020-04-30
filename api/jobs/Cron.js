// TODO: Tranformar em uma classe

const CronJob = require('cron').CronJob;
const contractControler = require('../app/controllers/ContractController');

console.log("Automação de tarefas iniciada");

console.log("Tarefas agendadas: Envio de E-Mails a cada hora do dia")
// new CronJob('0 1-23 * * *', async () => { // A cada hora
//     try{
//         // console.log(Date.now());
//         contractControler.expiredContracts();
//         contractControler.expiringContracts();
//         contractControler.indefiniteContracts();
//     }catch(err){ console.log(err); }
// }).start();

// new CronJob('1 * * * * *', async () => { // A cada hora
//     try{
//         // console.log(Date.now());
//         contractControler.expiredContracts();
//         contractControler.expiringContracts();
//         contractControler.indefiniteContracts();
//     }catch(err){ console.log(err); }
// }).start();