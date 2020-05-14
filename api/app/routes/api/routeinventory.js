const router = require('express').Router();
const Printer = require('../../../lib/printer');

const Inventory = require('../../schemas/inventory');

var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões

router.post(
   '/',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.insert), 
   async(req, res, next) => {
      try{ 
         await Inventory.findOneAndUpdate(
            { asset: req.body.inventory.asset }, 
            req.body.inventory,
            { new: true, upsert: true })
         .then(async inventory => {
            const printer = new Printer(inventory);
            const status = await printer
               .printZPL('api/public/zpl/assetZPL.zpl', `${inventory.asset}/${inventory.subAsset}`)
            .then(async (status) => { 
               return await Inventory.findByIdAndUpdate(inventory.id, { 
                  $push: { 
                     logPrinter: { wasPrinted: true, message: status } 
                  }
               }, { new: true } )
               .catch( err => { throw err });
            })
            .catch(async err => { 
               await Inventory.findByIdAndUpdate(inventory.id, { 
                  $push: { 
                     logPrinter: { wasPrinted: false, message: err.message } 
                  } 
               }, { new: true } )
               .catch( err => { throw err });
               throw err });
            res.json(status) // Envia Resultados das mudanças
         })
         .catch(next)
      } catch(err) { next(err); }
 });

 module.exports = router;