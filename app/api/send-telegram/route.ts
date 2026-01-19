import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../src/lib/supabase";

interface TelegramMessage {
  orderNumber: string;
  date: string;
  time: string;
  isAddition?: boolean; // Novo: identificar se é adição de itens
  customer: {
    name: string;
    phone: string;
    address: string;
    email?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    size?: string;
    flavors?: string[];
    price: number;
    subtotal: number;
  }>;
  payment: {
    method: 'card' | 'cash' | 'pix';
    changeFor?: number;
  };
  totals: {
    subtotal: number;
    deliveryFee: number;
    total: number;
  };
  observation?: string;
}

function formatTelegramMessage(data: TelegramMessage): string {
  const { orderNumber, date, time, isAddition, customer, items, payment, totals, observation } = data;
  
  // Formatar itens com suporte a múltiplos sabores
  const formattedItems = items.map(item => {
    let line = `• ${item.quantity}x ${item.name}`;
    
    if (item.size) {
      line += ` (${item.size})`;
    }
    
    if (item.flavors && item.flavors.length > 0) {
      line += ` - ${item.flavors.join(' / ')}`;
    }
    
    line += ` - R$ ${item.subtotal.toFixed(2)}`;
    return line;
  }).join('\n');

  // Formatar pagamento
  let paymentText = '';
  switch (payment.method) {
    case 'cash':
      paymentText = `Dinheiro (troco para R$ ${payment.changeFor?.toFixed(2)})`;
      break;
    case 'card':
      paymentText = 'Cartão';
      break;
    case 'pix':
      paymentText = 'Pix';
      break;
  }

  // Montar título baseado no tipo de notificação
  const title = isAddition 
    ? `🍕 *ADIÇÃO DE ITENS - SABOR DA TERRA* 🍕`
    : `🍕 *NOVO PEDIDO - SABOR DA TERRA* 🍕`;

  // Montar mensagem completa
  let message = `${title}\n\n`;
  message += `📋 *NÚMERO DO PEDIDO:* #${orderNumber}\n`;
  message += `📅 *DATA:* ${date}\n`;
  message += `⏰ *HORA:* ${time}\n\n`;
  
  message += `👤 *DADOS DO CLIENTE:*\n`;
  message += `📝 *Nome:* ${customer.name}\n`;
  message += `📞 *Telefone:* ${customer.phone}\n`;
  message += `📍 *Endereço:* ${customer.address}\n`;
  if (customer.email) {
    message += `📧 *Email:* ${customer.email}\n`;
  }
  message += `\n`;
  
  message += `💰 *ITENS DO PEDIDO:*\n`;
  message += `${formattedItems}\n\n`;
  
  message += `💳 *PAGAMENTO:* ${paymentText}\n`;
  message += `💰 *TOTAL:* R$ ${totals.total.toFixed(2)}\n`;
  
  if (observation) {
    message += `📝 *OBSERVAÇÃO:* ${observation}\n`;
  }
  
  message += `\n⏰ *TEMPO ESTIMADO:* 30-45 minutos\n`;
  message += `✅ *STATUS:* Aguardando confirmação`;

  return message;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { ok: false, error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    const orderData = await req.json();
    
    // Obter configurações do ambiente (usando nomes existentes)
    const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.error('Configurações do Telegram não encontradas');
      return NextResponse.json(
        { ok: false, error: "Telegram configuration missing" },
        { status: 500 }
      );
    }

    // Gerar número e timestamp do pedido
    const now = new Date();
    const orderNumber = orderData.orderNumber || `SB${now.getTime().toString().slice(-6)}`;
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR');

    // Processar itens do carrinho
    const processedItems = orderData.cart.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      size: item.size || undefined,
      flavors: item.flavors || undefined,
      price: item.price,
      subtotal: item.price * item.quantity
    }));

    // Calcular totais
    const subtotal = processedItems.reduce((acc: number, item: any) => acc + item.subtotal, 0);
    const deliveryFee = 0; // Pode ser configurado depois
    const total = subtotal + deliveryFee;

    // Montar dados para mensagem
    const telegramData: TelegramMessage = {
      orderNumber,
      date,
      time,
      customer: {
        name: orderData.paymentData.name,
        phone: orderData.paymentData.phone,
        address: orderData.paymentData.address,
        email: orderData.paymentData.email || undefined
      },
      items: processedItems,
      payment: {
        method: orderData.paymentData.method,
        changeFor: orderData.paymentData.changeFor
      },
      totals: {
        subtotal,
        deliveryFee,
        total
      },
      observation: orderData.paymentData.observation
    };

    // Formatar mensagem
    const message = formatTelegramMessage(telegramData);

    // Enviar para Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro ao enviar para Telegram:', errorData);
      return NextResponse.json(
        { ok: false, error: "Failed to send to Telegram", details: errorData },
        { status: 500 }
      );
    }

    // Salvar pedido no Supabase (mantendo apenas últimos 2 por cliente)
    try {
      // Primeiro, remover pedidos antigos se já existirem 2 ou mais
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_email', orderData.paymentData.email)
        .order('created_at', { ascending: false })
        .range(2, 999); // Pega todos a partir do 3º mais recente

      if (existingOrders && existingOrders.length > 0) {
        // Remover pedidos antigos
        const oldOrderIds = existingOrders.map((order: { id: string }) => order.id);
        await supabase
          .from('orders')
          .delete()
          .in('id', oldOrderIds);
      }

      // Inserir novo pedido
      const { error: insertError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_email: orderData.paymentData.email,
          customer_name: orderData.paymentData.name,
          customer_phone: orderData.paymentData.phone,
          items: processedItems,
          total: total,
          payment_method: orderData.paymentData.method,
          change_for: orderData.paymentData.changeFor,
          address: orderData.paymentData.address,
          observation: orderData.paymentData.observation,
          status: 'pending'
        });

      if (insertError) {
        console.error('Erro ao salvar pedido:', insertError);
      }
    } catch (dbError) {
      console.error('Erro no banco de dados:', dbError);
    }

    const telegramResult = await response.json();
    console.log('Mensagem enviada para Telegram:', telegramResult);

    return NextResponse.json({
      ok: true,
      orderNumber,
      message: "Pedido enviado com sucesso!",
      telegramId: telegramResult.result?.message_id
    });
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    status: "Telegram API endpoint ready",
    timestamp: new Date().toISOString()
  });
}
