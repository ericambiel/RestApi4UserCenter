const ldapjs = require('ldapjs');

const ConsoleLog = require ('../lib/ConsoleLog');

// ldapjs.Attribute.settings.guid_format = ldapjs.GUID_FORMAT_B;

const options = {
  filter: '(&(objectclass=user)(sAMAccountName=' + 'eric.ambiel' + '))',
  // filter: '(&(objectclass=user))',
  // filter: '(&(cn=*))',
  // filter: '(objectclass=user)',
  scope: 'sub',
//   paged: true,
//   sizeLimit: 200,
  // attributes: ['sAMAccountName','mail','manager','memberOf']
  attributes:['SamAccountName']
  // attributes: ['objectGUID'] Trás alguns administradores do sistema
};

let client;

class LDAP {
    constructor() { 
        client = ldapjs.createClient({
            // url: `${process.env.LDAP_SERVER}:${process.env.LDAP_PORT}/cn=${process.env.LDAP_USER}, ou=users, ${process.env.LDAP_START_POINT}`,
            url: `${process.env.LDAP_SERVER}:${process.env.LDAP_PORT}/`,
            timeout: 5000,
            connectTimeout: 10000
        });
    }
    /**
     * Obtém via LDAP usuários de um servidor AD Microsoft.
     * @return {Array<any>} Retorna lista com objetos adquiridos de um servidor AD. 
     */
    async getUsersAD() {
        let adUsers = [];

        try {
            client.bind(process.env.LDAP_USER, process.env.LDAP_PASSWORD, error => {
                if(error) throw error;
            });

            await client.search(process.env.LDAP_START_POINT, options, async (error, res) => {
                if (error) throw error;
                else {
                    await res.on('searchEntry', entry => {
                        if(entry.object){ adUsers.push(entry.object); }
                    });

                    // res.on('searchReference', function(referral) {
                    //     console.log('referral: ' + referral.uris.join());
                    // });
                    
                    await res.on('error', error => {
                        // disconnectLDAPClient(client);
                        new ConsoleLog('error').printConsole(`[LDAP] Erro durante busca no servidor LDAP`);
                        throw error;
                    });
                    
                    await res.on('end', res => {
                        // console.log('status: ' + res.status);
                        disconnectLDAPClient(client);
                    });
                }
            });
        } catch(error){
            disconnectLDAPClient(client);
            throw error
        }
        return adUsers;
    }
}

function disconnectLDAPClient(client) {
    client.unbind(error => {
        if (error) {
            new ConsoleLog('error').printConsole('[LDAP] Erro ao desconectar do servidor LDAP');
            throw error; 
        } 
    });
    new ConsoleLog().printConsole('[LDAP] Desconectado do servidor LDAP');
}

module.exports = LDAP;



