const ldapjs = require('ldapjs');
var Promise = require('bluebird');

const ConsoleLog = require ('../lib/ConsoleLog');

// ldapjs.Attribute.settings.guid_format = ldapjs.GUID_FORMAT_B;

class LDAP {
    constructor() { }
    /**
     * Obtém via LDAP informações de todos os usuários de um servidor AD Microsoft.
     * @return {Array<any>} Retorna lista com objetos adquiridos de um servidor AD. 
     */
     getAllUsersAD() {

        const options = {
            filter: '(&(objectclass=user))',
            scope: 'sub',
        };

        let client = createLDAPClient(process.env.LDAP_SERVER, process.env.LDAP_PORT);
        
        connectLDAPClient(client, process.env.LDAP_USER, process.env.LDAP_PASSWORD);
        
        Promise.promisifyAll(client);

        return client.searchAsync(process.env.LDAP_START_POINT, options)
            .then(search => {
                return searchPromise(search);
            }).then(entries => {
                return entries.objects;
            }).catch(err => {
                disconnectLDAPClient(client);
                throw err
            }).finally(disconnectLDAPClient(client));
    }

    /**
     * Obtém via LDAP informações somente um usuário do servidor AD Microsoft.
     * @param {String} sAMAccountName conta do usuário no AD
     */
    getOneUserAD(sAMAccountName, password) {
        const options = {
            filter: `(&(objectclass=user)(sAMAccountName=${sAMAccountName}))`,
            scope: 'sub',
        };

        let client = createLDAPClient(process.env.LDAP_SERVER, process.env.LDAP_PORT);
        
        connectLDAPClient(client, sAMAccountName, password);
        
        Promise.promisifyAll(client);

        return client.searchAsync(process.env.LDAP_START_POINT, options)
            .then(search => {
                return searchPromise(search);
            }).then(entries => {
                return entries.objects;
            }).catch(err => {
                disconnectLDAPClient(client);
                throw err
            }).finally(disconnectLDAPClient(client));
    }
}

function searchPromise(search) {
    return new Promise((resolve, reject) => {
        let found = false;
        let referrals = [];
        let entries = [];
        entries.objects = [];
        
        search.on('searchEntry', entry => {
            // if(entry.object){ adUsers.push(entry.object); }
            found = true;
            entries.push(entry)
            entries.objects.push(entry.object);
        });

        search.on('searchReference', referral => {
            found = true;
            referrals.push(referral);
        });
        
        search.on('error', error => {
            reject(error);
        });
        
        search.on('end', res => {
            if (!found) reject('Não foi encontrado nenhuma entrada no servidor LDAP');
            else resolve(entries, referrals);
        });
    });
  }

function createLDAPClient(ldapServer, ldapPort){
    return ldapjs.createClient({
        // url: `${process.env.LDAP_SERVER}:${process.env.LDAP_PORT}/cn=${process.env.LDAP_USER}, ou=users, ${process.env.LDAP_START_POINT}`,
        url: `${ldapServer}:${ldapPort}/`,
        timeout: 5000,
        connectTimeout: 10000
    })
}

/**
 * 
 * @param {ldapjs.createClient} client 
 */
function connectLDAPClient(client, user, password) {
    // return Promise.denodeify(client.bind.bind(client));
    return client.bind(user, password, (err, res) => {
        if(err) {
            new ConsoleLog('error')
                .printConsole('[LDAP] Erro ao conectar-se ao servidor LDAP, verifique as configurações "LDAP"" em .env');
            throw err;
        }
        // return res
    });
    
}

/**
 * 
 * @param {ldapjs.createClient} client 
 */
function disconnectLDAPClient(client) {
    // return Promise.denodeify(client.search.bind(client));
    client.unbind(err => {
        if (err) {
            new ConsoleLog('error').printConsole('[LDAP] Erro ao desconectar do servidor LDAP');
            throw err; 
        } 
    });
    new ConsoleLog().printConsole('[LDAP] Desconectado do servidor LDAP');
}

module.exports = LDAP;



