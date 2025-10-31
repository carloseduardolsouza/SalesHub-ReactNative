const metodoPagamentoOptions = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'pix', label: 'Pix' },
  { value: 'boleto', label: 'Boleto' }
];

export const generateOrderHTML = (pedido, clientes, empresaSettings, mostrarDescontos = false) => {
  const cliente = clientes.find(c => c.nomeFantasia === pedido.cliente) || { 
    nomeFantasia: pedido.cliente, 
    razaoSocial: '', 
    cnpj: '', 
    telefone: '', 
    email: '',
    endereco: {}
  };

  // Formatar endereço completo do cliente
  const formatarEndereco = (endereco) => {
    if (!endereco || !endereco.logradouro) return 'N/A';
    
    const partes = [];
    
    if (endereco.logradouro) {
      let enderecoLinha = endereco.logradouro;
      if (endereco.numero) enderecoLinha += `, ${endereco.numero}`;
      if (endereco.complemento) enderecoLinha += ` - ${endereco.complemento}`;
      partes.push(enderecoLinha);
    }
    
    if (endereco.bairro) partes.push(endereco.bairro);
    
    if (endereco.cidade || endereco.estado) {
      const cidadeEstado = [endereco.cidade, endereco.estado].filter(Boolean).join(' - ');
      partes.push(cidadeEstado);
    }
    
    if (endereco.cep) partes.push(`CEP: ${endereco.cep}`);
    
    return partes.join(', ');
  };

  const enderecoFormatado = formatarEndereco(cliente.endereco);

  // Cálculos com ou sem descontos
  const calcularValorProduto = (produto) => {
    const precoTotal = produto.preco * produto.quantidade;
    
    if (!mostrarDescontos) {
      return precoTotal;
    }
    
    if (!produto.desconto?.valor) {
      return precoTotal;
    }
    
    const valorDesconto = parseFloat(produto.desconto.valor.toString().replace(',', '.')) || 0;
    let desconto = 0;
    
    if (produto.desconto.tipo === 'percentual') {
      desconto = (precoTotal * valorDesconto) / 100;
    } else {
      desconto = valorDesconto;
    }
    
    return Math.max(0, precoTotal - desconto);
  };

  const subtotalSemDescontos = pedido.produtos.reduce((sum, produto) => 
    sum + (produto.preco * produto.quantidade), 0
  );

  let subtotalComDescontosIndividuais = subtotalSemDescontos;
  let descontosTotaisIndividuais = 0;

  if (mostrarDescontos) {
    pedido.produtos.forEach(produto => {
      const precoTotal = produto.preco * produto.quantidade;
      if (produto.desconto?.valor) {
        const valorDesconto = parseFloat(produto.desconto.valor.toString().replace(',', '.')) || 0;
        let desconto = 0;
        
        if (produto.desconto.tipo === 'percentual') {
          desconto = (precoTotal * valorDesconto) / 100;
        } else {
          desconto = valorDesconto;
        }
        
        descontosTotaisIndividuais += desconto;
      }
    });
    subtotalComDescontosIndividuais = subtotalSemDescontos - descontosTotaisIndividuais;
  }

  let descontoGeral = 0;
  if (mostrarDescontos && pedido.desconto?.valor) {
    const valorDesconto = parseFloat(pedido.desconto.valor.toString().replace(',', '.')) || 0;
    if (pedido.desconto.tipo === 'percentual') {
      descontoGeral = (subtotalComDescontosIndividuais * valorDesconto) / 100;
    } else {
      descontoGeral = valorDesconto;
    }
  }

  const totalFinal = mostrarDescontos ? pedido.total : subtotalSemDescontos;

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
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #2196F3;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header-left {
                flex: 1;
            }
            .company-logo {
                width: 100px;
                height: 100px;
                object-fit: contain;
                margin-left: 20px;
            }
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #2196F3;
                margin-bottom: 10px;
            }
            .company-info {
                font-size: 13px;
                line-height: 1.6;
                color: #555;
            }
            .document-title {
                font-size: 20px;
                font-weight: bold;
                margin: 20px 0;
                text-align: center;
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
            .product-variation {
                color: #FF9800;
                font-style: italic;
                font-size: 13px;
                margin-top: 3px;
            }
            .product-discount {
                color: #4CAF50;
                font-size: 12px;
                margin-top: 3px;
                font-style: italic;
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
            .discount-line {
                color: #f44336;
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
        </style>
    </head>
    <body>
        <div class="header">
            <div class="header-left">
                <div class="company-name">${empresaSettings.empresaNome || "SUA EMPRESA LTDA"}</div>
                <div class="company-info">
                    <div>CNPJ: ${empresaSettings.empresaCNPJ || "00.000.000/0001-00"}</div>
                    <div>Telefone: ${empresaSettings.empresaTelefone || "(00) 0000-0000"}</div>
                    <div>Email: ${empresaSettings.empresaEmail || "contato@empresa.com.br"}</div>
                    <div>Endereço: ${empresaSettings.empresaEndereco || "Sua Rua, 123 - Sua Cidade - UF"}</div>
                </div>
            </div>
            ${empresaSettings.empresaLogoUri ? `
                <img src="${empresaSettings.empresaLogoUri}" alt="Logo da Empresa" class="company-logo" />
            ` : ''}
        </div>

        <div class="document-title">NOTA DE PEDIDO Nº ${pedido.id}</div>

        <div class="order-info">
            <div class="info-section">
                <div class="info-title">DADOS DO CLIENTE</div>
                <div class="info-line"><strong>Nome Fantasia:</strong> ${cliente.nomeFantasia}</div>
                <div class="info-line"><strong>Razão Social:</strong> ${cliente.razaoSocial || 'N/A'}</div>
                <div class="info-line"><strong>CNPJ:</strong> ${cliente.cnpj || 'N/A'}</div>
                <div class="info-line"><strong>Endereço:</strong> ${enderecoFormatado}</div>
                <div class="info-line"><strong>Telefone:</strong> ${cliente.telefone || 'N/A'}</div>
                <div class="info-line"><strong>Email:</strong> ${cliente.email || 'N/A'}</div>
            </div>

            <div class="info-section">
                <div class="info-title">DADOS DO PEDIDO</div>
                <div class="info-line"><strong>Data:</strong> ${new Date(pedido.data).toLocaleDateString('pt-BR')}</div>
                <div class="info-line"><strong>Hora:</strong> ${new Date(pedido.data).toLocaleTimeString('pt-BR')}</div>
                <div class="info-line"><strong>Método de Pagamento:</strong> ${metodoPagamento}</div>
            </div>
        </div>

        <table class="products-table">
            <thead>
                <tr>
                    <th style="width: 45%;">Produto</th>
                    <th style="width: 15%;">Quantidade</th>
                    <th style="width: 20%;">Valor Unitário</th>
                    <th style="width: 20%;">Valor Total</th>
                </tr>
            </thead>
            <tbody>
                ${pedido.produtos.map(produto => {
                  const precoOriginal = produto.preco * produto.quantidade;
                  const precoFinal = calcularValorProduto(produto);
                  
                  return `
                    <tr>
                        <td>
                            ${produto.nome}
                            ${produto.variacaoSelecionada ? `
                                <div class="product-variation">
                                    ${produto.variacaoSelecionada.tipo === 'cor' ? 'Cor' : 'Tamanho'}: ${produto.variacaoSelecionada.valor}
                                </div>
                            ` : ''}
                            ${mostrarDescontos && produto.desconto?.valor ? `
                                <div class="product-discount">
                                    Desconto: ${produto.desconto.tipo === 'percentual' 
                                      ? produto.desconto.valor + '%' 
                                      : 'R$ ' + produto.desconto.valor}
                                </div>
                            ` : ''}
                        </td>
                        <td style="text-align: center;">${produto.quantidade}</td>
                        <td style="text-align: right;">R$ ${produto.preco.toFixed(2).replace('.', ',')}</td>
                        <td style="text-align: right;">R$ ${precoFinal.toFixed(2).replace('.', ',')}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>

        <div class="totals-section">
            <div class="total-line">
                <span>Subtotal:</span>
                <span>R$ ${subtotalSemDescontos.toFixed(2).replace('.', ',')}</span>
            </div>
            ${mostrarDescontos && descontosTotaisIndividuais > 0 ? `
            <div class="total-line discount-line">
                <span>Descontos nos produtos:</span>
                <span>- R$ ${descontosTotaisIndividuais.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="total-line">
                <span>Subtotal com descontos:</span>
                <span>R$ ${subtotalComDescontosIndividuais.toFixed(2).replace('.', ',')}</span>
            </div>
            ` : ''}
            ${mostrarDescontos && descontoGeral > 0 ? `
            <div class="total-line discount-line">
                <span>Desconto geral (${pedido.desconto.tipo === 'percentual' ? pedido.desconto.valor + '%' : 'R$ ' + pedido.desconto.valor}):</span>
                <span>- R$ ${descontoGeral.toFixed(2).replace('.', ',')}</span>
            </div>
            ` : ''}
            <div class="total-line total-final">
                <span>TOTAL GERAL:</span>
                <span>R$ ${totalFinal.toFixed(2).replace('.', ',')}</span>
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
                        <strong>${index + 1}ª Parcela:</strong> ${prazo.dias} dias
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
            <p>Este documento é uma nota de pedido e não possui valor fiscal.</p>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            ${mostrarDescontos ? '<p><em>Nota gerada com descontos aplicados</em></p>' : '<p><em>Nota gerada sem exibição de descontos</em></p>'}
        </div>
    </body>
    </html>
  `;
};