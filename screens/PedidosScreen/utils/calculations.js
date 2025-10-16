export const calculateOrderTotals = (order) => {
  const subtotal = order.produtos.reduce((sum, produto) => {
    return sum + (produto.preco * produto.quantidade);
  }, 0);

  let desconto = 0;
  if (order.desconto.valor) {
    const valorDesconto = parseFloat(order.desconto.valor.replace(',', '.')) || 0;
    if (order.desconto.tipo === 'percentual') {
      desconto = (subtotal * valorDesconto) / 100;
    } else {
      desconto = valorDesconto;
    }
  }

  const total = Math.max(0, subtotal - desconto);

  return { subtotal, desconto, total };
};