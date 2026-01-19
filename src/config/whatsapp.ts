// Configuração do WhatsApp para o Cardápio Virtual

export const WHATSAPP_CONFIG = {
  // Número de WhatsApp para contato (formato: DDD + número sem espaços ou caracteres especiais)
  phoneNumber: '93991849036',
  
  // Mensagem padrão para acompanhamento de pedido
  defaultOrderMessage: (orderNumber: string) => 
    `Olá, acabei de fazer um pedido! Pedido #${orderNumber}`,
  
  // Mensagem para envio de comprovante PIX
  pixMessage: 'Olá, acabei de fazer um pedido via PIX! Gostaria de enviar o comprovante.',
  
  // Formatar link do WhatsApp
  generateWhatsAppLink: (phoneNumber: string, message: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
};

export default WHATSAPP_CONFIG;
