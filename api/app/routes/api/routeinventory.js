const router = require('express').Router();
const inventoryController = require('../../controllers/InventoryController');


var auth = require('../../middlewares/auth'); // Verifica validade do TOKEN
const routePermission = require('../../middlewares/PermissionRoutes'); // Suporte a permissões a rota 
const permissionModule = require('../../../config/PermissionModule'); // Tipos de permissões

router.get(
   '/',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.select), 
   async(req, res, next) => {
      try{ 
         let assets = await inventoryController.listInventory();
         res.json(assets);
      } catch(err) { next(err); }
});

router.delete(
   '/',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.delete), 
   async(req, res, next) => {
      try{ 
         let assets = await inventoryController.deleteOneAsset(req.body._id);
         res.json(assets);
      } catch(err) { next(err); }
});

router.patch(
   '/',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.update), 
   async(req, res, next) => {
      try{ 
         let assets = await inventoryController.updateOneAsset(req.body._id);
         res.json(assets);
      } catch(err) { next(err); }
});

router.post(
   '/',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.insert), 
   async(req, res, next) => {
      try{ 
         let asset = await inventoryController.insertOneAsset(req.body);
         asset = await inventoryController.printAssetZPL(asset);
         res.json(asset);
      } catch(err) { next(err); }
 });

 router.post(
   '/reprint',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.insert), 
   async(req, res, next) => {
      try{ 
         let asset = await inventoryController.printAssetZPL(req.body);
         res.json(asset);
      } catch(err) { next(err); }
 });

 module.exports = router;