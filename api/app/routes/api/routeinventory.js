const router = require('express').Router();
const printer = require('../../../lib/printer');

router.post(
   '/', 
   async(req, res, next) => {
      try{
         const response = await printer.printZPL();
         res.json(response) // Envia Resultados das mudanças
      } catch(err) { next(err); }
 });

 module.exports = router;