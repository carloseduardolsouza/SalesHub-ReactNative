export const calculateOrderTotals = (order) => {
  // Calcular subtotal considerando descontos individuais
  let subtotalComDescontosIndividuais = 0;
  let descontosTotaisIndividuais = 0;
  
  order.produtos.forEach(produto => {
    const precoOriginal = produto.preco * produto.quantidade;
    let descontoIndividual = 0;
    
    if (produto.desconto?.valor) {
      const valorDesconto = parseFloat(produto.desconto.valor.replace(',', '.')) || 0;
      if (produto.desconto.tipo === 'percentual') {
        descontoIndividual = (precoOriginal * valorDesconto) / 100;
      } else {
        descontoIndividual = valorDesconto;
      }
    }
    
    subtotalComDescontosIndividuais += precoOriginal - descontoIndividual;
    descontosTotaisIndividuais += descontoIndividual;
  });

  // Calcular desconto geral (aplicado sobre o subtotal já com descontos individuais)
  let descontoGeral = 0;
  if (order.desconto?.valor) {
    const valorDesconto = parseFloat(order.desconto.valor.replace(',', '.')) || 0;
    if (order.desconto.tipo === 'percentual') {
      descontoGeral = (subtotalComDescontosIndividuais * valorDesconto) / 100;
    } else {
      descontoGeral = valorDesconto;
    }
  }

  const subtotalSemDescontos = order.produtos.reduce((sum, produto) => {
    return sum + (produto.preco * produto.quantidade);
  }, 0);

  const total = Math.max(0, subtotalComDescontosIndividuais - descontoGeral);

  return { 
    subtotalSemDescontos,
    subtotalComDescontosIndividuais, 
    descontosTotaisIndividuais,
    descontoGeral, 
    total 
  };
};