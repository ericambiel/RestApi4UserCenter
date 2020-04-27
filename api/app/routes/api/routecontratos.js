var router = require('express').Router();

var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões
const mail = require('../../../lib/Mail');

const Contrato = require('../../schemas/contrato');

const moment = require('moment');
const imask = require('imask');
const Cron = require('../../../lib/Cron');

// /** 
//  * Listar todos documentos de Contratos 
//  */ 
// router.get(
//   '/', 
//   auth.required, 
//   routePermission.check([ [permissionModule.CONTRATO.select],[permissionModule.ROOT.select] ]), 
//   (req, res) => {
//     Contrato.find()
//     .then(result => res.json(result))
//     .catch(error => res.send(error))
//   });

/**
 * Listara quais departamentos o usuário em Payload é responsável
 * @param {*} payloadJWT Payload com informações do usuário.
 * @returns {Array} Retorna lista com departamentos responsável.
 */
function imResponsibleFor(payloadJWT) {
  try{
    let imResponsibleFor = new Set(); // Não deixa add valores repetidos.
    payloadJWT.departments.map(department => {
      department.departResponsible.map(responsible => {
        if (responsible === payloadJWT._id) 
          imResponsibleFor.add(department.description);
        });
    });
    imResponsibleFor = Array.from(imResponsibleFor); // Transforma em um Array
    return imResponsibleFor;
  }catch(err) { return new Error(err); }
}

/**
 * Formata para CFP po CNPJ, limpa string caso
 * hajam caracteres que não sejam números.
 * @param {*} cnpjOrCpf 
 * @returns Retorna CPF ou CNPJ formatado.
 */
function maskCnpjOrCpf(cnpjOrCpf){
  const value = cnpjOrCpf.toString().replace(/[^0-9]+/g, '');
  const option = { cpf: { mask: '000.000.000-00' }, cnpj: { mask: '00.000.000/0000-00' }};
  let maskedValue;

  if (value.length <= 0) return "Campo esta vazio";
  else if(value.length <= 11) maskedValue = imask.createMask(option.cpf).resolve(value);
  else maskedValue = imask.createMask(option.cnpj).resolve(value);

  return maskedValue;
}

function sendMailExpiredContract(contrato) {
  const user = { name: 'Eric Clapton', email: 'eric.clapton@mybusiness.com' };
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
  }).catch(err => { 
    console.log(`[CONTRATOS]: Erro ao enviar E-Mail de contrato vencido: _id:${contrato.id}`);
    // console.log(`Erro: ${err.message}`);
    throw err
  });
}

// async function expiredContracts() {
//   try{
//     await Contrato.find( 
//       { $or: [
//         { // Encontre os valores da primeira ou segunda query
//           $and:[ // Encontre valores para campos "dataFim" E "status"
//             { dataFim: {
//                 // $gte: new Date('2029-01-01'), // Para datas que estão acima de
//                 $lte: Date.now() // Para datas que estão abaixo de
//               }
//             },
//             { 'options.sendEmailAlerts': { $ne: false } },  // que NÂO possua O valor. Para caso não exista o objeto no documento
//             { status: { $nin: ['Expirado', 'Encerrado'] } }, // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
//           ]
//         },
//         { 
//           // Contratos que o ultimo item da lista contrato.logEmail estejam com expiredEmailSent = false
//           $expr: {$eq: [{$arrayElemAt: ['$logEmail.expiredEmailSent', -1]}, false]}
//         }
//       ]}
//     )
//     // .select( ['status','options.sendEmailAlerts','dataFim','idSecondary'] ) // Trás somente campo status/id
//     // .slice( 'logEmail', -1) // Retorna ultimo item da lista
//     .sort({dataFim: 'asc'}) // Ordem ascendente
//     /* Muda Status dos contratos para "Expirado" */
//     .then(async contratos => {
//       await Promise.all(contratos.map(async contrato => {
//         contrato.status = 'Expirado';
//         await contrato.save().catch(err => { throw err });
//       }));
//       return contratos;
//     })
//     /* Envia emails para gestor da controladoria */
//     .then(async contratos => {
//       await Promise.all(contratos.map(async contrato => {
//         if ( contrato.options === undefined || 
//               contrato.options.sendEmailAlerts !== false ){    
//           return await sendMailExpiredContract(contrato)
//           /* Registra contratos enviados. */
//           .then(async infoMail => {
//             await contrato.updateOne(
//               { $push: 
//                 { logEmail: { expiredEmailSent : true, message: JSON.stringify(infoMail) } } 
//               }).catch(err => { throw err });
//             return infoMail; // Retorna contrato atualizado.
//            })
//            /* registra contratos não enviados */
//           .catch(async err => {
//             await contrato.updateOne(
//               { $push: 
//                 { logEmail: {expiredEmailSent : false, message: err.message.toString()} } 
//               }).catch(err => { throw err });
//             throw err; 
//           });
//         }
//       })).then(mailInfo => res.json(mailInfo));
//     }).catch(err => { throw err });  
//   }
//   catch(err){
//     return(err);
//   }
// }

router.get('/expirados',
auth.required, 
routePermission.check([ [permissionModule.CONTRATO.select],[permissionModule.ROOT.select] ]), 
async(req, res, next) => {
  try{
    await Contrato.find( 
      { $or: [
        { // Encontre os valores da primeira ou segunda query
          $and:[ // Encontre valores para campos "dataFim" E "status"
            { dataFim: {
                // $gte: new Date('2029-01-01'), // Para datas que estão acima de
                $lte: Date.now() // Para datas que estão abaixo de
              }
            },
            { 'options.sendEmailAlerts': { $ne: false } },  // que NÂO possua O valor. Para caso não exista o objeto no documento
            { status: { $nin: ['Expirado', 'Encerrado'] } }, // que NÃO possuam OS valoreS. Para caso não exista o objeto no documento
          ]
        },
        { 
          // Contratos que o ultimo item da lista contrato.logEmail estejam com expiredEmailSent = false
          $expr: {$eq: [{$arrayElemAt: ['$logEmail.expiredEmailSent', -1]}, false]}
        }
      ]}
    )
    // .select( ['status','options.sendEmailAlerts','dataFim','idSecondary'] ) // Trás somente campo status/id
    // .slice( 'logEmail', -1) // Retorna ultimo item da lista
    .sort({dataFim: 'asc'}) // Ordem ascendente
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
        if ( contrato.options === undefined || 
              contrato.options.sendEmailAlerts !== false ){    
          return await sendMailExpiredContract(contrato)
          /* Registra contratos enviados. */
          .then(async infoMail => {
            await contrato.updateOne(
              { $push: 
                { logEmail: { expiredEmailSent : true, message: JSON.stringify(infoMail) } } 
              }).catch(err => { throw err });
            return infoMail; // Retorna contrato atualizado.
           })
           /* registra contratos não enviados */
          .catch(async err => {
            await contrato.updateOne(
              { $push: 
                { logEmail: {expiredEmailSent : false, message: err.message.toString()} } 
              }).catch(err => { throw err });
            throw err; 
          });
        }
      })).then(mailInfo => res.json(mailInfo));
    }).catch(err => { throw err });  
  }
  catch(err){
    next(err);
  }
})

/** 
 * Lista contratos filtrando pelo departamento do usuário. 
 * Caso for do departamento "Controladoria" exibe todos, caso contrario e 
 * se responsável, exibe somente contratos associados ao seu departamento.
*/
router.get(
  '/',
  auth.required, 
  routePermission.check([ [permissionModule.CONTRATO.select],[permissionModule.ROOT.select] ]), 
  async(req, res) => {
    try{
      const auditDepartment = 'Controladoria'; // Responsável pelo depto. que pode ver todos os contratos.
      const _imResponsibleFor = imResponsibleFor(req.payload);
    
      //TODO: Quando os relacionamentos entre departamentos dos contratos e usuários forem feitos, comparar com _id do departamento.
      if( _imResponsibleFor.includes(auditDepartment) ) { // Se da Controladoria/Auditoria.
        Contrato.find()
          .then(result => res.json(result) )
          .catch(error => res.json(error) );
      } else if(_imResponsibleFor.length > 0 ) { // Se maior que 0, usuário é responsável por algum Depto.        
        // find trás contratos para os responsáveis que estão em Depto. Participantes OU Responsáveis para qualquer contrato.7
        Contrato.find(
            { $or:[ 
              {'deptoPartList.departamento': _imResponsibleFor}, 
              {'deptoResponsavel': _imResponsibleFor} 
            ]} 
          )
          .then(result => res.json(result))
          .catch(error => res.json(error));
      } else res.status(400).json({
          errors: {contratos: 
            'Você não possui permissão para visualizar os contratos,\n necessário ser responsável do departamento.'} 
        });
    }catch(err){
      return res.status(400).send({ errors: err.message})
    }
});

/**
 * Altera campos de dados do tipo String para Date
 * // TODO: Pode ser apagado quando forem feitas todas as
 * // conversoes no banco PRD.
 */
router.post('/filds_change_string_to_date',
auth.required, 
routePermission.check([ [permissionModule.ROOT.insert] ]), 
async(req, res, next) => {
  // const today = moment().startOf('day');
  // const aYear = moment(today).endOf('year');
  try{
    /** Converte campos StringDate para ISODate */
    await Contrato.find()
    .then(async contratos => {
      return await Promise.all(
        contratos.map(async contrato => {
          if(contrato.dataInicio !== null)
            contrato.dataInicio = new Date(contrato.dataInicio).setMilliseconds(1);
          if(contrato.dataFim !== null)
            contrato.dataFim = new Date(contrato.dataFim).setMilliseconds(1);
            
          contrato.documentoList.forEach(documento => {
            if (documento.dataInsert !== null)
              documento.dataInsert = new Date(documento.dataInsert).setMilliseconds(1);
          })
          return await contrato.save(contrato).catch(err => {throw err}); 
        })
      );
    })
    .then( (result => res.json(result) ))
    .catch(err => {throw err})
  }catch(err) { next(err); }
})

/**
 * Insere documento em Contratos
 * Já faz a ligação entre Body da request e objeto modelo Contrato 
 */
router.post(
  '/', 
  auth.required, 
  routePermission.check([ [permissionModule.CONTRATO.insert],[permissionModule.ROOT.insert] ]), 
  (req, res) => {
    const contrato = new Contrato(req.body)
    contrato.save()
      .then(result => res.json(result))
      .catch(error => res.send(error));
});

/**
 * Atualiza documento em Contratos
 * Pode ser enviado somente objeto com valor a ser atualizado
 */
router.patch(
  '/:id', 
  auth.required, 
  routePermission.check([ [permissionModule.CONTRATO.update],[permissionModule.ROOT.update] ]), 
  (req, res) => {
    const { id } = req.params; // Obtém parâmetro informado na URL
    const items = req.body;
    
    Contrato.findByIdAndUpdate( 
      id, // Id a ser modificado
      items, // Novos valores para serem atualizados, caso ele não encontre algum objeto iro somente utilizar os encontrados 
      {//setDefaultsOnInsert: true, // Verifica "defaults" em Schema caso haja alteração.
       new: true }) // Diz para o Mongo trazer as informações do documento já atualizadas ao invés de um pré visualização
        .then(result => res.json(result))
        .catch(error => res.send(error));
});

/** 
 * Deletar documento em Contratos  
 */ 
router.delete(
  '/:id', 
  auth.required, 
  routePermission.check([ [permissionModule.CONTRATO.delete],[permissionModule.ROOT.select] ]), 
  (req, res) => {
    const { id } = req.params;
  
    Contrato.findByIdAndDelete( id )
      .then(result => res.json(result)) // Envia Resultados das mudanças
      .catch(error => res.send(error)); // Caso contrario envia mensagem de erro 
});

module.exports = router;