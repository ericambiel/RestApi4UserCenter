'use strict';
const Contrato = require('../schemas/contrato');
const mail = require('../../lib/Mail');
const moment = require('moment');
const imask = require('imask');
const consoleLog = require('../../lib/ConsoleLog');

class ContractController {
  constructor() {}

  /**
   * Listara quais departamentos o usuário em Payload é responsável
   * @param {*} payloadJWT Payload com informações do usuário.
   * @returns {Array} Retorna lista com departamentos responsável.
   */
  imResponsibleFor(payloadJWT) {
    try {
      let imResponsibleFor = new Set(); // Não deixa add valores repetidos.
      payloadJWT.departments.map(department => {
        department.departResponsible.map(responsible => {
          if (responsible === payloadJWT._id)
            imResponsibleFor.add(department.description);
        });
      });
      imResponsibleFor = Array.from(imResponsibleFor); // Transforma em um Array
      return imResponsibleFor;
    } catch (err) { throw new Error(err); }
  }

  // TODO: Refatorar, muito grande
  // TODO: Caso falhe tentar enviar novamente por 3 vezes
  /**
   * Busca contratos expirados e começa 
   * rotina de envio de E-Mails
   */
  async expiredContracts() {
    try {
      // const fieldToLog = 'expiredEmailSent'; // Campo para inserir estado do envio de email
      
      // const firstParamAnd = { $nin: ['Encerrado', 'Descontinuado'] }; // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
      // const secondParamAnd = { dataFim: { $lte: new Date() } }; // diaAntecedencia >= 1, dataFim != null, dataFim > dataAgora
      // const thirdParamAnd = `$logEmail.${fieldToLog}`; // Nome do campo em um array a ser procurado
      // const firstParamProject = null; // Dia que email sera enviado 
    
      //return await coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject, fieldToLog)



      return await Contrato.find({
          $or: [{ // Encontre os valores da primeira ou segunda query
              $and: [ // Encontre valores para campos "dataFim" E "status"
                {
                  'options.sendEmailAlerts': {
                    $ne: false
                  }
                }, // que NÂO possua O valor. Para caso não exista o objeto no documento
                {
                  dataFim: {
                    // $gte: new Date('2029-01-01'), // Para datas que estão após a
                    $lte: Date.now() // Para datas que estão antes de
                  }
                },
                {
                  status: {
                    $nin: ['Expirado', 'Encerrado', 'Descontinuado']
                  }
                }, // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
              ]
            },
            {
              // Contratos que o ultimo item da lista contrato.logEmail estejam com expiredEmailSent = false
              $expr: {
                $eq: [{
                  $arrayElemAt: ['$logEmail.expiredEmailSent', -1]
                }, false]
              }
            }
          ]
        })
        // .select( ['status','options.sendEmailAlerts','dataFim','idSecondary'] ) // Trás somente campo status/id
        // .slice( 'logEmail', -1) // Retorna ultimo item da lista
        .sort({
          dataFim: 'asc'
        }) // Ordem ascendente
        /* Muda Status dos contratos para "Expirado" */
        .then(async contratos => {
          await Promise.all(contratos.map(async contrato => {
            contrato.status = 'Expirado';
            await contrato.save().catch(err => { throw err });
          }));
          return contratos;
        })
        /* Envia emails para gestor da controladoria */
        .then(async contratos => {
          await Promise.all(contratos.map(async contrato => {
            if (contrato.options === undefined ||
              contrato.options.sendEmailAlerts !== false) {
              return await sendMailContract(contrato)
                /* Registra contratos enviados. */
                .then(async infoMail => {
                  await contrato.updateOne({
                    $push: {
                      logEmail: {
                        expiredEmailSent: true,
                        message: JSON.stringify(infoMail)
                      }
                    }
                  }).catch(err => { throw err; });
                  return infoMail; // Retorna contrato atualizado.
                })
                /* registra contratos não enviados */
                .catch(async err => {
                  await contrato.updateOne({
                    $push: {
                      logEmail: {
                        expiredEmailSent: false,
                        message: err.message.toString()
                      }
                    }
                  }).catch(err => { throw err; });
                  throw err;
                });
              }
          }));
        })
        .catch(err => { throw err; });
    } catch (err) { throw new Error(err); }
  }

  /**
   * Busca contratos indefinidos que contenham 
   * data de dataAntecedencia e começa processo 
   * de envio de E-Mails
   */
  async indefiniteContracts() {
    try{
      const yearInMillisecond = 86400000 * 365;
      
      const fieldToLog = 'indefiniteEmailSent';
  
      const firstParamAnd = { $nin: ['Expirado', 'Encerrado', 'Descontinuado'] }; // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
      const secondParamAnd = { diaAntecedencia: { $gte: 1 }, dataFim: { $eq: null } }; // diaAntecedencia >= 1, dataFim = null
      const thirdParamAnd = `$logEmail.${fieldToLog}`; // Nome do campo em um array a ser procurado
      const firstParamProject = { $add: [ '$dataInicio', { $subtract: [ yearInMillisecond, { $multiply: [ '$diaAntecedencia', 86400000 ] } ] } ] }; // Dia que email sera enviado 
      
      return await coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject, fieldToLog)
    }catch(err){ throw new Error(err); }
  }

  /**
   * Busca contratos à vencer e começa 
   * processo de envio de E-Mails de acordo
   * com data de antecedência.
   */
  async expiringContracts() {
    try{
      const fieldToLog = 'expiringEmailSent'; // Campo para inserir estado do envio de email
      
      const firstParamAnd = { $nin: ['Encerrado', 'Descontinuado'] }; // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
      const secondParamAnd = { diaAntecedencia: { $gte: 1 }, dataFim: { $gt: new Date() } }; // diaAntecedencia >= 1, dataFim != null, dataFim > dataAgora
      const thirdParamAnd = `$logEmail.${fieldToLog}`; // Nome do campo em um array a ser procurado
      const firstParamProject = { $subtract: [ '$dataFim', { $multiply: [ '$diaAntecedencia', 86400000 ] } ] }; // Dia que email sera enviado 
    
      return await coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject, fieldToLog)
    }catch(err){ throw new Error(err); }
  }
}

/**
  * Formata para CFP po CNPJ, limpa string caso
  * hajam caracteres que não sejam números.
  * @param {*} cnpjOrCpf 
  * @returns Retorna CPF ou CNPJ formatado.
  */
function maskCnpjOrCpf(cnpjOrCpf) {
  const value = cnpjOrCpf.toString().replace(/[^0-9]+/g, '');
  const option = {
    cpf: {
      mask: '000.000.000-00'
    },
    cnpj: {
      mask: '00.000.000/0000-00'
    }
  };
  let maskedValue;

  if (value.length <= 0) return "Campo esta vazio";
  else if (value.length <= 11) maskedValue = imask.createMask(option.cpf).resolve(value);
  else maskedValue = imask.createMask(option.cnpj).resolve(value);

  return maskedValue;
}

function sendMailContract(contrato) {
  const user = {
    name: 'Eric Clapton',
    email: 'eric.clapton@mybusiness.com'
  };
  return mail.sendMail({
      to: `${user.name} <${user.email}>`,
      subject: 'Alerta de Contrato(s) Expirado(s)',
      template: 'expired_contract',
      context: {
        //user: user.name,
        _id: contrato._id,
        objeto: contrato.objeto,
        parceiro: contrato.parceiro,
        cnpj: maskCnpjOrCpf(contrato.cnpj),
        natureza: contrato.natureza,
        deptoResponsavel: contrato.deptoResponsavel,
        dataInicio: moment(contrato.dataInicio).format('DD/MM/YYYY'),
        dataFim: moment(contrato.dataFim).format('DD/MM/YYYY'),
        status: contrato.status
      }
    })
    .then(infoMail => { return infoMail; })
    .catch(err => { throw err });
}

async function findAlertContracts(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject ) {
  return await Contrato.aggregate(
    [
      { $match: {
          $and: [ // Encontre documentos que contemplem todos os requisitos
            { 'options.sendEmailAlerts': { $ne: false } }, // que NÂO possua O valor. Para caso não exista o objeto no documento
            { status: firstParamAnd }, 
            secondParamAnd,
            { $expr: // Iniciar expressão
              { $ne: // Não contenha
                [ { $arrayElemAt: // No array 
                  [ thirdParamAnd , -1] }, true] } }, // Ultimo do array que seja = true
          ]
        }
      },
      { $project: {
            objeto: 1, parceiro: 1, cnpj: 1, departResponsavel: 1, natureza: 1, // Campos para serem exibidos
            options: 1, status: 1, dataInicio: 1, dataFim: 1, diaAntecedencia: 1, logEmail: 1, 
            dateToSendEmail: firstParamProject 
        }
      },
      { $match: { dateToSendEmail: { $lte: new Date() } } }, // Filtra contratos que serão enviado hoje
      // { $sort: { dateToSendEmail: 1 } } // Não esta funcionando
    ]
  )
  // .sort({ dateToSendEmail: 'asc' }) // Ordem ascendente, não esta funcionando
  .catch(err => { throw err; });
}

/**
 * Registra informações de horários e mensagens de erro ou não
 * no envio de email para o contrato.
 * @param {Contrato} contrato Model do contrato que foi atualizado.
 * @param {mail} infoMail Contem informações do disparo de email.
 * @param {String} fieldToLog Campo que sera usado para registro
 */
async function logEmail(contrato, fieldToLog, infoMail) {
  const query = {
    $push: {
      logEmail: {
        message: infoMail instanceof Error ? infoMail.message.toString() : JSON.stringify(infoMail) }
    }
  }
  query.$push.logEmail[fieldToLog] = infoMail instanceof Error ? false : true; // Se erro false

  return await Contrato.findByIdAndUpdate(contrato._id, query)
  .then(() => { 
    consoleLog.printConsole(infoMail instanceof Error
      ? `[ERROR][CONTRATOS] ${fieldToLog} - Erro ao enviar E-Mail; contrato: _id: ${contrato._id}`
      : `[INFO][CONTRATOS] ${fieldToLog} - E-Mail enviado com sucesso; contrato: _id: ${contrato._id}`);
    return infoMail; })
  .catch(err => { throw err; });
}

/**
 * Faz chamadas a função que realizara uma consulta(Aggregate) no banco NoSQL,
 * chama função que envia email e função que registra se e-mail foi ou não enviado.
 * @param {*} firstParamAnd Campo contendo primeiro nível de procura AND
 * @param {*} secondParamAnd Campo contendo segundo nível de procura AND
 * @param {*} thirdParamAnd Campo contendo terceiro nível de procura AND
 * @param {*} firstParamProject Compo para filtrar valores encontrados.
 * @param {String} fieldToLog Campo para inserir estado do envio de email.
 */
async function coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject, fieldToLog) {
  return await findAlertContracts(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject)
    .then(async (contratos) => {
      return await Promise.all(contratos.map(async (contrato) => {
        return await sendMailContract(contrato)
          /* Registra contratos enviados. */
          .then(async (infoMail) => {
            return await logEmail(contrato, fieldToLog, infoMail).catch(err => { throw err; });
          })
          /* registra contratos não enviados */
          .catch(async (err) => {
            throw await logEmail(contrato, fieldToLog, err).catch(err => { throw err; });
          });
      }));
    })
    .catch(err => { throw err; });
}

module.exports = new ContractController();