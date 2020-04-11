var router = require('express').Router();

router.get('/', function(req, res, next) {
  res.send('Rest4UserCenter funcionando!!!');
});

// Redirecionamento de rota 
router.use('/api/auth', require('./api/authentication'));
router.use('/api/users', require('./api/users'));
router.use('/api/contratos', require('./api/contratos'));
router.use('/api/file', require('./api/file'));
router.use('/api/permission', require('./api/permissions'));
router.use('/api/departament', require('./api/routedepartament'));

/**
 * Podem ser tratados erros caso ocorram para
 * que não voltem simplesmente como erro 500
 */
router.use((err, req, res, next) => { // Quando passamos um Middleware com 4 parâmetros sabe que é um erro handler  
  if(err.name === 'ValidationError'){ // ira devolver o erro de validação do mongoose.
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce(function(errors, key){
        errors[key] = err.errors[key].message;
          return errors;
      }, {})
    });
  }
  return next(err);
})

module.exports = router;
