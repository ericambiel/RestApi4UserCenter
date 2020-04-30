'use strict';
const Contrato = require('../schemas/contrato');
const Mail = require('../../lib/Mail');
const moment = require('moment');
const imask = require('imask');
const ConsoleLog = require('../../lib/ConsoleLog');
let mail;

class ContractController {
  constructor() { }

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
    } catch (err) { throw new Error(err.message); }
  }

  // TODO: Caso falhe tentar enviar novamente por 3 vezes

  /**
   * Busca contratos expirados e começa 
   * rotina de envio de E-Mails
   */
  async expiredContracts() {
    try {
      const fieldToLog = 'expiredEmailSent'; // Campo para inserir estado do envio de email
      
      const firstParamAnd = { $nin: ['Expirado', 'Encerrado', 'Descontinuado'] }; // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
      const secondParamAnd = { dataFim: { $lte: new Date() } }; // diaAntecedencia >= 1, dataFim != null, dataFim > dataAgora
      const thirdParamAnd = `$logEmail.${fieldToLog}`; // Nome do campo em um array a ser procurado
      const firstParamProject = new Date(); // Dia que email sera enviado 
    
      return await coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject, fieldToLog)

    } catch (err) { throw new Error(err.message); }
  }

  /**
   * Busca contratos indeterminados que contenham 
   * data de dataAntecedencia e começa rotina 
   * de envio de E-Mails
   */
  async indeterminateContracts() {
    try{
      const yearInMillisecond = 86400000 * 365;
      
      const fieldToLog = 'indeterminateEmailSent';
  
      const firstParamAnd = { $nin: ['Expirado', 'Encerrado', 'Descontinuado'] }; // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
      const secondParamAnd = { diaAntecedencia: { $gte: 1 }, dataFim: { $eq: null } }; // diaAntecedencia >= 1, dataFim = null
      const thirdParamAnd = `$logEmail.${fieldToLog}`; // Nome do campo em um array a ser procurado
      const firstParamProject = { $add: [ '$dataInicio', { $subtract: [ yearInMillisecond, { $multiply: [ '$diaAntecedencia', 86400000 ] } ] } ] }; // Dia que email sera enviado 
      
      return await coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject, fieldToLog)
    }catch(err){ throw new Error(err.message); }
  }

  /**
   * Busca contratos à vencer e começa 
   * rotina de envio de E-Mails de acordo
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
    }catch(err){ throw new Error(err.message); }
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

/**
 * Envia email ao destinatário com contrato.
 * @param {Object} contrato Objeto com informações do contrato
 * @param {String} template nome do templete a ser usado no envio do email.
 */
function sendMailContract(contrato, template) {
  mail = new Mail();
  const user = {
    name: 'Eric Clapton',
    email: 'eric.clapton@mybusiness.com'
  };
  return mail.sendMail({
      to: `${user.name} <${user.email}>`,
      subject: 'Alerta de Contrato(s) Expirado(s)',
      template: template,
      context: {
        //user: user.name,
        _id: contrato._id,
        objeto: contrato.objeto,
        parceiro: contrato.parceiro,
        cnpj: maskCnpjOrCpf(contrato.cnpj),
        natureza: contrato.natureza,
        deptoResponsavel: contrato.deptoResponsavel,
        dataInicio: moment(contrato.dataInicio).format('DD/MM/YYYY'),
        dataFim: contrato.dataFim !== null 
            ? moment(contrato.dataFim).format('DD/MM/YYYY') 
            : 'Contrato com data indeterminado',
        status: contrato.status,
        diaAntecedencia : contrato.diaAntecedencia
      }
    })
    .then(infoMail => { 
      return infoMail; })
    .catch(err => { throw err });
}

async function findAlertContracts(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject ) {
  return await Contrato.aggregate(
    [
      { $match: {
          $or: [ // Encontra documentos que contemplem um ou outro requisito
            { $expr: // Iniciar expressão
              { $eq: // ===
                [ { $arrayElemAt: // No array 
                  [ thirdParamAnd , -1] }, false] } 
            }, // Ultimo do array que seja = false
            { $and: [ // Encontre documentos que contemplem todos os requisitos
                { 'options.sendEmailAlerts': { $ne: false } }, // que NÂO possua O valor. Para caso não exista o objeto no documento
                { status: firstParamAnd }, 
                secondParamAnd,
                { $expr: // Iniciar expressão
                  { $ne: // ==!
                    [ { $arrayElemAt: // No array 
                      [ thirdParamAnd , -1] }, true] } 
                }, // Ultimo do array que seja = true
              ] 
            },
          ]
        }
      },
      { $addFields: { // Add o campo no select
          dateToSendEmail: firstParamProject,
        }
      },
      { $sort: { dateToSendEmail: 1 } }, // Em ordem crescente
      { $match: { dateToSendEmail: { $lte: new Date() } } }, // Filtra contratos que serão enviado hoje
    ]
  )
  // .sort({ dataInicio: 'asc' }) // Ordena tudo que foi secionado pelo primeiro match
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
    new ConsoleLog().printConsole(infoMail instanceof Error
      ? `[ERROR][CONTRATOS] ${fieldToLog} - Erro ao enviar E-Mail; contrato: _id: ${contrato._id}`
      : `[INFO][CONTRATOS] ${fieldToLog} - E-Mail enviado com sucesso; contrato: _id: ${contrato._id}`);
    return infoMail; })
  .catch(err => { throw err; });
}

/**
 * Identifica o templete a ser usado no envio do email.
 * @param {String} identifier identifica o templete a ser usado
 */
function selectTemplate(identifier){
  switch (identifier) {
    case 'expiringEmailSent':
      return 'expiring_contract';
    case 'indeterminateEmailSent':
      return 'indeterminate_contract';
    case 'expiredEmailSent':
      return 'expired_contract';
    default:
      new ConsoleLog().printConsole('[ERROR] Templete para email não encontrado');
      throw new Error('Templete para email não encontrado');
  }
}

/**
 * Faz chamadas a função que realizara uma consulta(Aggregate) no banco NoSQL,
 * chama função que envia email e função que registra se e-mail foi ou não enviado.
 * @param {*} firstParamAnd Campo contendo primeiro nível de procura AND
 * @param {*} secondParamAnd Campo contendo segundo nível de procura AND
 * @param {*} thirdParamAnd Campo contendo terceiro nível de procura AND
 * @param {*} firstParamProject Compo para filtrar valores encontrados.
 * @param {String} fieldToLog Campo para inserir estado do envio de email, também usado para definir templete.
 */
async function coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject, fieldToLog) {
  return await findAlertContracts(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamProject)
    .then(async (contratos) => {
      // return contratos;
      return await Promise.all(contratos.map(async (contrato) => {
        return await sendMailContract(contrato, selectTemplate(fieldToLog))
          /* Registra contratos enviados. */
          .then(async (infoMail) => {
            if (fieldToLog === 'expiredEmailSent')
              await Contrato.findByIdAndUpdate(contrato._id, { status: 'Expirado' }).catch(err => { throw err; });
            return await logEmail(contrato, fieldToLog, infoMail).catch(err => { throw err; });
          })
          /* registra contratos não enviados */
          .catch(async (err) => {
            throw await logEmail(contrato, fieldToLog, err).catch(err => { throw err; });
          });
      }))
      .catch(err => {throw err});
    })
    .then(infoMail => {
      if (mail !== undefined) mail.transporter.close();
      return infoMail;
    })
    .catch(err => { throw err; });
}

module.exports = new ContractController();