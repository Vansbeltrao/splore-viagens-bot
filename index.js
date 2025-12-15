// Splore Assistente - index.js
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

// ENV
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_KEY = process.env.OPENAI_KEY;

// HEALTH CHECK
app.get('/', (req, res) => {
  res.send('Splore Assistente ativo');
});

/**
 * WEBHOOK VERIFICATION (META)
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verificado com sucesso');
    return res.status(200).send(challenge);
  }

  console.error('Falha na verificação do webhook');
  return res.sendStatus(403);
});

/**
 * RECEBE MENSAGENS DO WHATSAPP
 */
app.post('/webhook', async (req, res) => {
  console.log('WEBHOOK RECEBIDO:', JSON.stringify(req.body, null, 2));
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message || !message.text) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text.body;

    console.log('Mensagem recebida:', text);

    const reply = await generateReply(text);
    await sendWhatsAppMessage(from, reply);

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook:', err);
    res.sendStatus(500);
  }
});

/**
 * OPENAI
 */
async function generateReply(userText) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é o Splore Assistente, um bot de viagens em português (pt-BR), tom acolhedor.
Pergunte destino, datas, adultos, crianças, tipo de hospedagem.
Se pedir humano, informe que um consultor entrará em contato.`
          },
          { role: 'user', content: userText }
        ],
        max_tokens: 400
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Não consegui responder agora.';
  } catch (e) {
    console.error('Erro OpenAI:', e);
    return 'Erro técnico, tente novamente.';
  }
}

/**
 * ENVIA TEXTO VIA WHATSAPP (MODO TESTE)
 */
async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: message }
  };

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
