import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const PedidosScreen = () => {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [newOrder, setNewOrder] = useState({
    cliente: '',
    produtos: [],
    observacoes: '',
    status: 'pendente',
  });

  const statusOptions = ['Todos', 'pendente', 'processando', 'concluido', 'cancelado'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPedidos();
  }, [searchText, selectedStatus, pedidos]);

  const loadData = async () => {
    try {
      const pedidosData = await AsyncStorage.getItem('pedidos');
      const clientesData = await AsyncStorage.getItem('clientes');
      const produtosData = await AsyncStorage.getItem('produtos');

      setPedidos(pedidosData ? JSON.parse(pedidosData) : []);
      setClientes(clientesData ? JSON.parse(clientesData) : []);
      setProdutos(produtosData ? JSON.parse(produtosData) : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const savePedidos = async (newPedidos) => {
    try {
      await AsyncStorage.setItem('pedidos', JSON.stringify(newPedidos));
      setPedidos(newPedidos);
    } catch (error) {
      console.error('Erro ao salvar pedidos:', error);
      Alert.alert('Erro', 'Erro ao salvar pedidos');
    }
  };

  const filterPedidos = () => {
    let filtered = pedidos;

    if (searchText) {
      filtered = filtered.filter(pedido =>
        pedido.cliente.toLowerCase().includes(searchText.toLowerCase()) ||
        pedido.id.toString().includes(searchText)
      );
    }

    if (selectedStatus !== 'Todos') {
      filtered = filtered.filter(pedido => pedido.status === selectedStatus);
    }

    setFilteredPedidos(filtered);
  };

  const createNewOrder = () => {
    if (!newOrder.cliente || newOrder.produtos.length === 0) {
      Alert.alert('Erro', 'Selecione um cliente e pelo menos um produto!');
      return;
    }

    const total = newOrder.produtos.reduce((sum, produto) => {
      return sum + (produto.price * produto.quantity);
    }, 0);

    const pedido = {
      id: Date.now(),
      cliente: newOrder.cliente,
      produtos: newOrder.produtos,
      total,
      observacoes: newOrder.observacoes,
      status: newOrder.status,
      data: new Date().toISOString(),
    };

    const updatedPedidos = [pedido, ...pedidos];
    savePedidos(updatedPedidos);

    setNewOrder({
      cliente: '',
      produtos: [],
      observacoes: '',
      status: 'pendente',
    });
    setShowNewOrderModal(false);
    Alert.alert('Sucesso', 'Pedido criado com sucesso!');
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedPedidos = pedidos.map(pedido =>
      pedido.id === orderId ? { ...pedido, status: newStatus } : pedido
    );
    savePedidos(updatedPedidos);
    setShowOrderDetailsModal(false);
    Alert.alert('Sucesso', 'Status do pedido atualizado!');
  };

  const addProductToOrder = (produto) => {
    const existingProduct = newOrder.produtos.find(p => p.id === produto.id);
    
    if (existingProduct) {
      const updatedProducts = newOrder.produtos.map(p =>
        p.id === produto.id ? { ...p, quantity: p.quantity + 1 } : p
      );
      setNewOrder({ ...newOrder, produtos: updatedProducts });
    } else {
      setNewOrder({
        ...newOrder,
        produtos: [...newOrder.produtos, { ...produto, quantity: 1 }]
      });
    }
  };

  const removeProductFromOrder = (productId) => {
    const updatedProducts = newOrder.produtos.filter(p => p.id !== productId);
    setNewOrder({ ...newOrder, produtos: updatedProducts });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente': return '#FF9800';
      case 'processando': return '#2196F3';
      case 'concluido': return '#4CAF50';
      case 'cancelado': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'processando': return 'Processando';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const renderPedidoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.pedidoCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowOrderDetailsModal(true);
      }}
    >
      <View style={styles.pedidoHeader}>
        <Text style={styles.pedidoId}>Pedido #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.pedidoCliente}>{item.cliente}</Text>
      <Text style={styles.pedidoData}>
        {new Date(item.data).toLocaleDateString('pt-BR')}
      </Text>
      <Text style={styles.pedidoTotal}>Total: R$ {item.total?.toFixed(2) || '0.00'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewOrderModal(true)}
        >
          <Text style={styles.addButtonText}>➕ Novo Pedido</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cliente ou número do pedido..."
          value={searchText}
          onChangeText={setSearchText}
        />
        
        <View style={styles.filterContainer}>
          <Picker
            selectedValue={selectedStatus}
            style={styles.picker}
            onValueChange={setSelectedStatus}
          >
            {statusOptions.map(status => (
              <Picker.Item key={status} label={status} value={status} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Pedidos List */}
      <FlatList
        data={filteredPedidos}
        renderItem={renderPedidoItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhum pedido encontrado</Text>
          </View>
        }
      />

      {/* New Order Modal */}
      <Modal visible={showNewOrderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={styles.modalTitle}>Novo Pedido</Text>
              
              {/* Cliente Selection */}
              <Text style={styles.inputLabel}>Cliente</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={newOrder.cliente}
                  onValueChange={(value) => setNewOrder({...newOrder, cliente: value})}
                >
                  <Picker.Item label="Selecione um cliente" value="" />
                  {clientes.map(cliente => (
                    <Picker.Item 
                      key={cliente.id} 
                      label={cliente.nomeLoja} 
                      value={cliente.nomeLoja} 
                    />
                  ))}
                </Picker>
              </View>

              {/* Products Selection */}
              <Text style={styles.inputLabel}>Produtos</Text>
              <View style={styles.produtosSection}>
                {produtos.map(produto => (
                  <TouchableOpacity
                    key={produto.id}
                    style={styles.produtoItem}
                    onPress={() => addProductToOrder(produto)}
                  >
                    <Text style={styles.produtoName}>{produto.name}</Text>
                    <Text style={styles.produtoPrice}>R$ {produto.price?.toFixed(2) || '0.00'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selected Products */}
              {newOrder.produtos.length > 0 && (
                <View style={styles.selectedProductsSection}>
                  <Text style={styles.inputLabel}>Produtos Selecionados</Text>
                  {newOrder.produtos.map(produto => (
                    <View key={produto.id} style={styles.selectedProduct}>
                      <Text style={styles.selectedProductName}>{produto.name}</Text>
                      <Text style={styles.selectedProductQty}>Qtd: {produto.quantity}</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeProductFromOrder(produto.id)}
                      >
                        <Text style={styles.removeButtonText}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Observações */}
              <Text style={styles.inputLabel}>Observações</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Observações sobre o pedido..."
                value={newOrder.observacoes}
                onChangeText={(text) => setNewOrder({...newOrder, observacoes: text})}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowNewOrderModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={createNewOrder}
                >
                  <Text style={styles.saveButtonText}>Criar Pedido</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal visible={showOrderDetailsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedOrder && (
              <ScrollView>
                <Text style={styles.modalTitle}>Pedido #{selectedOrder.id}</Text>
                
                <Text style={styles.detailLabel}>Cliente:</Text>
                <Text style={styles.detailValue}>{selectedOrder.cliente}</Text>
                
                <Text style={styles.detailLabel}>Data:</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedOrder.data).toLocaleDateString('pt-BR')}
                </Text>
                
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusSection}>
                  {statusOptions.slice(1).map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        { backgroundColor: selectedOrder.status === status ? getStatusColor(status) : '#f0f0f0' }
                      ]}
                      onPress={() => updateOrderStatus(selectedOrder.id, status)}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        { color: selectedOrder.status === status ? '#fff' : '#333' }
                      ]}>
                        {getStatusText(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={styles.detailLabel}>Produtos:</Text>
                {selectedOrder.produtos?.map((produto, index) => (
                  <View key={index} style={styles.produtoDetail}>
                    <Text style={styles.produtoDetailName}>{produto.name}</Text>
                    <Text style={styles.produtoDetailInfo}>
                      Qtd: {produto.quantity} x R$ {produto.price?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                ))}
                
                <Text style={styles.detailLabel}>Total:</Text>
                <Text style={styles.totalValue}>R$ {selectedOrder.total?.toFixed(2) || '0.00'}</Text>
                
                {selectedOrder.observacoes && (
                  <>
                    <Text style={styles.detailLabel}>Observações:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.observacoes}</Text>
                  </>
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowOrderDetailsModal(false)}
                >
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  controls: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  filterContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 100,
  },
  pedidoCard: {
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
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pedidoId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pedidoCliente: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  pedidoData: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  pedidoTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  produtosSection: {
    maxHeight: 150,
  },
  produtoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  produtoName: {
    fontSize: 16,
    color: '#333',
  },
  produtoPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  selectedProductsSection: {
    marginTop: 15,
  },
  selectedProduct: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  selectedProductName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedProductQty: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    height: 80,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    borderRadius: 8,
    padding: 15,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
  },
  statusSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  produtoDetail: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  produtoDetailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  produtoDetailInfo: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  closeButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PedidosScreen;