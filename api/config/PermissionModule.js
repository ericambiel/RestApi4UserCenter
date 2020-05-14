// /**
//  * Tipo de permissão que uma um usuário pode ter a uma rota
//  * de acordo com campo 'permissions' na tabela 'Users' em BD.
//  * 
//  * CUIDADO: AO MUDAR VALORES DOS OBJETOS, DEVEM SER OS MESMO
//  * ATRIBUÍDOS AOS USUÁRIOS NO BD, CASO CONTRARIO PERDERAM ACESSOS.
//  */
// class PermissionModule {
//     constructor() {};
    
//     BASIC = {select:'basic:select', insert:'basic:insert', delete:'basic:delete', update:'basic:update'};
//     CONTRATO = {select:'contrato:select', insert:'contrato:insert', delete:'contrato:delete', update:'contrato:update'};
//     USER = {select:'user:select', insert:'user:insert', delete:'user:delete', update:'user:update'};
//     DEPARTMENT = {select:'department:select', insert:'department:insert', delete:'department:delete', update:'department:update'};
//     RH = {select:'rh:select', insert:'rh:insert', delete:'rh:delete', update:'rh:update'};
//     FILE = {select:'file:select', insert:'file:insert', delete:'file:delete', update:'file:update'};
    
//     ROOT = {select:'root:select', insert:'root:insert', delete:'root:delete', update:'root:update'};
// }

// permissionModule =  new PermissionModule();

// module.exports = permissionModule;

const ROOT = {select:'root:select', insert:'root:insert', delete:'root:delete', update:'root:update'};

const BASIC = {select:'basic:select', insert:'basic:insert', delete:'basic:delete', update:'basic:update'};
const CONTRATO = {select:'contrato:select', insert:'contrato:insert', delete:'contrato:delete', update:'contrato:update'};
const USER = {select:'user:select', insert:'user:insert', delete:'user:delete', update:'user:update'};
const DEPARTMENT = {select:'department:select', insert:'department:insert', delete:'department:delete', update:'department:update'};
const RH = {select:'rh:select', insert:'rh:insert', delete:'rh:delete', update:'rh:update'};
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
    
    get BASIC() { return BASIC; }
    get CONTRATO() { return CONTRATO; }
    get USER() { return USER; }
    get DEPARTMENT() { return DEPARTMENT; }
    get RH() { return RH; }
    get FILE() { return FILE; }
    get INVENTORY() { return INVENTORY; }
    

    get ROOT() { return ROOT; }
}

module.exports = new PermissionModule();