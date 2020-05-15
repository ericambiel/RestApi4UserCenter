const router = require('express').Router();
const inventoryController = require('../../controllers/InventoryController');


var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões

router.post(
   '/',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.insert), 
   async(req, res, next) => {
      try{ 
         let asset = await inventoryController.insertOrUpdateAsset(req.body.inventory);
         asset = await inventoryController.printAssetZPL(asset);
         res.json(asset);
      } catch(err) { next(err); }
 });

 module.exports = router;