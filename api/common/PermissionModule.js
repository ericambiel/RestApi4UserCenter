/**
 * Tipo de permissão que uma um usuário pode ter a uma rota
 * de acordo com campo permissions na tabela. 
 */
class PermissionModule {
    CONTRATO = {read:"contrato:read", write:"contrato:write"};
    USER = {read:"user:read", write:"user:write"};
    BASIC = {read:"basic:read", write:"basic:write"}
}

permission =  new PermissionModule();

module.exports = permission;