# 🤖 Configuração n8n + Telegram para Pedidos

## 📋 Pré-requisitos
1. **Bot no Telegram criado** via @BotFather
2. **Token do Bot** obtido
3. **Chat ID** do canal/grupo onde receberá os pedidos

## 🔧 Workflow n8n

### **1. Webhook Trigger**
- **Método**: POST
- **Path**: `/webhook-test/cardapio-virtual`
- **Authentication**: None

### **2. IF Node (Condicional)**
```
Verificar se telegram.enabled é true
```

### **3. Telegram Node (Enviar Mensagem)**
- **Resource**: Send Text Message
- **Bot Token**: `{{ $json.telegram.botToken }}`
- **Chat ID**: `{{ $json.telegram.chatId }}`
- **Text**: `{{ $json.telegram.message }}`

## 📤 Payload Enviado pelo Webhook

### **Estrutura Completa:**
```json
{
  "orderNumber": "SB123456",
  "date": "07/01/2026",
  "time": "22:10:00",
    
  "customer": {
    "name": "Nome do Cliente",
    "phone": "(93) 99217-8154",
    "address": "Rua Exemplo, 123 - Bairro, Cidade",
    "email": "cliente@email.com"
  },
  
  "items": [
    {
      "name": "Pizza Calabresa",
      "quantity": 2,
      "size": "Grande",
      "flavors": ["Calabresa", "Mussarela"],
      "price": 45.90,
      "subtotal": 91.80
    }
  ],
  
  "payment": {
    "method": "cash",
    "changeFor": 100.00
  },
  
  "totals": {
    "subtotal": 91.80,
    "deliveryFee": 0,
    "total": 91.80
  },
  
  "observation": "Sem cebola na pizza",
  "source": "cardapio-virtual-web",
  "platform": "web",
  
  "telegram": {
    "enabled": true,
    "chatId": "@seucanal",
    "botToken": "SEU_BOT_TOKEN",
    "message": "🍕 *NOVO PEDIDO - SABOR DA TERRA* 🍕\n\n📋 *NÚMERO DO PEDIDO:* #SB123456\n📅 *DATA:* 07/01/2026\n⏰ *HORA:* 22:10:00\n\n👤 *DADOS DO CLIENTE:*\n📝 *Nome:* Nome do Cliente\n📞 *Telefone:* (93) 99217-8154\n📍 *Endereço:* Rua Exemplo, 123 - Bairro, Cidade\n📧 *Email:* cliente@email.com\n\n💰 *ITENS DO PEDIDO:*\n• 2x Pizza Calabresa (Grande) - Calabresa, Mussarela - R$ 91.80\n\n💳 *PAGAMENTO:* Dinheiro (troco para R$ 100.00)\n💰 *TOTAL:* R$ 91.80\n📝 *OBSERVAÇÃO:* Sem cebola na pizza\n\n⏰ *TEMPO ESTIMADO:* 30-45 minutos\n✅ *STATUS:* Aguardando confirmação",
    "format": "markdown"
  }
}
```

## 📱 Mensagem Formatada para Telegram

A mensagem enviada ao Telegram inclui:

### **✅ Informações Obrigatórias:**
- ✅ **Número do Pedido**: `#SB123456`
- ✅ **Data**: `07/01/2026`
- ✅ **Hora**: `22:10:00`
- ✅ **Nome do Cliente**: `Nome do Cliente`
- ✅ **Telefone**: `(93) 99217-8154`
- ✅ **Endereço**: `Rua Exemplo, 123 - Bairro, Cidade`
- ✅ **Email**: `cliente@email.com` (se cliente logado)
- ✅ **Pedido Completo**: Itens com quantidades e preços
- ✅ **Total**: `R$ 91.80`

### **📋 Campos Adicionais:**
- **Forma de Pagamento**: Cartão/Dinheiro/Pix
- **Troco**: Se pagamento em dinheiro
- **Observações**: Se houver
- **Tempo Estimado**: 30-45 minutos
- **Status**: Aguardando confirmação

## 🚀 Como Testar

1. **Fazer um pedido** no cardápio virtual
2. **Verificar o webhook** recebe os dados
3. **Confirmar mensagem** no Telegram
4. **Validar informações** (número, data, hora, cliente, pedido)

## 🔧 Configuração do Bot Telegram

1. **Criar Bot**: Fale com @BotFather
2. **Obter Token**: `/newbot` → copie o token
3. **Obter Chat ID**: Adicione o bot ao grupo e use `/start`
4. **Configurar n8n**: Cole token e chat ID no workflow

**Sistema integrado e funcionando!** 🎉
- **Parse Mode**: Markdown

## 📦 Payload Recebido

O frontend envia este JSON completo:

```json
{
  "orderNumber": "SB123456",
  "timestamp": "2026-01-06T21:47:00.000Z",
  "customer": {
    "name": "Nome do Cliente",
    "phone": "(93) 99217-8154",
    "address": "Endereço completo"
  },
  "items": [...],
  "payment": {...},
  "totals": {...},
  "telegram": {
    "enabled": true,
    "chatId": "@seucanal",
    "botToken": "SEU_BOT_TOKEN",
    "message": "🍕 *NOVO PEDIDO - SABOR DA TERRA* 🍕\n\n📋 *PEDIDO:* #123456\n👤 *CLIENTE:* Nome do Cliente\n...",
    "format": "markdown"
  }
}
```

## 📱 Mensagem no Telegram

A mensagem formatada aparecerá assim:

```
🍕 NOVO PEDIDO - SABOR DA TERRA 🍕

📋 PEDIDO: #123456
👤 CLIENTE: Nome do Cliente
📞 TELEFONE: (93) 99217-8154
📍 ENDEREÇO: Endereço completo

💰 ITENS DO PEDIDO:
• 1x Pizza Família (F) - Pepperoni, Frango Catupiry - R$ 55.90

💳 PAGAMENTO: Pix
💰 TOTAL: R$ 55.90

⏰ TEMPO ESTIMADO: 30-45 minutos
✅ STATUS: Aguardando confirmação
```

## ⚙️ Configuração no Frontend

Atualize as constantes no arquivo `app/page.tsx`:

```typescript
const TELEGRAM_CONFIG = {
  enabled: true, // Habilita envio para Telegram
  chatId: '@seucanal', // Seu canal ou grupo de pedidos
  botToken: 'SEU_BOT_TOKEN' // Token do seu bot Telegram
};
```

## 🚀 Vantagens

- ✅ **Notificação instantânea** no Telegram
- ✅ **Formatação rica** com emojis e markdown
- ✅ **Informações completas** do pedido
- ✅ **Integração única** via n8n
- ✅ **Fallback automático** se falhar

## 🔍 Como Obter Chat ID

1. Adicione seu bot ao grupo/canal
2. Envie uma mensagem qualquer
3. Acesse: `https://api.telegram.org/bot<SEU_BOT_TOKEN>/getUpdates`
4. Copie o `chat.id` do resultado

## 📝 Workflow Completo

```
Webhook → IF (telegram.enabled) → Telegram → Sucesso
    ↓
IF (!telegram.enabled) → Continuar normal
    ↓
Sempre → Salvar dados/Outras integrações
```

O sistema agora envia automaticamente os pedidos para o Telegram com formatação profissional!
