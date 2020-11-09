// /**
//  * Tipo de permissão que uma um usuário pode ter a uma rota
//  * de acordo com campo 'permissions' na tabela 'Users' em BD.
//  * 
//  * CUIDADO: AO MUDAR VALORES DOS OBJETOS, DEVEM SER OS MESMO
//  * ATRIBUÍDOS AOS USUÁRIOS NO BD, CASO CONTRARIO PERDERAM ACESSOS.
//  */

const ROOT = {select:'root:select', insert:'root:insert', delete:'root:delete', update:'root:update'};

const BASIC = {select:'basic:select', insert:'basic:insert', delete:'basic:delete', update:'basic:update'};
const CONTRATO = {select:'contrato:select', insert:'contrato:insert', delete:'contrato:delete', update:'contrato:update'};
const USER = {select:'user:select', insert:'user:insert', delete:'user:delete', update:'user:update'};
const DEPARTMENT = {select:[['department:select'],[ROOT.select]], insert:[['department:insert'],[ROOT.insert]], delete:[['department:delete'],[ROOT.delete]], update:[['department:update'],[ROOT.update]]};
const RH = {select:[['rh:select'],[ROOT.select]], insert:[['rh:insert'],[ROOT.insert]], delete:[['rh:delete'],[ROOT.delete]], update:[['rh:update'],[ROOT.update]]};
const FILE = {select:'file:select', insert:'file:insert', delete:'file:delete', update:'file:update'};
const INVENTORY = {select:[['inventory:select'],[ROOT.select]], insert:[['inventory:insert'],[ROOT.insert]], delete:[['inventory:delete'],[ROOT.delete]], update:[['inventory:update'],[ROOT.update]]};


/**
 * Tipo de permissão que uma um usuário pode ter a uma rota
 * de acordo com campo 'permissions' na tabela 'Users' em BD.
 * 
 * CUIDADO: AO MUDAR VALORES DOS OBJETOS, DEVEM SER OS MESMO
 * ATRIBUÍDOS AOS USUÁRIOS NO BD, CASO CONTRARIO PERDERAM ACESSOS.
 */
class PermissionModule {
    constructor() {}    
    
    get ROOT() { return ROOT; }
    
    get BASIC() { return BASIC; }
    get CONTRATO() { return CONTRATO; }
    get USER() { return USER; }
    get DEPARTMENT() { return DEPARTMENT; }
    get RH() { return RH; }
    get FILE() { return FILE; }
    get INVENTORY() { return INVENTORY; }
}

module.exports = new PermissionModule();