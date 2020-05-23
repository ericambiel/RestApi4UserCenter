// /**
//  * Esta é uma função de exemplo de uso de JSDoc
//  * 
//  * @example 
//  *   exemplo(3, 5); // 8
//  * 
//  * @param   {Number} obrigatório   Parâmetro obrigatório
//  * @param   {Number} [opcional]    Parâmetro opcional. Note os '[ ]'
//  * @returns {Number}
//  */
const schemaJSONMaker = require('json-schema-defaults'); // Biblioteca para formar schemas JSON

const fs = require('fs');

const dirFile = './JSON/SQL Contratos para JSON (Keyed)_23_03_20.json';

// Synchronous - Read File
function syncReadFileToJSON() {
    try {
        const json = JSON.parse(fs.readFileSync(dirFile));
        return json;
      } catch(err) {
        return console.log(err);
      }
}

// Asynchronous - Write File
function asyncWriteJsonToFile(jsonObj, dirFile) {
    const textFile = JSON.stringify(jsonObj);
    
    fs.writeFile(dirFile, textFile, err =>{
        if(err) {
            return console.log("Erro na gravação do arquivo: " + err);
        }
        console.log("Arquivo Salvo em: " + dirFile);
    }); 
}

// Schema do novo JSON
const contratoSchema = schemaJSONMaker({
    "type" : "object",
    "properties" : {
        "idSecondary": { "type": "number" },
        "natureza": { "type": "string" },
        "objeto": { "type": "string" },
        "estabFiscal": { "type": "string" },
        "parceiro": { "type": "string" },
        "cnpj": { "type": "number" },
        "status": { "type": "string" },
        "situacao": { "type": "string" },
        "deptoResponsavel": { "type": "string"},
        "valTotal": { "type": "number" },
        "valMensal": { "type": "number" },
        "dataInicio": { "type": "date" },
        "dataFim": { "type": "date" },
        "deptoPartList": { "type": [ 
                                        { "departamento": { "type": "string" } } 
                                   ] 
                         },
        "indReajuste": { "type": "string" },
        "diaAntecedencia": { "type": "number" },
        "obs": { "type": "string" },
        "historico": { "type": "string" },
        "anaJuridico": { "type": "boolean" },
        "documentoList": { "type" : [ 
                                        { "nome": { "type": "string" } },
                                        { "diretorio": { "type": "string" } },
                                        { "tipo": { "type": "string" } },
                                        { "numAditivo": { "type": "number" } },
                                        { "dataInsert": { "type": "date" } } 
                                    ] 
                        }
        } 
});

const documentoListSchema = schemaJSONMaker({
    "type" : "object",
    "properties" : {
        "documentoList": { "type" : [ 
                                        { "nome": { "type": "string" } },
                                        { "descricao" : { "type": "string" } },
                                        { "diretorio": { "type": "string" } },
                                        { "tipo": { "type": "string" } },
                                        { "numAditivo": { "type": "number" } },
                                        { "dataInsert": { "type": "date" } } 
                                    ] 
                         }
    }
})

const deptoPartListSchema = schemaJSONMaker({
    "type" : "object",
    "properties" : {
        "deptoPartList": { "type": [ {"departamento": { "type": "string" } } ] },
    }
})

const importedJSON = syncReadFileToJSON();

/**
 * Recebe um JSON KEYED e une todos os campos do tipo lista em um só array dentro do objeto..
 */
function matchJSONValues(){
    var objFormado = [];
    var lastKey = Object.keys(importedJSON)[Object.keys(importedJSON).length - 1]; // Verifica quantidade do array em um objeto
    lastKey = (parseInt(lastKey, 10) + 1).toString()

    var indexContrato = 0;

    while(indexContrato.toString() !== lastKey) {
        const contrato = Object.create(contratoSchema); // Cria objeto com com Prototype de outro objeto
        if (importedJSON[indexContrato] != null){
            contrato.idSecondary = parseInt(indexContrato);
            contrato.natureza = importedJSON[indexContrato][0]["natureza"];
            contrato.objeto = importedJSON[indexContrato][0]["objeto"];
            contrato.estabFiscal = importedJSON[indexContrato][0]["estabFiscal"];
            contrato.parceiro = importedJSON[indexContrato][0]["parceiro"];
            contrato.cnpj = parseInt(importedJSON[indexContrato][0]["cnpj"].replace(/[/.-]+/g,''), 10); //Remove "/" "." "-" da String e converte tapa inteiro
            contrato.status = importedJSON[indexContrato][0]["status"];
            contrato.situacao = importedJSON[indexContrato][0]["situacao"];
            contrato.deptoResponsavel = importedJSON[indexContrato][0]["deptoResponsavel"];
            contrato.valTotal = parseFloat(importedJSON[indexContrato][0]["valTotal"]);
            contrato.valMensal = parseFloat(importedJSON[indexContrato][0]["valMensal"]);
            contrato.dataInicio = importedJSON[indexContrato][0]["dataInicio"];
            contrato.dataFim = importedJSON[indexContrato][0]["dataFim"];
            contrato.deptoPartList = getDepartamentoList(importedJSON, indexContrato);
            contrato.indReajuste = importedJSON[indexContrato][0]["indReajuste"];
            contrato.diaAntecedencia = parseInt(importedJSON[indexContrato][0]["diaAntecedencia"]);
            contrato.obs = importedJSON[indexContrato][0]["obs"];
            contrato.historico = importedJSON[indexContrato][0]["historico"];
            contrato.anaJuridico = importedJSON[indexContrato][0]["anaJuridico"];
            contrato.obs = importedJSON[indexContrato][0]["obs"];
            contrato.documentoList = getDocumentoList(importedJSON, indexContrato);
            objFormado.push(contrato);
        } else console.log("Index: [" + indexContrato + "] não encontrado");
        indexContrato++;
    } 
    return objFormado;
}

/**
 * Retorna objeto com lista de departamentos associados contrato.
 *
 * @param {Object} objDeBusca Array de Objetos contendo contratos
 * @param {Number} indexContrato Índice do contrato a ser pesquisado dentro do Array de Objetos
 * @returns {Object} Novo objeto formado com item pesquisado
 */
function getDepartamentoList (objDeBusca, indexContrato){
    var objFormado = [];

    for ( var i = 0; i < objDeBusca[indexContrato].length; i++ ){
        var deptoPartList = Object.create( deptoPartListSchema );
        if ( getKeyByValue(objFormado, "departamento", objDeBusca[indexContrato][i]["deptoPart"]) === -1) { // Verifica se o valor existe antes de criar o objeto e coloca-lo a lista
            if ( objDeBusca[indexContrato][i]["deptoPart"] === null || '' ) { // Se campo vier vaziou ou como "null"
            } else {
                deptoPartList.departamento =  objDeBusca[indexContrato][i]["deptoPart"]; 
                objFormado.push( deptoPartList );// Adiciona a lista um novo objeto com o valor encontrado
            }
        }  
    }
    return objFormado;
}

/**
 * Retorna objeto com lista documentos associados ao contrato.
 *
 * @param {Object} objDeBusca Array de Objetos contendo contratos
 * @param {Number} indexContrato Índice do contrato a ser pesquisado dentro do Array de Objetos
 * @returns {Object} Novo objeto formado com item pesquisado
 */
function getDocumentoList (objDeBusca, indexContrato) {
    var objFormado = [];

    for ( var i = 0; i < objDeBusca[indexContrato].length; i++ ){
        var documentoList = Object.create( documentoListSchema );
        if ( getKeyByValue(objFormado, "nome", objDeBusca[indexContrato][i]["nome"]) === -1) {  // Verifica se o valor existe antes de criar o objeto e coloca-lo a lista
            if(objDeBusca[indexContrato][i]["nome"] == null || '') 
                return
            else {
                documentoList.nome = objDeBusca[indexContrato][i]["nome"],
                documentoList.descricao = objDeBusca[indexContrato][i]["nome"].replace(/\..*/,''),
                documentoList.diretorio =  process.env.UPLOAD_DIR_CONTRATOS,
                //documentoList.diretorio =  objDeBusca[indexContrato][i]["diretorio"],
                documentoList.tipo = objDeBusca[indexContrato][i]["nome"].replace(/^.*\./, ''),
                documentoList.numAditivo = objDeBusca[indexContrato][i]["numAditivo"],
                documentoList.dataInsert =  objDeBusca[indexContrato][i]["dataInsert"]
                objFormado.push( documentoList ); // Adiciona a lista um novo objeto com os valores encontrados
            }
            
        }
    }
    return objFormado;
}   

/**
 * Verifica se existe um valor dentro de um objeto simples.
 * Não percorre subníveis de array de dentro do objeto, somente
 * primeiro nível.
 * 
 * @param {Object} objeto objeto a ser pesquisado
 * @param {String} key nome da chave ao qual o valor se encontra
 * @param {*} valor valor a ser pesquisado
 * @returns {Number} Index do objeto com o valor pesquisado dentro do objeto
 */
function getKeyByValue(objeto, key, valor) { 
    for (var prop in objeto) { 
        if (objeto.hasOwnProperty(prop)) { 
            if (objeto[prop][key] === valor) 
            return prop; 
        } 
    }
    return -1 
} 

const objFormado = matchJSONValues();
asyncWriteJsonToFile(objFormado, './JSON/convertido.json')
