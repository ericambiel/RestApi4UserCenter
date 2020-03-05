// /**
//  * Esta é uma função de exemplo de uso de JSDoc
//  * 
//  * @example 
//  *   exemplo(3, 5); // 8
//  * 
//  * @param   {Number} obrigatorio   Parametro obrigatório
//  * @param   {Number} [opcional]    Parametro ocional. Note os '[ ]'
//  * @returns {Number}
//  */

const schemaJSONMaker = require('json-schema-defaults'); // Biblioteca para formar schemas JSON

const fs = require('fs');

const dirFile = 'tools/JSON/SQL Contratos para JSON (Keyed).json';

// Synchronous - ReadFile
function syncReadFileToJSON() {
    try {
        const json = JSON.parse(fs.readFileSync(dirFile));
        return json;
      } catch(err) {
        console.log(err);
        return
      }
}

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
        "id": { "type": "number" },
        "objeto": { "type": "string" },
        "estabFiscal": { "type": "string" },
        "parceiro": { "type": "string" },
        "cnpj": { "type": "number" },
        "status": { "type": "string" },
        "situacao": { "type": "string" },
        "valTotal": { "type": "number" },
        "valMensal": { "type": "number" },
        "dataInicio": { "type": "date" },
        "dataFim": { "type": "date" },
        "deptoPartList": { "type": [ {"departamento": { "type": "string" } } ] },
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

function matchJSONValues(){
    var objFormado = [];
    var lastKey = Object.keys(importedJSON)[Object.keys(importedJSON).length - 1]; // Verifica quantidade do array em um objeto
    lastKey = (parseInt(lastKey, 10) + 1).toString()

    var indexContrato = 0;

    while(indexContrato.toString() !== lastKey) {
        const contrato = Object.create(contratoSchema); // Cria objeto com com Prototype de outro objeto
        if (importedJSON[indexContrato] != null){
            contrato.id = indexContrato;
            contrato.objeto = importedJSON[indexContrato][0]["objeto"];
            contrato.estabFiscal = importedJSON[indexContrato][0]["estabFiscal"];
            contrato.parceiro = importedJSON[indexContrato][0]["parceiro"];
            contrato.cnpj = importedJSON[indexContrato][0]["cnpj"];
            contrato.status = importedJSON[indexContrato][0]["status"];
            contrato.situacao = importedJSON[indexContrato][0]["situacao"];
            contrato.valTotal = importedJSON[indexContrato][0]["valTotal"];
            contrato.dataInicio = importedJSON[indexContrato][0]["dataInicio"];
            contrato.dataFim = importedJSON[indexContrato][0]["dataFim"];
            contrato.deptoPartList = getDepartamentoList(importedJSON, indexContrato);
            contrato.indReajuste = importedJSON[indexContrato][0]["indReajuste"];
            contrato.diaAntecedencia = importedJSON[indexContrato][0]["diaAntecedencia"];
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
 * Retrona objeto com lista de departamentos associados contrato.
 *
 * @param {Object} objDeBusca Array de Objetos contendo contratos
 * @param {Number} indexContrato Índice do contrato a ser pesquisado dentro do Array de Objetos
 * @returns {Object} Novo objeto formado com item pesquisado
 */
function getDepartamentoList (objDeBusca, indexContrato){
    var objFormado = [];

    for ( var i = 0; i < objDeBusca[indexContrato].length; i++ ){
        var deptoPartList = Object.create( deptoPartListSchema );
        if ( getKeyByValue(objFormado, "departamento", objDeBusca[indexContrato][i]["deptoPartList"]) === -1) { // Verifica se o valor existe antes de criar o objeto e coloca-lo a lista
            deptoPartList.departamento = objDeBusca[indexContrato][i]["deptoPartList"]
            objFormado.push( deptoPartList );// Adiciona a lista um novo objeto com o valor encontrado
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
            documentoList.nome = objDeBusca[indexContrato][i]["nome"],
            documentoList.diretorio =  objDeBusca[indexContrato][i]["diretorio"],
            documentoList.tipo = "",
            documentoList.numAditivo = objDeBusca[indexContrato][i]["numAditivo"],
            documentoList.dataInsert =  objDeBusca[indexContrato][i]["dataInsert"]
            objFormado.push( documentoList ); // Adiciona a lista um novo objeto com os valores encontrados
        }
    }
    return objFormado;
}   

/**
 * Verifica se existe um valor dentro de um objeto simples.
 * Não percorre submiveis de array de dentro do objeto, somente
 * primeiro nivel.
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
asyncWriteJsonToFile(objFormado, 'tools/JSON/convertido.json')