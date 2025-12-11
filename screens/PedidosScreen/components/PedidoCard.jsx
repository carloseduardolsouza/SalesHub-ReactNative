import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const metodoPagamentoOptions = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'pix', label: 'Pix' },
  { value: 'boleto', label: 'Boleto' }
];

const PedidoCard = memo(({ pedido, onPress }) => {
  const metodoPagamento = metodoPagamentoOptions.find(
    m => m.value === pedido.metodoPagamento
  )?.label || pedido.metodoPagamento;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.id}>Pedido #{pedido.id}</Text>
      </View>
      <Text style={styles.cliente}>{pedido.cliente}</Text>
      <Text style={styles.data}>
        {new Date(pedido.data).toLocaleDateString('pt-BR')}
      </Text>
      <Text style={styles.total}>
        Total: R$ {pedido.total?.toFixed(2) || '0.00'}
      </Text>
      <Text style={styles.pagamento}>{metodoPagamento}</Text>
    </TouchableOpacity>
  );
});

PedidoCard.displayName = 'PedidoCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  id: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cliente: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  data: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 3,
  },
  pagamento: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default PedidoCard;