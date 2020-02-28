var router = require('express').Router();

//TODO
router.get('/', function(req, res, next) {
  res.send('Index.js');
});

module.exports = router;
