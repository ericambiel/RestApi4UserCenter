var router = require('express').Router();

router.get('/', function(req, res) {
  res.send('Rest4UserCenter funcionando!!!');
});

// Redirecionamento de rota 
router.use('/api/auth', require('./api/routeauthentication'));
router.use('/api/users', require('./api/routeusers'));
router.use('/api/contratos', require('./api/routecontratos'));
router.use('/api/file', require('./api/routefiles'));
router.use('/api/permission', require('./api/routepermissions'));
router.use('/api/department', require('./api/routedepartments'));
router.use('/api/inventory', require('./api/routeinventory'));

/**
 * Podem ser tratados erros caso ocorram para
 * que não voltem simplesmente como erro 422
 */
router.use((err, req, res, next) => { // Quando passamos um Middleware com 4 parâmetros sabe que é um erro handler  
  if(err.name === 'ValidationError'){ // ira devolver o erro de validação do mongoose.
    let keys = ' ';
    return res.status(422).json(
      Object.keys(err.errors).reduce( (errors, key) => {
        keys += `${key}, `
        errors[key] = err.errors[key].message;
        errors['message'] = `Verifique o(s) campo(s) [${keys}] novamente.`;
        return errors ;
      }, {})
    );
  }
  return next(err);
})

module.exports = router;
