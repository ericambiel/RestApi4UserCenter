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
      const firstParamOr = new Date(); // Dia que email sera enviado 
    
      return await coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamOr, fieldToLog);

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
      const firstParamOr = { $add: [ '$dataInicio', { $subtract: [ yearInMillisecond, { $multiply: [ '$diaAntecedencia', 86400000 ] } ] } ] }; // Dia que email sera enviado 
      
      return await coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamOr, fieldToLog);
    }catch(err){ throw new Error(err.message); }
  }

  /**
   * Busca contratos à vencer e começa 
   * rotina de envio de E-Mails de acordo
   * com data de antecedência.
   */
  async expiringContracts() {
    try{
      const fieldToLog = 'expiringEmailSent'; // Campo para inserir estado do envio de email | Templete Email
      
      const firstParamAnd = { $nin: ['Encerrado', 'Descontinuado'] }; // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
      const secondParamAnd = { diaAntecedencia: { $gte: 1 }, dataFim: { $gt: new Date() } }; // diaAntecedencia >= 1, dataFim != null, dataFim > dataAgora
      const thirdParamAnd = `$logEmail.${fieldToLog}`; // Nome do campo em um array a ser procurado
      const firstParamOr = { $subtract: [ '$dataFim', { $multiply: [ '$diaAntecedencia', 86400000 ] } ] }; // Dia que email sera enviado 
      
      await findRegularlyContracts(thirdParamAnd);

      return await coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamOr, fieldToLog);
    }catch(err){ throw new Error(err.message); }
  }
}

/**
 * Busca contratos onde algum email de Alerta já foi enviado
 * antes, e começa enviar emails regulares, 
 * desde que regularitySendMail >= 1.
 * @param {boolean} fieldToCompare Campo que informa se  
 * primeiro email já foi enviado para contrato.
 */
async function findRegularlyContracts(fieldToCompare) {
  try{
    const fieldToLog = 'regularlyEmailSent'; // Campo para inserir estado do envio de email | Templete Email
    
    const firstParamAnd = { $nin: ['Encerrado', 'Descontinuado'] }; // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
    const secondParamAnd = 
      { dataFim: { $gt: new Date() }, // dataFim > dataAgora
        'options.regularitySendMail': { $ne: 0 }, // regularitySendMail != 0
        $expr: { $eq: [ { $arrayElemAt: [ fieldToCompare , -1] }, true ] } }; // fieldToCompare == true        
    const firstParamOr = 
      { $add: [                         // Incrementa um valor ao outro.
        // Retorna ultimo "createdAt" onde expiringEmailSent == true || expiringEmailSent == true 
        { $let: {                       // Cria variável temporária
            vars: {                     // Bloco de variáveis a serem criadas
                filtered: {             // Nome variável temporária.
                  $filter: {            // Filtra valores encontrados.
                    input: '$logEmail', // Array a realizar a procura.
                    as: 'logEmail',     // Apelido do array.
                    cond: {             // Condição para aplicar filtro.
                      $or: [ 
                        { $eq: [ `$$logEmail.${fieldToLog}`, true ] }, // logEmail.regularlyEmailSent == true
                        { $eq: [ `$${fieldToCompare}`, true ] } // logEmail.expiringEmailSent == true
                    ] } } } },
            in: { 
              $arrayElemAt: [ "$$filtered.createdAt", -1 ] } // Retorna ultimo valor encontrado
          } 
        },
        { $multiply: [ '$options.regularitySendMail' , 86400000 ] } ] // '$options.regularitySendMail'
      }; // Retorna dia que email sera enviado 

    return await coreSendEmail(firstParamAnd, secondParamAnd, null, firstParamOr, fieldToLog);
  } catch(err) { throw new Error(err.message); }
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
function sendMailContract(contrato, identifier) {
  mail = new Mail();
  const user = {
    name: '',
    email: process.env.MAIL_SEND_TO
  };
  return mail.sendMail({
      to: `${user.name} <${user.email}>`,
      subject: `${identifier.subject}, ID: ${contrato.id}`,
      template: identifier.template,
      context: {
        //user: user.name,
        id: contrato.id,
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
        diaAntecedencia: contrato.diaAntecedencia,
        regularitySendMail: contrato.options.regularitySendMail,
        dateSendNextEmail: moment().add(contrato.options.regularitySendMail, 'd').format('DD/MM/YYYY')
      }
    })
    .then(infoMail => { 
      return infoMail; })
    .catch(err => { throw err });
}

/**
 * Corpo padrão de uma Agregação, usado para pesquisar
 * contratos para envio de E-Mails.
 * @param {*} firstParamAnd 1º parâmetro AND da query
 * @param {*} secondParamAnd 2º parâmetro AND da query
 * @param {*} thirdParamAnd 3º parâmetro AND da query
 * @param {*} firstParamOr 1º parâmetro OR da query
 */
async function aggregationQueryBody(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamOr ) {
  return await Contrato.aggregate(
    [
      { $match: {
          $or: [ // Encontra documentos que contemplem um ou outro requisito
        // Encontra contratos para emails que falharam no envio. //
            { $expr: // Iniciar expressão
              { $eq: // ===
                [ { $arrayElemAt: // No array 
                  [ thirdParamAnd , -1] }, false] } 
            }, // Ultimo do array que seja = false
        // Encontra novos contratos para enviar emails. //
            { $and: [ // Encontre documentos que contemplem todos os requisitos
                { 'options.sendEmailAlerts': { $ne: false } }, // que NÂO possua O valor. Para caso não exista o objeto no documento
                { status: firstParamAnd }, 
                secondParamAnd,
                { $expr: // Iniciar expressão
                  { $ne: // ==!
                    [ { $arrayElemAt: // No array 
                      [ thirdParamAnd , -1] }, true] } // Ultimo do array que seja = true
                }, 
              ] 
            },
          ]
        }
      },
      { $addFields: { // Add o campo no select
          dateToSendEmail: firstParamOr,
        }
      },
      { $sort: { dateToSendEmail: 1 } }, // Em ordem crescente
      { $match: { dateToSendEmail: { $lte: moment().endOf('day').toDate() } } }, // Filtra contratos que serão enviado hoje ou que não foram enviados
    ]
  )
  // Object JavaScript para Mongoose model, para gerar campos virtuais.
  .then(contratos => {
    return contratos.map(contrato => {
      return new Contrato(contrato);
    });
  })
  // .sort({ dataInicio: 'asc' }) // Ordena tudo que foi secionado pelo primeiro match
  .catch(err => { throw err; });
}

/**
 * Registra informações de horários e mensagens de erro ou não
 * no envio de email para o contrato.
 * @param {Contrato} contrato Model do contrato que foi atualizado.
 * @param {String} fieldToLog Campo que sera usado para registro
 * @param {mail} infoMail Contem informações do disparo de email.
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
    infoMail instanceof Error
      ? new ConsoleLog('error').printConsole(`[CONTRATOS] ${fieldToLog} - Erro ao enviar E-Mail; contrato: _id: ${contrato._id}`)
      : new ConsoleLog('info').printConsole(`[CONTRATOS] ${fieldToLog} - E-Mail enviado com sucesso; contrato: _id: ${contrato._id}`)
    return infoMail; })
  .catch(err => { throw err; });
}

/**
 * Identifica o templete a ser usado no envio do email.
 * @param {String} identifier identifica o templete a ser usado
 */
function selectTemplate(identifier){
  const options = { template: '', subject: '' };
  switch (identifier) {
    case 'expiringEmailSent':
      options.template = 'expiring_contract';
      options.subject = 'Alerta de Contrato à Vencer';
      return options;
    case 'regularlyEmailSent':
      options.template = 'regularly_contract';
      options.subject = 'Aviso regular de contrato';
      return options;
    case 'indeterminateEmailSent':
      options.template = 'indeterminate_contract';
      options.subject = 'Alerta de Contrato Indeterminado';
      return options;
    case 'expiredEmailSent':
      options.template = 'expired_contract';
      options.subject = 'Alerta de Contrato Expirado';
      return options;
    default:
      new ConsoleLog('error').printConsole('Templete para email não encontrado');
      throw new Error('Templete para email não encontrado');
  }
}

/**
 * Faz chamadas a função que realizara uma consulta(Aggregate) no banco NoSQL,
 * chama função que envia email e função que registra se e-mail foi ou não enviado.
 * @param {*} firstParamAnd Campo contendo primeiro nível de procura AND
 * @param {*} secondParamAnd Campo contendo segundo nível de procura AND
 * @param {*} thirdParamAnd Campo contendo terceiro nível de procura AND
 * @param {*} firstParamOr Compo para filtrar sobre valores encontrados.
 * @param {String} fieldToLog Campo para inserir estado do envio de email, também usado para definir templete.
 */
async function coreSendEmail(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamOr, fieldToLog) {
  return await aggregationQueryBody(firstParamAnd, secondParamAnd, thirdParamAnd, firstParamOr)
    .then(async (contratos) => {
      // return contratos; // Debug, retorna contratos ao endpoint.
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