import React from 'react';
import { FlatList, View, Text, RefreshControl, StyleSheet } from 'react-native';
import PedidoCard from './PedidoCard';

const PedidosList = ({ pedidos, onSelectPedido, refreshing, onRefresh }) => (
  <FlatList
    data={pedidos}
    renderItem={({ item }) => (
      <PedidoCard pedido={item} onPress={() => onSelectPedido(item)} />
    )}
    keyExtractor={item => item.id.toString()}
    contentContainerStyle={styles.listContainer}
    showsVerticalScrollIndicator={false}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={['#2196F3']}
        tintColor="#2196F3"
      />
    }
    ListEmptyComponent={
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Nenhum pedido encontrado</Text>
      </View>
    }
  />
);

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 100,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
});

export default PedidosList;