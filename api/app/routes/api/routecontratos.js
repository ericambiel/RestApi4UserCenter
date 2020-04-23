var router = require('express').Router();

var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões
const mail = require('../../../lib/Mail');

const Contrato = require('../../schemas/contrato');

const moment = require('moment');
const imask = require('imask');

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

router.get('/expirados',
auth.required, 
routePermission.check([ [permissionModule.CONTRATO.select],[permissionModule.ROOT.select] ]), 
(req, res) => {
  try{
    Contrato.find( 
      { dataFim: { 
          $gte: new Date(new Date('2024-01-01')), 
          $lte: new Date(new Date('2030-12-31')) } 
    }).then(async contratos => {
      let errInfoMail;
      await contratos.forEach(async contrato => {
        // console.log(contrato);
        const user = { name: 'Eric Clapton', email: 'eric.clapton@mybusiness.com' };
        
        errInfoMail = await mail.sendMail({
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
          console.log(`Contrato: ${contrato.id}, não foi possivel enviar email para contrato vencido`);
          console.log(`Erro: ${err.message}`);
          return {Contrato: { errors: err.message }};
        });
        res.json(errInfoMail);
      });
      
    }).catch(err => { return err });  
  }
  catch(err){
    return res.status(400).send({ errors: err.message});
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
              {'deptoPartList.departamento': _imResponsibleFor}, {'deptoResponsavel': _imResponsibleFor} 
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
async(req, res) => {
  // const today = moment().startOf('day');
  // const aYear = moment(today).endOf('year');

  /** Converte campos StringDate para ISODate */
  await Contrato.find()
  .then(contratos => {
    contratos.forEach(async contrato => {
      if(contrato.dataInicio !== null)
        contrato.dataInicio = new Date(new Date(contrato.dataInicio).setMilliseconds(1));
      if(contrato.dataFim !== null)
        contrato.dataFim = new Date(new Date(contrato.dataFim).setMilliseconds(1));
        
      contrato.documentoList.forEach(documento => {
        if (documento.dataInsert !== null)
          documento.dataInsert = new Date(documento.dataInsert).setMilliseconds(1);
      })
      
      //console.log(contrato);
      await contrato.save(contrato); 
    }); 
  })
  .then( (result => res.json(result) ))
  .catch(err => {return console.log(err)})
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
      {new: true }) // Diz para o Mongo trazer as informações do documento já atualizadas ao invés de um pré visualização
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