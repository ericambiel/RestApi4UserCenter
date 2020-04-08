/**
 * Tipo de permissão que uma um usuário pode ter a uma rota
 * de acordo com campo "permissions" na tabela "Users" em BD.
 * 
 * CUIDADO: AO MUDAR VALORES DOS OBJETOS, DEVEM SER OS MESMO
 * ATRIBUÍDOS AOS USUÁRIOS NO BD, CASO CONTRARIO PERDERAM ACESSOS.
 */
class PermissionModule {
    BASIC = {select:"basic:select", insert:"basic:insert", delete:"basic:delete", update:"basic:update"};
    CONTRATO = {select:"contrato:select", insert:"contrato:insert", delete:"contrato:delete", update:"contrato:update"};
    USER = {select:"user:select", insert:"user:insert", delete:"user:delete", update:"user:update"};
}

permissions =  new PermissionModule();

module.exports = permissions;