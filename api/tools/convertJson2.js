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

//importedJSON[5][0]["nome"]
const importedJSON = syncReadFileToJSON();

function matchJSONValues(){
    // Cria objeto com os valores indicados
    const i = 1
    if (importedJSON[i] != null){
        var contrato = Object.create(contratoSchema, { 
            id: { value: i },
            objeto: { value: importedJSON[i][0]["objeto"] },
            estabFiscal: { value: importedJSON[i][0]["estabFiscal"] },
            parceiro: { value: importedJSON[i][0]["parceiro"] },
            cnpj: { value: importedJSON[i][0]["cnpj"] },
            status: { value: importedJSON[i][0]["status"] },
            situacao: { value: importedJSON[i][0]["situacao"] },
            valTotal: { value: importedJSON[i][0]["valTotal"] },
            dataInicio: { value: importedJSON[i][0]["dataInicio"] },
            dataFim: { value: importedJSON[i][0]["dataFim"] },
            deptoPartList: { value: getDepartamentoList(i) },
            indReajuste: { value: importedJSON[i][0]["indReajuste"] },
            diaAntecedencia: { value: importedJSON[i][0]["diaAntecedencia"] },
            obs: { value: importedJSON[i][0]["obs"] },
            historico: { value: importedJSON[i][0]["historico"] },
            anaJuridico: { value: importedJSON[i][0]["anaJuridico"] },
            obs: { value: importedJSON[i][0]["obs"] },
            documentoList: { value: getDocumentoList(i)  }
        });

        const print = JSON.stringify(contrato);
 //       console.log(contrato.documentoList);
        console.log(print);
    } else console.log("Index: [" + i + "] não encontrado");
}

function getDepartamentoList (index){
    var departamentoList = [];

    for ( var j = 0; j < importedJSON[index].length; j++ ){
        if ( departamentoList.indexOf(importedJSON[index][j]["deptoPartList"]) === -1) { //Verificar funcionamento do IndexOf
            departamentoList.push(
                Object.create( { departamento: { value: importedJSON[index][j]["deptoPartList"] } } )
            );
        }  
    }
    return departamentoList;
}

function getDocumentoList (index) {
    //const length = Object.keys(importedJSON[index].length); // Verifica quantidade do array do objeto
    var documentoList = [];

    for ( var j = 0; j < importedJSON[index].length; j++ ){
        documentoList.push(
            Object.create( { nome: { value: importedJSON[index][j]["nome"] } ,
                               diretorio: { value: importedJSON[index][j]["diretorio"] },
                               tipo: { value: "" } ,
                               numAditivo: { value: importedJSON[index][j]["numAditivo"] } ,
                               dataInsert: { value: importedJSON[index][j]["dataInsert"] }
            } )
        );
        
    }
    return documentoList;
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