const ldapjs = require('ldapjs');
var Promise = require('bluebird');

const ConsoleLog = require ('../lib/ConsoleLog');

// ldapjs.Attribute.settings.guid_format = ldapjs.GUID_FORMAT_B;

class LDAP {
    constructor() { 
        // the ugly catch all
        process.on('uncaughtException', (err) => {
            const { message, stack } = err;
            new ConsoleLog('error').printConsole(`[LDAP] ${message}, em: ${stack}`);
        });
    }
    /**
     * Obtém via LDAP informações de todos os usuários ou usuário informado de um servidor AD Microsoft.
     * @param {string} user Se usuário não informado usara credenciais de LDAP em env.
     * @param {string} password Senha para usuário informado.
     * @param {userToFind} userToFind 'sAMAccountName' do usuário no AD para busca-lo, se não informado buscara todos.
     * @return {Array<any>} Retorna lista com objetos adquiridos de um servidor AD. 
     */
    async getUserAD(user, password, userToFind) {
        try {
            informedUserOrNot(user, password, (_user, _password) => { 
                user = _user, password = _password; 
            });

            const options = {
                filter: `(&(objectclass=user)${!userToFind ? '' : `(sAMAccountName=${userToFind})` })`,
                scope: 'sub',
            };
    
            const { client } = await createLDAPClient(process.env.LDAP_SERVER, process.env.LDAP_PORT)
                .catch(err => { throw err; });
            
            await connectLDAPClient(client, user, password)
                .catch(err => { throw err; });
            
            Promise.promisifyAll(client);
    
            return client.searchAsync(process.env.LDAP_START_POINT, options)
                .then(search => {
                    return searchPromise(search);
                }).then(entries => {
                    disconnectLDAPClient(client);
                    return entries.objects;
                }).catch(err => {
                    disconnectLDAPClient(client);
                    throw err;
                }
            );
        } catch(err) { 
            const handling = errorHandling(err);
            if(handling !== false) return { error: { message: handling }, status: 401 };
            else throw Error(err.message);
        }
    }
}

/**
 * Verifica se usuário foi ou não informado
 * @param {string} user
 * @param {string} password
 * @returns {string} Retorna usuário configurado em .env, ou userPrincipalName no AD
 */
function informedUserOrNot(user, password, callback) {
    if (user) {
        let temp = process.env.LDAP_DN_FOR_USERS.replace(/dc=/g, '.');
        temp = temp.replace(/,/g, '');
        user = user + temp.replace(/\./, '@');
        callback(user,password);
    } 
    else callback(process.env.LDAP_USER, process.env.LDAP_PASSWORD);
}

/**
 * Procura por entradas em uma base LDAP
 * @param {ldapjs} search Resultado de procura. 
 */
function searchPromise(search) {
    return new Promise((resolve, reject) => {
        let found = false;
        let referrals = [];
        let entries = [];
        entries.objects = [];
        
        search.on('searchEntry', entry => {
            found = true;
            entries.push(entry)
            entries.objects.push(entry.object);
        });

        search.on('searchReference', referral => {
            found = true;
            referrals.push(referral);
        });
        
        search.on('error', err => {
            new ConsoleLog('error').printConsole(`[LDAP] Erro ao procurar por usuário(s), ${err.message}`);
            reject(err);
        });
        
        search.on('end', res => {
            if (!found) reject(res);
            else resolve(entries, referrals);
        });
    });
  }

function createLDAPClient(ldapServer, ldapPort){
    return new Promise((resolve, reject) => {
        const client = ldapjs.createClient({
            // url: `${process.env.LDAP_SERVER}:${process.env.LDAP_PORT}/cn=${user}, ou=users, ${process.env.LDAP_START_POINT}`,
            url: ldapServer !== '' ? `${ldapServer}:${ldapPort}/` : '',
            timeout: 5000,
            connectTimeout: 10000
        }).on("connect", res => {
            resolve({ client, res });
        }).on('connectError',err => {
            new ConsoleLog('error').printConsole(`[LDAP] Erro de conexão, ${err.message}`);
            reject(err);
        }).on('error', err => {
            new ConsoleLog('error').printConsole(`[LDAP] Erro ao criar cliente, ${err.message}`);
            reject(err);
        });   
    });
}

/**
 * 
 * @param {ldapjs.createClient} client 
 */
function connectLDAPClient(client, user, password) {
    return new Promise((resolve, reject) => {
        client.bind(user, password, (err, res) => {
            if (err) reject(err);
            resolve(res); 
        });   
    })
}

/**
 * 
 * @param {ldapjs.createClient} client 
 */
function disconnectLDAPClient(client) {
    client.unbind(err => {
        if (err) {
            new ConsoleLog('error').printConsole('[LDAP] Erro ao desconectar do servidor LDAP.');
            throw err; 
        } 
    });
    // new ConsoleLog().printConsole('[LDAP] Desconectado do servidor LDAP');
}

// https://docs.servicenow.com/bundle/orlando-platform-administration/page/administer/reference-pages/reference/r_LDAPErrorCodes.html
// https://ldapwiki.com/wiki/Common%20Active%20Directory%20Bind%20Errors
/**
 * 
 * @param {Error} error 
 */
function errorHandling(error) {
    const indexOf = error.message.search(/(?<=data )([^\n\r]*)/); // Encontra tudo após "data "
    let hexError = error.message.substr(indexOf);
    hexError = hexError.replace(/,.*$/, '').toLowerCase(); // remove tudo após primeira ","
    
    switch (!error.code ? '' : error.code) {
        case 49: { // LDAP_INVALID_CREDENTIALS
            switch (!hexError ? '' : hexError){ // Microsoft AD Errors.
                case '525': return 'Entrada no diretório AD não existe.'; // LDAP_NO_SUCH_OBJECT
                case '52e': return 'Usuário ou senha Windows inválidos.'; // ERROR_LOGON_FAILURE
                case '52f': return 'Existe restrições em seu usuário, contate o administrador.'; //ERROR_ACCOUNT_RESTRICTION
                case '530': return 'Acesso pelo seu usuário não permitido nesse horário.'; //ERROR_INVALID_LOGON_HOURS
                case '531': return 'Não é permitido logar-se desse computador'; // ERROR_INVALID_WORKSTATION
                case '532': return 'Sua senha do Windows expirou por favor redefina'; // ERROR_PASSWORD_EXPIRED
                case '533': return 'Sua conta Windows esta desabilitada, contate o administrador'; // ERROR_ACCOUNT_DISABLED
                case '568': return 'Muitas seções de sua conta aberta, feche algumas'; // ERROR_TOO_MANY_CONTEXT_IDS
                case '701': return 'Seu usuário do Windows expirou, contate o administrador'; // ERROR_ACCOUNT_EXPIRED
                case '773': return 'Sua senha Windows precisa ser redefinida, altere e tente novamente'; // ERROR_PASSWORD_MUST_CHANGE
                case '775': return 'Seu usuário Windows esta bloqueado, contate o administrador'; // ERROR_ACCOUNT_LOCKED_OUT
                case '80090346': return 'Credenciais estão incorretas, tente novamente'; // ERROR_ACCOUNT_LOCKED_OUT
                default: return 'Erro com suas credenciais';
            }
        }
        default: return false; // error not Handling
    }
}

module.exports = LDAP;



