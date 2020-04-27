'use strict';
const Contrato = require('../schemas/contrato');
const mail = require('../../lib/Mail');
const moment = require('moment');
const imask = require('imask');


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
    } catch (err) {
      return new Error(err);
    }
  }

  /**
   * Formata para CFP po CNPJ, limpa string caso
   * hajam caracteres que não sejam números.
   * @param {*} cnpjOrCpf 
   * @returns Retorna CPF ou CNPJ formatado.
   */
  maskCnpjOrCpf(cnpjOrCpf) {
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

  sendMailExpiredContract(contrato) {
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
          cnpj: this.maskCnpjOrCpf(contrato.cnpj),
          natureza: contrato.natureza,
          deptoResponsavel: contrato.deptoResponsavel,
          dataInicio: moment(contrato.dataInicio).format('DD/MM/YYYY'),
          dataFim: moment(contrato.dataFim).format('DD/MM/YYYY'),
          status: contrato.status
        }
      })
      .then(infoMail => {
        console.log(`[CONTRATOS]: E-Mail enviado com sucesso para contrato vencido: _id: ${contrato.id}`)
        return infoMail;
      })
      .catch(err => {
        console.log(`[CONTRATOS]: Erro ao enviar E-Mail de contrato vencido: _id: ${contrato.id}`);
        // console.log(`Erro: ${err.message}`);
        throw err
      });
  }

  // TODO: Refatorar, muito grande
  // TODO: Caso falhe tentar enviar novamente por 3 vezes
  /**
   * Busca contratos expirados e começa 
   * rotina de envio de E-Mails
   */
  async expiredContracts() {
    try {
      return await Contrato.find({
          $or: [{ // Encontre os valores da primeira ou segunda query
              $and: [ // Encontre valores para campos "dataFim" E "status"
                {
                  dataFim: {
                    // $gte: new Date('2029-01-01'), // Para datas que estão após a
                    $lte: Date.now() // Para datas que estão antes de
                  }
                },
                {
                  'options.sendEmailAlerts': {
                    $ne: false
                  }
                }, // que NÂO possua O valor. Para caso não exista o objeto no documento
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
            await contrato.save().catch(err => {
              throw err
            });
          }));
          return contratos;
        })
        /* Envia emails para gestor da controladoria */
        .then(async contratos => {
          await Promise.all(contratos.map(async contrato => {
            if (contrato.options === undefined ||
              contrato.options.sendEmailAlerts !== false) {
              return await this.sendMailExpiredContract(contrato)
                /* Registra contratos enviados. */
                .then(async infoMail => {
                  await contrato.updateOne({
                    $push: {
                      logEmail: {
                        expiredEmailSent: true,
                        message: JSON.stringify(infoMail)
                      }
                    }
                  }).catch(err => {
                    throw err
                  });
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
                  }).catch(err => {
                    throw err
                  });
                  throw err;
                });
            }
          }));
        })
        .catch(err => {
          throw err
        });
    } catch (err) {
      throw new Error(err);
    }
  }

  async findAlertContracts(firstParamAnd, secondParamAnd, firstParamOr) {
    return await Contrato.find({
      $or: [{ // Encontre os valores da primeira ou segunda query
          $and: [ // Encontre valores para campos "dataFim" E "status"
            {
              'options.sendEmailAlerts': { $ne: false }
            }, // que NÂO possua O valor. Para caso não exista o objeto no documento
            {
              status: { $nin: firstParamAnd }
            }, // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
            { 
              dataFim: secondParamAnd
              // dataFim: {
              //   // $gte: new Date('2029-01-01'), // Para datas que estão após a
              //   $lte: Date.now() // Para datas que estão antes de
              // }
            },
          ]
        },
        {
          // Contratos que o ultimo item da lista contrato.logEmail estejam com expiredEmailSent = false
          $expr: {
            $eq: [{
              $arrayElemAt: [ firstParamOr , -1]
            }, false]
          }
        }
      ]
      // .select( ['status','options.sendEmailAlerts','dataFim','idSecondary'] ) // Trás somente campo status/id
      // .slice( 'logEmail', -1) // Retorna ultimo item da lista
    }).sort({
      dataFim: 'asc' // Ordem ascendente
    }).catch(err => {
      throw err
    });
  }

  /**
   * Busca contratos à vencer e começa 
   * processo de envio de E-Mails
   */
  async expiringContracts() {
    const firstParamAnd = ['Expirado', 'Encerrado', 'Descontinuado']
    const firstParamOr = '$logEmail.expiringEmailSent';
    try{
      const contratos = this.findAlertContracts(firstParamAnd, null, firstParamOr);
      console.log(contratos);
      return contratos;
    }catch(err){
      throw new Error(err);
    }
  }
}

module.exports = new ContractController();