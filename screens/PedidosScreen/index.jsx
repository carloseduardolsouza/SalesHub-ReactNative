import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import Header from './components/Header';
import SearchAndFilters from './components/SearchAndFilters';
import PedidosList from './components/PedidosList';
import NewOrderModal from './components/NewOrderModal';
import ProductSelectionModal from './components/ProductSelectionModal';
import OrderDetailsModal from './components/OrderDetailsModal';
import { generateOrderHTML } from './utils/pdfGenerator';
import { calculateOrderTotals } from './utils/calculations';

const INITIAL_ORDER_STATE = {
  cliente: '',
  produtos: [],
  desconto: { tipo: 'percentual', valor: '' },
  metodoPagamento: 'dinheiro',
  prazos: [],
  observacoes: '',
};

const PedidosScreen = () => {
  // Estados principais
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [empresaSettings, setEmpresaSettings] = useState({
    empresaNome: '',
    empresaCNPJ: '',
    empresaEmail: '',
    empresaTelefone: '',
    empresaEndereco: '',
    empresaLogoUri: null
  });

  // Estados de filtros e busca
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  // Estados dos modais
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showProductSelectionModal, setShowProductSelectionModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Estados para edição
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  // Estado do novo pedido
  const [newOrder, setNewOrder] = useState(INITIAL_ORDER_STATE);

  // Memoiza pedidos filtrados
  const filteredPedidos = useMemo(() => {
    let filtered = pedidos;

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(pedido =>
        pedido.cliente.toLowerCase().includes(searchLower) ||
        pedido.id.toString().includes(searchText)
      );
    }

    if (selectedStatus !== 'Todos') {
      filtered = filtered.filter(pedido => pedido.status === selectedStatus);
    }

    return filtered;
  }, [pedidos, searchText, selectedStatus]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [pedidosData, clientesData, produtosData, industriasData, settingsData] = await Promise.all([
        AsyncStorage.getItem('pedidos'),
        AsyncStorage.getItem('clientes'),
        AsyncStorage.getItem('produtos'),
        AsyncStorage.getItem('industrias'),
        AsyncStorage.getItem('settings')
      ]);

      setPedidos(pedidosData ? JSON.parse(pedidosData) : []);
      setClientes(clientesData ? JSON.parse(clientesData) : []);
      setProdutos(produtosData ? JSON.parse(produtosData) : []);
      setIndustrias(industriasData ? JSON.parse(industriasData) : []);
      
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        setEmpresaSettings({
          empresaNome: settings.empresaNome || '',
          empresaCNPJ: settings.empresaCNPJ || '',
          empresaEmail: settings.empresaEmail || '',
          empresaTelefone: settings.empresaTelefone || '',
          empresaEndereco: settings.empresaEndereco || '',
          empresaLogoUri: settings.empresaLogoUri || null
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, []);

  const savePedidos = useCallback(async (newPedidos) => {
    try {
      await AsyncStorage.setItem('pedidos', JSON.stringify(newPedidos));
      setPedidos(newPedidos);
    } catch (error) {
      console.error('Erro ao salvar pedidos:', error);
      Alert.alert('Erro', 'Erro ao salvar pedidos');
    }
  }, []);

  const resetOrderForm = useCallback(() => {
    setNewOrder(INITIAL_ORDER_STATE);
    setIsEditMode(false);
    setEditingOrderId(null);
  }, []);

  const createNewOrder = useCallback(async () => {
    if (!newOrder.cliente || newOrder.produtos.length === 0) {
      Alert.alert('Erro', 'Selecione um cliente e pelo menos um produto!');
      return;
    }

    if (newOrder.metodoPagamento === 'boleto' && newOrder.prazos.length === 0) {
      Alert.alert('Erro', 'Para boleto, adicione pelo menos um prazo de pagamento!');
      return;
    }

    const { total } = calculateOrderTotals(newOrder);

    const pedido = {
      id: Date.now(),
      cliente: newOrder.cliente,
      produtos: newOrder.produtos,
      desconto: newOrder.desconto,
      metodoPagamento: newOrder.metodoPagamento,
      prazos: newOrder.prazos,
      total,
      observacoes: newOrder.observacoes,
      status: 'pendente',
      data: new Date().toISOString(),
    };

    const updatedPedidos = [pedido, ...pedidos];
    await savePedidos(updatedPedidos);

    resetOrderForm();
    setShowNewOrderModal(false);
    Alert.alert('Sucesso', 'Pedido criado com sucesso!');
  }, [newOrder, pedidos, savePedidos, resetOrderForm]);

  const handleEditOrder = useCallback((order) => {
    setShowOrderDetails(false);
    
    const produtosComDesconto = order.produtos.map(produto => ({
      ...produto,
      desconto: produto.desconto || { tipo: 'percentual', valor: '' }
    }));

    setNewOrder({
      cliente: order.cliente,
      produtos: produtosComDesconto,
      desconto: order.desconto || { tipo: 'percentual', valor: '' },
      metodoPagamento: order.metodoPagamento,
      prazos: order.prazos || [],
      observacoes: order.observacoes || '',
    });

    setIsEditMode(true);
    setEditingOrderId(order.id);
    setShowNewOrderModal(true);
  }, []);

  const updateOrder = useCallback(async () => {
    if (!newOrder.cliente || newOrder.produtos.length === 0) {
      Alert.alert('Erro', 'Selecione um cliente e pelo menos um produto!');
      return;
    }

    if (newOrder.metodoPagamento === 'boleto' && newOrder.prazos.length === 0) {
      Alert.alert('Erro', 'Para boleto, adicione pelo menos um prazo de pagamento!');
      return;
    }

    const { total } = calculateOrderTotals(newOrder);

    const updatedPedidos = pedidos.map(pedido => {
      if (pedido.id === editingOrderId) {
        return {
          ...pedido,
          cliente: newOrder.cliente,
          produtos: newOrder.produtos,
          desconto: newOrder.desconto,
          metodoPagamento: newOrder.metodoPagamento,
          prazos: newOrder.prazos,
          total,
          observacoes: newOrder.observacoes,
        };
      }
      return pedido;
    });

    await savePedidos(updatedPedidos);

    resetOrderForm();
    setShowNewOrderModal(false);
    Alert.alert('Sucesso', 'Pedido atualizado com sucesso!');
  }, [newOrder, pedidos, editingOrderId, savePedidos, resetOrderForm]);

  const handleCloseOrderModal = useCallback(() => {
    resetOrderForm();
    setShowNewOrderModal(false);
  }, [resetOrderForm]);

  const exportOrderToPDF = useCallback(async (pedido, clientes, mostrarDescontos = false) => {
    try {
      const htmlContent = generateOrderHTML(pedido, clientes, empresaSettings, mostrarDescontos);
      const descontoSuffix = mostrarDescontos ? '_com_descontos' : '_sem_descontos';
      const fileName = `NotaPedido_${pedido.id}${descontoSuffix}_${new Date().getTime()}.pdf`;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (!uri) {
        Alert.alert('Erro', 'Não foi possível gerar o PDF.');
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Compartilhar Nota de Pedido #${pedido.id}`,
        UTI: 'com.adobe.pdf',
        filename: fileName,
      });
    } catch (error) {
      console.error('Erro ao gerar/compartilhar PDF:', error);
      Alert.alert('Erro', 'Não foi possível gerar ou compartilhar o PDF. Tente novamente.');
    }
  }, [empresaSettings]);

  const handleDeleteOrder = useCallback((order) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o pedido #${order.id}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPedidos = pedidos.filter(pedido => pedido.id !== order.id);
              await savePedidos(updatedPedidos);
              setShowOrderDetails(false);
              Alert.alert('Sucesso', 'Pedido excluído com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir pedido:', error);
              Alert.alert('Erro', 'Não foi possível excluir o pedido. Tente novamente.');
            }
          }
        }
      ],
      { cancelable: true }
    );
  }, [pedidos, savePedidos]);

  const handleSelectOrder = useCallback((order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleOpenAddOrder = useCallback(() => {
    resetOrderForm();
    setShowNewOrderModal(true);
  }, [resetOrderForm]);

  return (
    <View style={styles.container}>
      <Header onAddPress={handleOpenAddOrder} />

      <SearchAndFilters
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <PedidosList
        pedidos={filteredPedidos}
        onSelectPedido={handleSelectOrder}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <NewOrderModal
        visible={showNewOrderModal}
        onClose={handleCloseOrderModal}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        clientes={clientes}
        produtos={produtos}
        industrias={industrias}
        onCreateOrder={isEditMode ? updateOrder : createNewOrder}
        onOpenProductSelection={() => setShowProductSelectionModal(true)}
      />

      <ProductSelectionModal
        visible={showProductSelectionModal}
        onClose={() => setShowProductSelectionModal(false)}
        produtos={produtos}
        industrias={industrias}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
      />

      <OrderDetailsModal
        visible={showOrderDetailsModal}
        onClose={() => setShowOrderDetails(false)}
        order={selectedOrder}
        clientes={clientes}
        onExportPDF={exportOrderToPDF}
        onEditOrder={handleEditOrder}
        onDeleteOrder={handleDeleteOrder}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default PedidosScreen;