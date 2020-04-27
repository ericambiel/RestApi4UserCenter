const CronJob = require('cron').CronJob;

class Cron{
    constructor(method){
        new CronJob('* * * * * *', function() {
            console.log(method);
        }, null, true, 'America/Los_Angeles').start();
    }
}

module.exports = Cron;