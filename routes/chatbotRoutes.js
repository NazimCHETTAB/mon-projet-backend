const express = require('express');
const router = express.Router();
const { handleChatbotRequest } = require('../controllers/chatbotController');

router.post('/', handleChatbotRequest);

module.exports = router;
