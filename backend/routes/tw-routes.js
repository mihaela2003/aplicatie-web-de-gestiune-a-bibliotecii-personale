const express = require('express');
const router = express.Router();

const {
    createTW, 
    getAllTW,
    getTWById,
    updateTW,
    deleteTW
} = require('../controllers/tw-controller');

router.post('/', createTW);
router.get('/', getAllTW);
router.get('/:id', getTWById);
router.put('/:id', updateTW);
router.delete('/:id', deleteTW);

module.exports = router;