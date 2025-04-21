const express = require('express');
const router = express.Router();
const { traiterQuestion } = require('../controllers/chatbotController');

// Route publique
router.post('/', traiterQuestion);

module.exports = router;