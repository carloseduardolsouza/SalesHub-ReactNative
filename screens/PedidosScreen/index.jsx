import React, { useState, useEffect } from 'react';
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

const PedidosScreen = () => {
  // Estados principais
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [empresaSettings, setEmpresaSettings] = useState({
    empresaNome: '',
    empresaCNPJ: '',
    empresaEmail: '',
    empresaTelefone: '',
    empresaEndereco: '',
    empresaLogoUri: null
  });

  // Estados de filtros e busca
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  // Estados dos modais
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showProductSelectionModal, setShowProductSelectionModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Estado do novo pedido
  const [newOrder, setNewOrder] = useState({
    cliente: '',
    produtos: [],
    desconto: { tipo: 'percentual', valor: '' },
    metodoPagamento: 'dinheiro',
    prazos: [],
    observacoes: '',
    status: 'pendente',
  });

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
      const industriasData = await AsyncStorage.getItem('industrias');
      const settingsData = await AsyncStorage.getItem('settings');

      setPedidos(pedidosData ? JSON.parse(pedidosData) : []);
      setClientes(clientesData ? JSON.parse(clientesData) : []);
      setProdutos(produtosData ? JSON.parse(produtosData) : []);
      setIndustrias(industriasData ? JSON.parse(industriasData) : []);
      
      // Carregar configurações da empresa
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
        console.log('Configurações da empresa carregadas:', settings);
      }
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

  const createNewOrder = async () => {
    if (!newOrder.cliente || newOrder.produtos.length === 0) {
      Alert.alert('Erro', 'Selecione um cliente e pelo menos um produto!');
      return;
    }

    if (newOrder.metodoPagamento === 'boleto' && newOrder.prazos.length === 0) {
      Alert.alert('Erro', 'Para boleto, adicione pelo menos um prazo de pagamento!');
      return;
    }

    if (newOrder.metodoPagamento === 'boleto') {
      const totalPorcentagem = newOrder.prazos.reduce((sum, prazo) => {
        return sum + (parseFloat(prazo.porcentagem) || 0);
      }, 0);

      if (Math.abs(totalPorcentagem - 100) > 0.01) {
        Alert.alert('Erro', 'A soma das porcentagens dos prazos deve ser 100%!');
        return;
      }
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
      status: newOrder.status,
      data: new Date().toISOString(),
    };

    const updatedPedidos = [pedido, ...pedidos];
    await savePedidos(updatedPedidos);

    setNewOrder({
      cliente: '',
      produtos: [],
      desconto: { tipo: 'percentual', valor: '' },
      metodoPagamento: 'dinheiro',
      prazos: [],
      observacoes: '',
      status: 'pendente',
    });

    setShowNewOrderModal(false);
    Alert.alert('Sucesso', 'Pedido criado com sucesso!');
  };

  const exportOrderToPDF = async (pedido) => {
    try {
      console.log('Exportando PDF com configurações:', empresaSettings);
      
      // Gerar HTML com os dados da empresa
      const htmlContent = generateOrderHTML(pedido, clientes, empresaSettings);
      const fileName = `NotaPedido_${pedido.id}_${new Date().getTime()}.pdf`;

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
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  return (
    <View style={styles.container}>
      <Header onAddPress={() => setShowNewOrderModal(true)} />

      <SearchAndFilters
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <PedidosList
        pedidos={filteredPedidos}
        onSelectPedido={handleSelectOrder}
      />

      <NewOrderModal
        visible={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        newOrder={newOrder}
        setNewOrder={setNewOrder}
        clientes={clientes}
        produtos={produtos}
        industrias={industrias}
        onCreateOrder={createNewOrder}
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