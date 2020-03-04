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
//const _ = require('./node_modules/lodash');
//const deepmerge = require ('deepmerge')


const schemaJSONMaker = require('json-schema-defaults'); // Biblioteca para formar schemas JSON

const fs = require('fs');

const textFile = 'tools/JSON/SQL Contratos para JSON (Keyed).json';

// Async
// function asyncReadFile() {
//     fs.readFile(file, 'utf8', (err, textFile) => {
//         if (err) {
//             console.log("Error reading file from disk:", err)
//             return
//         }
//         try {
//             const json = JSON.parse(textFile)
//             console.log("Arquivo de texto carregado")
//             return json
//     } catch(err) {
//             console.log('Error parsing JSON string:', err)
//         }
//     })    
// }

// Synchronous - ReadFile
function syncReadFileToJSON() {
    try {
        const json = JSON.parse(fs.readFileSync(textFile));
        return json;
      } catch(err) {
        console.log(err);
        return
      }
}

// function printImportedJSON(json){
//     console.log(importedJSON[5][0]["nome"]); //Id, Linha da quele ID, Item
// }

// printImportedJSON(json); 

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

//importedJSON[5][0]["nome"]
const importedJSON = syncReadFileToJSON();

function matchJSONValues(){
//    Cria objeto com os valores indicados
    const indexContrato = 1
    if (importedJSON[indexContrato] != null){
        var contrato = Object.create(contratoSchema)//, { 
        //     id: { value: indexContrato },
        //     //id: { value: importedJSON[indexContrato] },
        //     objeto: { value: importedJSON[indexContrato][0]["objeto"] },
        //     estabFiscal: { value: importedJSON[indexContrato][0]["estabFiscal"] },
        //     parceiro: { value: importedJSON[indexContrato][0]["parceiro"] },
        //     cnpj: { value: importedJSON[indexContrato][0]["cnpj"] },
        //     status: { value: importedJSON[indexContrato][0]["status"] },
        //     situacao: { value: importedJSON[indexContrato][0]["situacao"] },
        //     valTotal: { value: importedJSON[indexContrato][0]["valTotal"] },
        //     dataInicio: { value: importedJSON[indexContrato][0]["dataInicio"] },
        //     dataFim: { value: importedJSON[indexContrato][0]["dataFim"] },
        //     deptoPartList: { value: getDepartamentoList(importedJSON, indexContrato) },
        //     indReajuste: { value: importedJSON[indexContrato][0]["indReajuste"] },
        //     diaAntecedencia: { value: importedJSON[indexContrato][0]["diaAntecedencia"] },
        //     obs: { value: importedJSON[indexContrato][0]["obs"] },
        //     historico: { value: importedJSON[indexContrato][0]["historico"] },
        //     anaJuridico: { value: importedJSON[indexContrato][0]["anaJuridico"] },
        //     obs: { value: importedJSON[indexContrato][0]["obs"] },
        //     documentoList: { value: getDocumentoList(importedJSON, indexContrato)  }
        // });
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

        console.log(Object.getPrototypeOf(contrato));
        const print = JSON.stringify(contrato);
//        console.log(contrato.documentoList);
        console.log(contrato);
    } else console.log("Index: [" + indexContrato + "] não encontrado");

//     let contacts = {
//         name: "Timothy",
//         age: 35
//     }

//     let testeObj = Object.create(contratoSchema);
//     testeObj.obs = "Ambiel";
//     testeObj.estabFiscal = "Unidade1"
//     // testeObj.age = 20;
    
//  //   console.log(contacts);
//     console.log(testeObj);
//     console.log(Object.getPrototypeOf(testeObj));
//  //   Object.setPrototypeOf(testeObj, Number)
//     console.log(JSON.stringify(Object.values(testeObj)));

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
        // if ( departamentoList.indexOf(importedJSON[index][j]["deptoPartList"]) === -1) {
        if ( getKeyByValue(objFormado, "departamento", objDeBusca[indexContrato][i]["deptoPartList"]) === -1) { // Verifica se o valor existe antes de criar o objeto e coloca-lo a lista
            objFormado.push( // Adiciona a lista um novo objeto com o valor encontrado
                Object.create(deptoPartListSchema, { departamento: { value: objDeBusca[indexContrato][i]["deptoPartList"] } } )
            );
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
    //const length = Object.keys(importedJSON[index].length); // Verifica quantidade do array em um objeto
    var objFormado = [];
    for ( var i = 0; i < objDeBusca[indexContrato].length; i++ ){
        //if ( getKeyByValue(objFormado, "nome", objDeBusca[indexContrato][i]["nome"]) === -1) {  // Verifica se o valor existe antes de criar o objeto e coloca-lo a lista
            objFormado.push( // Adiciona a lista um novo objeto com o valor encontrado
                Object.create( documentoListSchema, { nome: { value: objDeBusca[indexContrato][i]["nome"] } ,
                                 diretorio: { value: objDeBusca[indexContrato][i]["diretorio"] },
                                 tipo: { value: "" } ,
                                 numAditivo: { value: objDeBusca[indexContrato][i]["numAditivo"] } ,
                                 dataInsert: { value: objDeBusca[indexContrato][i]["dataInsert"] }
                } )
            );
        //}
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
 * @returns Index do objeto com o valor pesquisado dentro do objeto
 */
function getKeyByValue(objeto, key, valor) { 
    for (var prop in objeto) { 
        if (objeto.hasOwnProperty(prop)) { 
            if (objeto[prop][key].value === valor) 
            return prop; 
        } 
    }
    return -1 
} 

matchJSONValues();

// Cria objeto com os valores indicados
// var contrato = Object.create(contratoSchema, { 
//     id: { value: 5},
//     objeto: { value: "Teste"}
// });


// var json0 = {
//     "id": 2,
//     "winner": "Param",
//     "strenths": ["fly", "fight", "speed"],
// };

// var json5 = {
//     "id": 2,
//     "winner": "Aquaman",
//     "strenths": ['teste5', 'teste']
// };

// const merged = deepmerge (json0, json5, {
//     arrayMerge: (destination, source) => {
//         return [ ...destination, ...source]
//     }
// });

// console.log(merged);