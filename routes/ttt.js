const express = require('express');
const tttController = require('../controllers/ttt');

const router = express.Router();

router.get('/', tttController.index);
router.post('/', tttController.create);
router.get('/:id', tttController.game);

module.exports = router;
