# Splore Assistente (Splore Viagens) - Projeto Pronto

Projeto Node.js pronto para deploy. Recebe mensagens do WhatsApp via webhook, envia o texto para a OpenAI e responde pelo WhatsApp Cloud API.

## O que você precisa fazer (passo-a-passo simplificado, sem programar)

1. **Baixe e envie o projeto para o Render**
   - Faça upload do ZIP para sua conta do Render ou conecte a um repositório GitHub.
   - No Render crie um novo *Web Service*.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Adicione as variáveis de ambiente (Settings > Environment):
     - VERIFY_TOKEN (ex: splore_verify_2025)
     - WHATSAPP_TOKEN (cole o token temporário que gerar no Meta)
     - PHONE_NUMBER_ID (copie do painel do Meta)
     - OPENAI_KEY (sua chave OpenAI)
2. **Obtenha a URL pública**
   - Após deploy, terá uma URL como `https://seu-app.onrender.com`.
   - Use o endpoint `/webhook` (ex: `https://seu-app.onrender.com/webhook`).

3. **Configurar Webhook no Meta**
   - Meta Developer > seu app > WhatsApp > Configurações > Webhooks
   - Coloque a URL `/webhook` e o VERIFY_TOKEN escolhido.
   - Selecione eventos: messages, message_deliveries, message_reads
   - Salve. O Meta fará verificação (GET com hub.challenge) — o servidor responde automaticamente.

4. **Gerar token e testar**
   - No painel Testes de API, gere o token temporário e copie para WHATSAPP_TOKEN.
   - Adicione o phone_number_id no .env (ou nas env do Render).
   - Use o painel para enviar uma mensagem de teste ou envie uma mensagem do seu WhatsApp ao número de teste.

5. **Personalizar o fluxo**
   - O prompt/flow está embutido no `index.js` (system prompt).
   - Se quiser ajustar textos, edite o texto no sistema prompt ou me peça para eu gerar outra versão.

## Observações
- O projeto já contém o fluxo acolhedor em pt-BR e as validações básicas.
- Se preferir, eu posso fazer o deploy para você (ex.: criar conta no Render e subir o projeto) — me diga se quer que eu faça isso.

## Suporte
Se tiver qualquer erro ao deploy, me mande o print do log do Render ou erro do console e eu corrijo.
