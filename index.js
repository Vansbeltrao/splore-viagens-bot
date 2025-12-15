// Splore Assistente - index.js
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_KEY = process.env.OPENAI_KEY;

// health
app.get('/', (req, res) => res.send('Splore Assistente ativo'));

// webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // VERIFICAÇÃO EXATA QUE O META EXIGE
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verificado com sucesso');
    return res.status(200).send(challenge);
  }

  console.error('Falha na verificação do webhook');
  return res.sendStatus(403);
});


// handle incoming messages
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    if (body.object && body.entry) {
      for (const entry of body.entry) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value;
          if (value && value.messages) {
            for (const message of value.messages) {
              const from = message.from; // user's phone
              const text = message.text?.body || '';
              // simple guard: ignore status messages
              if (!text) continue;
              // generate reply using OpenAI
              const reply = await generateReply(text, message, value);
              // send reply via WhatsApp
              await sendWhatsAppMessage(from, reply);
            }
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// generate reply via OpenAI
async function generateReply(userText, message, value) {
  try {
    // system prompt with the flow & tone
    const systemPrompt = `
Você é o Splore Assistente, um bot de viagens em português (pt-BR), tom acolhedor.
Siga o fluxo de coleta de dados: nome, serviço, destino (cidade, país), número de adultos, número de crianças (idades), datas (ida/volta), flexibilidade, classe/hospedagem, acessibilidade PCD, bagagem despachada, solicitações especiais.
Quando o usuário informar o destino, responda com "Parabéns — ótima escolha!" incluindo o nome do destino.
Ao final, informe que o orçamento será enviado em até 24 horas úteis.
Se o usuário pedir "Falar com humano", responda com mensagem pedindo contato humano.
`;
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      max_tokens: 500
    };
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || 'Desculpe, tivemos um problema para gerar a resposta.';
    return text;
  } catch (e) {
    console.error('OpenAI error', e);
    return 'Desculpe, tivemos um problema técnico. Tente novamente mais tarde.';
  }
}

// send message via WhatsApp Cloud API
async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v24.0/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: { body: message }
  };
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
