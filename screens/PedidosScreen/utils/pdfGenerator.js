const metodoPagamentoOptions = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'pix', label: 'Pix' },
  { value: 'boleto', label: 'Boleto' }
];

export const generateOrderHTML = (pedido, clientes) => {
  const cliente = clientes.find(c => c.nomeFantasia === pedido.cliente) || { 
    nomeFantasia: pedido.cliente, 
    razaoSocial: '', 
    cnpj: '', 
    endereco: '', 
    telefone: '', 
    email: '' 
  };

  const subtotal = pedido.produtos.reduce((sum, produto) => 
    sum + (produto.preco * produto.quantidade), 0
  );

  let desconto = 0;
  if (pedido.desconto?.valor) {
    const valorDesconto = parseFloat(pedido.desconto.valor.toString().replace(',', '.')) || 0;
    if (pedido.desconto.tipo === 'percentual') {
      desconto = (subtotal * valorDesconto) / 100;
    } else {
      desconto = valorDesconto;
    }
  }

  const metodoPagamento = metodoPagamentoOptions.find(m => 
    m.value === pedido.metodoPagamento
  )?.label || pedido.metodoPagamento;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Nota de Pedido ${pedido.id}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #2196F3;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #2196F3;
                margin-bottom: 10px;
            }
            .document-title {
                font-size: 20px;
                font-weight: bold;
                margin: 20px 0;
            }
            .order-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            .info-section {
                width: 48%;
            }
            .info-title {
                font-weight: bold;
                font-size: 16px;
                color: #2196F3;
                margin-bottom: 10px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            .info-line {
                margin-bottom: 5px;
                font-size: 14px;
            }
            .products-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .products-table th,
            .products-table td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            .products-table th {
                background-color: #2196F3;
                color: white;
                font-weight: bold;
            }
            .products-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .totals-section {
                margin-top: 30px;
                border-top: 2px solid #ddd;
                padding-top: 20px;
            }
            .total-line {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 16px;
            }
            .total-final {
                font-weight: bold;
                font-size: 18px;
                color: #2196F3;
                border-top: 1px solid #ddd;
                padding-top: 8px;
                margin-top: 8px;
            }
            .payment-section {
                margin-top: 30px;
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
            }
            .installments {
                margin-top: 15px;
            }
            .installment-item {
                background-color: white;
                padding: 10px;
                margin-bottom: 8px;
                border-left: 4px solid #2196F3;
                border-radius: 4px;
            }
            .observations {
                margin-top: 30px;
                background-color: #fff3cd;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #ffc107;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
            }
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 12px;
                color: white;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-pendente { background-color: #FF9800; }
            .status-processando { background-color: #2196F3; }
            .status-concluido { background-color: #4CAF50; }
            .status-cancelado { background-color: #F44336; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">SUA EMPRESA LTDA</div>
            <div>CNPJ: 00.000.000/0001-00 | Telefone: (00) 0000-0000</div>
            <div>Endereço: Sua Rua, 123 - Sua Cidade - UF - CEP 00000-000</div>
        </div>

        <div class="document-title">NOTA DE PEDIDO Nº ${pedido.id}</div>

        <div class="order-info">
            <div class="info-section">
                <div class="info-title">DADOS DO CLIENTE</div>
                <div class="info-line"><strong>Nome Fantasia:</strong> ${cliente.nomeFantasia}</div>
                <div class="info-line"><strong>Razão Social:</strong> ${cliente.razaoSocial || 'N/A'}</div>
                <div class="info-line"><strong>CNPJ:</strong> ${cliente.cnpj || 'N/A'}</div>
                <div class="info-line"><strong>Endereço:</strong> ${cliente.endereco || 'N/A'}</div>
                <div class="info-line"><strong>Telefone:</strong> ${cliente.telefone || 'N/A'}</div>
                <div class="info-line"><strong>Email:</strong> ${cliente.email || 'N/A'}</div>
            </div>

            <div class="info-section">
                <div class="info-title">DADOS DO PEDIDO</div>
                <div class="info-line"><strong>Data:</strong> ${new Date(pedido.data).toLocaleDateString('pt-BR')}</div>
                <div class="info-line"><strong>Hora:</strong> ${new Date(pedido.data).toLocaleTimeString('pt-BR')}</div>
                <div class="info-line"><strong>Status:</strong> <span class="status-badge status-${pedido.status}">${pedido.status}</span></div>
                <div class="info-line"><strong>Método de Pagamento:</strong> ${metodoPagamento}</div>
            </div>
        </div>

        <table class="products-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Produto</th>
                    <th style="width: 15%;">Quantidade</th>
                    <th style="width: 17.5%;">Valor Unitário</th>
                    <th style="width: 17.5%;">Valor Total</th>
                </tr>
            </thead>
            <tbody>
                ${pedido.produtos.map(produto => `
                    <tr>
                        <td>${produto.nome}</td>
                        <td style="text-align: center;">${produto.quantidade}</td>
                        <td style="text-align: right;">R$ ${produto.preco.toFixed(2).replace('.', ',')}</td>
                        <td style="text-align: right;">R$ ${(produto.preco * produto.quantidade).toFixed(2).replace('.', ',')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals-section">
            <div class="total-line">
                <span>Subtotal:</span>
                <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            ${desconto > 0 ? `
            <div class="total-line">
                <span>Desconto (${pedido.desconto.tipo === 'percentual' ? pedido.desconto.valor + '%' : 'R$ ' + pedido.desconto.valor}):</span>
                <span>- R$ ${desconto.toFixed(2).replace('.', ',')}</span>
            </div>
            ` : ''}
            <div class="total-line total-final">
                <span>TOTAL GERAL:</span>
                <span>R$ ${pedido.total.toFixed(2).replace('.', ',')}</span>
            </div>
        </div>

        <div class="payment-section">
            <div class="info-title">CONDIÇÕES DE PAGAMENTO</div>
            <div class="info-line"><strong>Método:</strong> ${metodoPagamento}</div>

            ${pedido.metodoPagamento === 'boleto' && pedido.prazos?.length > 0 ? `
            <div class="installments">
                <strong>Parcelas:</strong>
                ${pedido.prazos.map((prazo, index) => `
                    <div class="installment-item">
                        <strong>${index + 1}ª Parcela:</strong> ${prazo.dias} dias - ${prazo.porcentagem}%
                        (R$ ${((pedido.total * parseFloat(prazo.porcentagem)) / 100).toFixed(2).replace('.', ',')})
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>

        ${pedido.observacoes ? `
        <div class="observations">
            <div class="info-title">OBSERVAÇÕES</div>
            <div>${pedido.observacoes}</div>
        </div>
        ` : ''}

        <div class="footer">
            <div>Este documento foi gerado automaticamente pelo sistema em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
            <div style="margin-top: 10px;">
                <strong>Válido por 30 dias a partir da data de emissão</strong>
            </div>
        </div>
    </body>
    </html>
  `;
};