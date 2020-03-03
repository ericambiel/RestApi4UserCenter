define(['contrato'], function(contrato) {
    contrato({ 
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
  });