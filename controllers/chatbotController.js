const axios = require('axios');

exports.handleChatbotRequest = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ message: "La question est requise" });
        }

        const response = await axios.post(
            'https://api.mistral.ai/v1/chat/completions',
            {
                model: "mistral-tiny",
                messages: [{ role: "user", content: question }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Mistral API response:', response.data);  // Log Mistral API response
        if (response.data.choices && response.data.choices[0]) {
            res.json({ answer: response.data.choices[0].message.content });
        } else {
            res.json({ answer: "No response from Mistral AI." });
        }
    } catch (error) {
        console.error("Erreur avec l'IA :", error.response ? error.response.data || error.message : error.message);
        res.status(500).json({
            message: "Erreur avec l'IA",
            erreur: error.response ? error.response.data || error.message : error.message
        });
    }
};


