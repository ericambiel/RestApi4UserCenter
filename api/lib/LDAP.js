const Binary = require('binary');
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
     * Checa estado do servidor LDAP.
     * @returns {ldap} Cliente de conexão.
     */
    async ldapServerStatus() {
        return await createLDAPClient(process.env.LDAP_SERVER, process.env.LDAP_PORT)
            .then(client => { return  { message: 'Servidor LDAP pronto para conexão.', client } })
            .catch(err => { 
                throw errorHandling(err);
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
                    
                    const users = [];
                    for (let i = 0; i < entries.length; i++) {
                        const foundAttributes = findAttributes(['objectGUID', 'objectSid'], entries[i].attributes);
                        
                        users.push(entries[i].object);
                        
                        users[i].objectGUID = formatToUUID(binToHex(foundAttributes).get('objectGUID').toString());
                        users[i].objectSid = decodeSIDFromBin(foundAttributes.get('objectSid').buffers).toString();
                    }

                    return users;
                }).catch(err => {
                    disconnectLDAPClient(client);
                    throw err;
                }
            );
        } catch(err) { 
            const handling = errorHandling(err);
            if(handling.status < 500) return handling;
            else throw handling;
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
 * Encontra atributos em uma lista
 * @param {Array<string>} attributesNames Atributos a encontrar.
 * @returns {Array} attFound.
 */
function findAttributes(attributesNames, attributesArray) {
    const attFound = new Map();

    attributesNames.forEach(name => {
        attFound.set(name, attributesArray.find(attr => attr.type === name));
    });

    return attFound;
}

/**
 * Procura e transforma atributos que estão em BIN para HEX
 * @param { Map<string, Buffer> } attributes Atributos binários para conversão.
 * @returns { Map<string, string> } Array com valores em hex da lista de atributos informada. 
 */
function binToHex(attributes) {
    const hexMap = new Map;

    for (const [key, value] of attributes.entries()) {
        hexMap.set(key, value.buffers.map(
            buffer => { return Buffer.from(buffer, 'binary').toString('hex'); })
        );
    }

    return hexMap;
}

/**
 * Formata atributos HEX para UUID.
 * @param {string} hexAttribute objectGUID em formato Hex.
 * @returns {string} Retorna objectGUI formatado para UUID.
 */
function formatToUUID(hexAttribute) {
    const p1 =
        hexAttribute.substr(-26, 2) +
        hexAttribute.substr(-28, 2) +
        hexAttribute.substr(-30, 2) +
        hexAttribute.substr(-32, 2);

    const p2 = hexAttribute.substr(-22, 2) + hexAttribute.substr(-24, 2);
    const p3 = hexAttribute.substr(-18, 2) + hexAttribute.substr(-20, 2);
    const p4 = hexAttribute.substr(-16, 4);
    const p5 = hexAttribute.substr(-12, 12);

    return [p1, p2, p3, p4, p5].join('-');
}

/**
 * Descobre qual o tipo de SID
 * @param {Buffer} type Tipo em binário.
 */
function outputSIDType(type) {
    const buf = new Buffer.alloc(6);
    type.copy(buf, 0);
    let output = 0;

    for (let i = 0; i < 6; i++) {
        output = output << 8;
        output = output | buf[i];
    }

    return output;
}

/**
 * Decodifica binário SID para string formatado.
 * @param {Array<Buffer>} sIDBuffer Array dos Buffers com SID do AD, geralmente 1.
 * @returns {Array<string>} Array SID no formato "S-{Revision}-{Authority}-{SubAuthority1}-...-{SubAuthorityN}"
 */
function decodeSIDFromBin(sIDBuffer) {
    const parsers = sIDBuffer.map(buffer =>
        Binary.parse(buffer)
            .word8lu('revision')
            .word8lu('fields')
            .buffer('authority', 6)
            .loop(function(end, vars) {
            vars.subAuthorities = vars.subAuthorities || new Array();
            vars.subAuthorities.push(this.word32lu('subAuthority').vars.subAuthority);
            if (vars.subAuthorities.length >= vars.fields) {
                end();
            }
        })
    );
    
    return parsers.map(parse => {
        const revision = parse.vars.revision;
        const authority = parse.vars.authority;
        const subAuthorities = parse.vars.subAuthorities;
    
        // return { version, type, domsid };
    
        /* return S-{Revision}-{Authority}-{SubAuthority1}-{SubAuthority2}...-{SubAuthorityN} formatted string */
        const output = ['S', revision, outputSIDType(authority)].concat(subAuthorities);
        return output.join('-');
    })
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
        // entries.objects = [];
        
        search.on('searchEntry', entry => {
            found = true;
            entries.push(entry)
            // entries.objects.push(entry.object);
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

/**
 * Cria cliente de conexão a um servidor LDAP.
 * @param {string} ldapServer IP/Hostname do servidor.
 * @param {string} ldapPort Porta onde serviço LDAP esta rodando no servidor.
 * @returns {ldapjs} Cliente de conexão.
 */
function createLDAPClient(ldapServer, ldapPort){
    return new Promise((resolve, reject) => {
        const client = ldapjs.createClient({
            url: ldapServer !== '' ? `${ldapServer}:${ldapPort}/` : '',
            timeout: 2500,
            connectTimeout: 5000
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
 * Conecta a uma base DN usando um cliente de conexão.
 * Caso 'user' e 'password' não forem inseridos tentara conexão anonima. 
 * @param {ldapjs.createClient} client cliente de conexão.
 * @param {string} user usuário de conexão LDAP
 * @param {string} password senha de conexão
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
 * Desconecta cliente da base LDAP
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
 * Tratara erros que ocorram durante conexão ao servidor LDAP.
 * @param {Error} err erro de conexão vindos de um cliente LDAP.
 */
function errorHandling(err) {
    
    // hexErrorMicrosoftAD - Erros somente do Microsoft AD
    const indexOf = err.message.search(/(?<=data )([^\n\r]*)/); // Encontra tudo após "data "
    let hexErrorMicrosoftAD = err.message.substr(indexOf);
    hexErrorMicrosoftAD = hexErrorMicrosoftAD.replace(/,.*$/, '').toLowerCase(); // remove tudo após primeira ","
    
    switch (!err.code ? '' : err.code) {
        case 49: { // LDAP_INVALID_CREDENTIALS
            switch (!hexErrorMicrosoftAD ? '' : hexErrorMicrosoftAD){ // Microsoft AD Errors.
                case '525': return { error: {message: 'Entrada no diretório AD não existe.' }, status: 401 }; // LDAP_NO_SUCH_OBJECT
                case '52e': return { error: {message: 'Usuário ou senha Windows inválidos.' }, status: 401 }; // ERROR_LOGON_FAILURE
                case '52f': return { error: {message: 'Existe restrições em seu usuário, contate o administrador.' }, status: 401 }; // ERROR_ACCOUNT_RESTRICTION
                case '530': return { error: {message: 'Acesso pelo seu usuário não permitido nesse horário.' }, status: 401 }; // ERROR_INVALID_LOGON_HOURS
                case '531': return { error: {message: 'Não é permitido logar-se desse computador' }, status: 401 }; // ERROR_INVALID_WORKSTATION
                case '532': return { error: {message: 'Sua senha do Windows expirou por favor redefina' }, status: 401 }; // ERROR_PASSWORD_EXPIRED
                case '533': return { error: {message: 'Sua conta Windows esta desabilitada, contate o administrador' }, status: 401 }; // ERROR_ACCOUNT_DISABLED
                case '568': return { error: {message: 'Muitas seções de sua conta aberta, feche algumas' }, status: 401 }; // ERROR_TOO_MANY_CONTEXT_IDS
                case '701': return { error: {message: 'Seu usuário do Windows expirou, contate o administrador' }, status: 401 }; // ERROR_ACCOUNT_EXPIRED
                case '773': return { error: {message: 'Sua senha Windows precisa ser redefinida, altere e tente novamente' }, status: 401 }; // ERROR_PASSWORD_MUST_CHANGE
                case '775': return { error: {message: 'Seu usuário Windows esta bloqueado, contate o administrador' }, status: 401 }; // ERROR_ACCOUNT_LOCKED_OUT
                case '80090346': return { error: {message: 'Credenciais estão incorretas, tente novamente' }, status: 401 }; // ERROR_ACCOUNT_LOCKED_OUT
                default: return { error: {message: 'Erro com suas credenciais'}, status: 401 };
            }
        }
        case 80: return { error: {message: 'Erro ao se conectar com servidor LDAP, contate o administrador.' }, status: 504 }; // LDAP_OTHER
        default: return err; // error not Handling
    }
}

module.exports = LDAP;