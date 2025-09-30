const express = require('express');
const router = express.Router();

const {
    createMood,
    getAllMoods,
    getMoodById,
    updateMood,
    deleteMood
} = require('../controllers/moods-controller');

router.post('/', createMood);
router.get('/', getAllMoods);
router.get('/:id', getMoodById);
router.put('/:id', updateMood);
router.delete('/:id', deleteMood);

module.exports = router;