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
   '/:id',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.delete), 
   async(req, res, next) => {
      try{ 
         const { id } = req.params;
         let assets = await inventoryController.deleteOneAsset(id);
         res.json(assets);
      } catch(err) { next(err); }
});

router.patch(
   '/',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.update), 
   async(req, res, next) => {
      try{ 
         let assets = await inventoryController.updateOneAsset(req.body);
         res.json(assets);
      } catch(err) { next(err); }
});

/** Insere ativo e imprime */
router.post(
   '/',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.insert), 
   async(req, res, next) => {
      try{ 
         let assetModel = await inventoryController.insertOneAsset(req.body);
         let { asset, jobInfo } = await inventoryController.printAssetZPL(assetModel);
         res.json({ 'asset': asset, message: `${jobInfo.document} enviado ao POOL da impressora, estado: ${jobInfo.status}.` });
      } catch(err) { next(err); }
 });

 router.post(
   '/reprint',
   auth.required, 
   routePermission.check(permissionModule.INVENTORY.insert), 
   async(req, res, next) => {
      try{ 
         let { asset, jobInfo } = await inventoryController.printAssetZPL(req.body);
         res.json({ 'asset': asset, message: `${jobInfo.document} enviado ao POOL da impressora, estado: ${jobInfo.status}.` });
      } catch(err) { next(err); }
 });

 module.exports = router;