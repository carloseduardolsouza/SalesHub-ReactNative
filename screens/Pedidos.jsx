import React, { useState, useEffect, useMemo } from 'react';
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
  Image,
  Share,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Search, Plus, Minus, ShoppingCart, X, Filter, Check, Download, FileText } from 'lucide-react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';

const PedidosScreen = () => {
  // Estados principais
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  
  // Estados de filtros e busca
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  
  // Estados dos modais
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showProductSelectionModal, setShowProductSelectionModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Estados do novo pedido
  const [newOrder, setNewOrder] = useState({
    cliente: '',
    produtos: [],
    desconto: { tipo: 'percentual', valor: '' }, // percentual ou fixo
    metodoPagamento: 'dinheiro',
    prazos: [], // Para boleto
    observacoes: '',
    status: 'pendente',
  });
  
  // Estados para seleção de produtos
  const [productSearch, setProductSearch] = useState('');
  const [selectedIndustrias, setSelectedIndustrias] = useState([]);
  const [clienteSearch, setClienteSearch] = useState('');
  
  const statusOptions = ['Todos', 'pendente', 'processando', 'concluido', 'cancelado'];
  const metodoPagamentoOptions = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'cartao', label: 'Cartão' },
    { value: 'pix', label: 'Pix' },
    { value: 'boleto', label: 'Boleto' }
  ];

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

      setPedidos(pedidosData ? JSON.parse(pedidosData) : []);
      setClientes(clientesData ? JSON.parse(clientesData) : []);
      setProdutos(produtosData ? JSON.parse(produtosData) : []);
      setIndustrias(industriasData ? JSON.parse(industriasData) : []);
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

  // Filtrar clientes para busca
  const filteredClientes = useMemo(() => {
    if (!clienteSearch.trim()) return clientes;
    return clientes.filter(cliente =>
      cliente.nomeFantasia.toLowerCase().includes(clienteSearch.toLowerCase()) ||
      cliente.razaoSocial.toLowerCase().includes(clienteSearch.toLowerCase())
    );
  }, [clientes, clienteSearch]);

  // Filtrar produtos para seleção
  const filteredProducts = useMemo(() => {
    let filtered = produtos;

    // Filtrar por busca
    if (productSearch.trim()) {
      filtered = filtered.filter(produto =>
        produto.nome.toLowerCase().includes(productSearch.toLowerCase())
      );
    }

    // Filtrar por indústrias selecionadas
    if (selectedIndustrias.length > 0) {
      filtered = filtered.filter(produto =>
        selectedIndustrias.includes(produto.industria)
      );
    }

    return filtered;
  }, [produtos, productSearch, selectedIndustrias]);

  // Calcular totais do pedido
  const calculateTotals = () => {
    const subtotal = newOrder.produtos.reduce((sum, produto) => {
      return sum + (produto.preco * produto.quantidade);
    }, 0);

    let desconto = 0;
    if (newOrder.desconto.valor) {
      const valorDesconto = parseFloat(newOrder.desconto.valor.replace(',', '.')) || 0;
      if (newOrder.desconto.tipo === 'percentual') {
        desconto = (subtotal * valorDesconto) / 100;
      } else {
        desconto = valorDesconto;
      }
    }

    const total = Math.max(0, subtotal - desconto);

    return { subtotal, desconto, total };
  };

  // Função para solicitar permissões no Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Permissão de Armazenamento',
            message: 'Este app precisa de acesso ao armazenamento para salvar o PDF.',
            buttonNeutral: 'Perguntar Depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Função para gerar HTML do pedido
  const generateOrderHTML = (pedido) => {
    const cliente = clientes.find(c => c.nomeFantasia === pedido.cliente) || { nomeFantasia: pedido.cliente, razaoSocial: '', cnpj: '', endereco: '', telefone: '', email: '' };
    
    const subtotal = pedido.produtos.reduce((sum, produto) => sum + (produto.preco * produto.quantidade), 0);
    
    let desconto = 0;
    if (pedido.desconto?.valor) {
      const valorDesconto = parseFloat(pedido.desconto.valor.toString().replace(',', '.')) || 0;
      if (pedido.desconto.tipo === 'percentual') {
        desconto = (subtotal * valorDesconto) / 100;
      } else {
        desconto = valorDesconto;
      }
    }

    const metodoPagamento = metodoPagamentoOptions.find(m => m.value === pedido.metodoPagamento)?.label || pedido.metodoPagamento;

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
            
            @media print {
                body { margin: 0; }
                .header { margin-top: 0; }
            }
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

  // Função para exportar pedido em PDF
  const exportOrderToPDF = async (pedido) => {
    try {
      // Solicitar permissões
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Erro', 'Permissão negada para salvar o arquivo.');
        return;
      }

      // Gerar HTML
      const htmlContent = generateOrderHTML(pedido);

      // Configurações do PDF
      const options = {
        html: htmlContent,
        fileName: `NotaPedido_${pedido.id}_${new Date().getTime()}`,
        directory: 'Documents',
        width: 612, // Largura A4 em pontos
        height: 792, // Altura A4 em pontos
        base64: false,
      };

      // Gerar PDF
      const pdf = await RNHTMLtoPDF.convert(options);

      if (pdf.filePath) {
        Alert.alert(
          'PDF Gerado com Sucesso!',
          `O arquivo foi salvo em: ${pdf.filePath}`,
          [
            {
              text: 'OK',
              style: 'default'
            },
            {
              text: 'Compartilhar',
              onPress: () => sharePDF(pdf.filePath)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF. Tente novamente.');
    }
  };

  // Função para compartilhar o PDF
  const sharePDF = async (filePath) => {
    try {
      const shareOptions = {
        title: 'Compartilhar Nota de Pedido',
        url: `file://${filePath}`,
        type: 'application/pdf',
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Erro ao compartilhar PDF:', error);
    }
  };

  // Adicionar produto ao pedido
  const addProductToOrder = (produto) => {
    const existingProduct = newOrder.produtos.find(p => p.id === produto.id);
    
    if (existingProduct) {
      const updatedProducts = newOrder.produtos.map(p =>
        p.id === produto.id ? { ...p, quantidade: p.quantidade + 1 } : p
      );
      setNewOrder({ ...newOrder, produtos: updatedProducts });
    } else {
      setNewOrder({
        ...newOrder,
        produtos: [...newOrder.produtos, { 
          ...produto, 
          quantidade: 1,
          precoUnitario: produto.preco 
        }]
      });
    }
  };

  // Remover produto do pedido
  const removeProductFromOrder = (productId) => {
    const updatedProducts = newOrder.produtos.filter(p => p.id !== productId);
    setNewOrder({ ...newOrder, produtos: updatedProducts });
  };

  // Atualizar quantidade do produto
  const updateProductQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeProductFromOrder(productId);
      return;
    }

    const updatedProducts = newOrder.produtos.map(p =>
      p.id === productId ? { ...p, quantidade: newQuantity } : p
    );
    setNewOrder({ ...newOrder, produtos: updatedProducts });
  };

  // Toggle seleção de indústria
  const toggleIndustria = (industriaNome) => {
    if (selectedIndustrias.includes(industriaNome)) {
      setSelectedIndustrias(selectedIndustrias.filter(i => i !== industriaNome));
    } else {
      setSelectedIndustrias([...selectedIndustrias, industriaNome]);
    }
  };

  // Adicionar prazo para boleto
  const addPrazo = () => {
    setNewOrder({
      ...newOrder,
      prazos: [...newOrder.prazos, { dias: '', porcentagem: '' }]
    });
  };

  // Atualizar prazo
  const updatePrazo = (index, field, value) => {
    const updatedPrazos = newOrder.prazos.map((prazo, i) =>
      i === index ? { ...prazo, [field]: value } : prazo
    );
    setNewOrder({ ...newOrder, prazos: updatedPrazos });
  };

  // Remover prazo
  const removePrazo = (index) => {
    const updatedPrazos = newOrder.prazos.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, prazos: updatedPrazos });
  };

  // Criar novo pedido
  const createNewOrder = async () => {
    if (!newOrder.cliente || newOrder.produtos.length === 0) {
      Alert.alert('Erro', 'Selecione um cliente e pelo menos um produto!');
      return;
    }

    if (newOrder.metodoPagamento === 'boleto' && newOrder.prazos.length === 0) {
      Alert.alert('Erro', 'Para boleto, adicione pelo menos um prazo de pagamento!');
      return;
    }

    // Validar prazos se for boleto
    if (newOrder.metodoPagamento === 'boleto') {
      const totalPorcentagem = newOrder.prazos.reduce((sum, prazo) => {
        return sum + (parseFloat(prazo.porcentagem) || 0);
      }, 0);

      if (Math.abs(totalPorcentagem - 100) > 0.01) {
        Alert.alert('Erro', 'A soma das porcentagens dos prazos deve ser 100%!');
        return;
      }
    }

    const { total } = calculateTotals();

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

    // Reset form
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

  // Abrir modal de seleção de produtos
  const openProductSelection = () => {
    setProductSearch('');
    setSelectedIndustrias([]);
    setShowProductSelectionModal(true);
  };

  // Fechar modal de seleção de produtos
  const closeProductSelection = () => {
    setShowProductSelectionModal(false);
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
      <Text style={styles.pedidoPagamento}>
        {metodoPagamentoOptions.find(m => m.value === item.metodoPagamento)?.label}
      </Text>
    </TouchableOpacity>
  );

  const { subtotal, desconto, total } = calculateTotals();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowNewOrderModal(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Novo</Text>
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

      {/* Modal Principal do Pedido */}
      <Modal visible={showNewOrderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.orderModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Novo Pedido</Text>
              
              {/* Seleção de Cliente */}
              <Text style={styles.sectionTitle}>Cliente *</Text>
              <View style={styles.clienteSection}>
                <TextInput
                  style={styles.clienteSearch}
                  placeholder="Buscar cliente por nome..."
                  value={clienteSearch}
                  onChangeText={setClienteSearch}
                />
                <ScrollView style={styles.clienteList} nestedScrollEnabled>
                  {filteredClientes.map(cliente => (
                    <TouchableOpacity
                      key={cliente.id}
                      style={[
                        styles.clienteOption,
                        newOrder.cliente === cliente.nomeFantasia && styles.clienteSelected
                      ]}
                      onPress={() => {
                        setNewOrder({...newOrder, cliente: cliente.nomeFantasia});
                        setClienteSearch('');
                      }}
                    >
                      <Text style={styles.clienteOptionText}>{cliente.nomeFantasia}</Text>
                      <Text style={styles.clienteOptionSubtext}>{cliente.razaoSocial}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {newOrder.cliente && (
                  <View style={styles.selectedClienteDisplay}>
                    <Text style={styles.selectedClienteText}>Cliente: {newOrder.cliente}</Text>
                  </View>
                )}
              </View>

              {/* Produtos Selecionados */}
              <View style={styles.produtosSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Produtos</Text>
                  <TouchableOpacity
                    style={styles.addProductButton}
                    onPress={openProductSelection}
                  >
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addProductButtonText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>

                {newOrder.produtos.length === 0 ? (
                  <View style={styles.emptyProducts}>
                    <Text style={styles.emptyProductsText}>Nenhum produto selecionado</Text>
                  </View>
                ) : (
                  <View style={styles.productsList}>
                    {newOrder.produtos.map((produto, index) => (
                      <View key={produto.id} style={styles.selectedProduct}>
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>{produto.nome}</Text>
                          <Text style={styles.productPrice}>R$ {produto.preco.toFixed(2)}</Text>
                        </View>
                        
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => updateProductQuantity(produto.id, produto.quantidade - 1)}
                          >
                            <Minus size={16} color="#666" />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{produto.quantidade}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => updateProductQuantity(produto.id, produto.quantidade + 1)}
                          >
                            <Plus size={16} color="#666" />
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.productTotal}>
                          <Text style={styles.productTotalText}>
                            R$ {(produto.preco * produto.quantidade).toFixed(2)}
                          </Text>
                          <TouchableOpacity
                            style={styles.removeProductButton}
                            onPress={() => removeProductFromOrder(produto.id)}
                          >
                            <X size={16} color="#f44336" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Resumo Financeiro */}
              {newOrder.produtos.length > 0 && (
                <View style={styles.resumoFinanceiro}>
                  <Text style={styles.sectionTitle}>Resumo</Text>
                  
                  <View style={styles.resumoLine}>
                    <Text style={styles.resumoLabel}>Subtotal:</Text>
                    <Text style={styles.resumoValue}>R$ {subtotal.toFixed(2)}</Text>
                  </View>

                  {/* Desconto */}
                  <View style={styles.descontoSection}>
                    <Text style={styles.descontoLabel}>Desconto:</Text>
                    <View style={styles.descontoControls}>
                      <View style={styles.descontoTipoContainer}>
                        <Picker
                          selectedValue={newOrder.desconto.tipo}
                          style={styles.descontoTipoPicker}
                          onValueChange={(value) => 
                            setNewOrder({
                              ...newOrder, 
                              desconto: { ...newOrder.desconto, tipo: value }
                            })
                          }
                        >
                          <Picker.Item label="%" value="percentual" />
                          <Picker.Item label="R$" value="fixo" />
                        </Picker>
                      </View>
                      <TextInput
                        style={styles.descontoInput}
                        placeholder={newOrder.desconto.tipo === 'percentual' ? '0' : '0,00'}
                        value={newOrder.desconto.valor}
                        onChangeText={(value) => 
                          setNewOrder({
                            ...newOrder, 
                            desconto: { ...newOrder.desconto, valor: value }
                          })
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {desconto > 0 && (
                    <View style={styles.resumoLine}>
                      <Text style={styles.resumoLabel}>Desconto aplicado:</Text>
                      <Text style={[styles.resumoValue, styles.descontoValue]}>
                        -R$ {desconto.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.resumoLine, styles.totalLine]}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
                  </View>
                </View>
              )}

              {/* Método de Pagamento */}
              <View style={styles.pagamentoSection}>
                <Text style={styles.sectionTitle}>Método de Pagamento *</Text>
                <View style={styles.pagamentoOptions}>
                  {metodoPagamentoOptions.map(metodo => (
                    <TouchableOpacity
                      key={metodo.value}
                      style={[
                        styles.pagamentoOption,
                        newOrder.metodoPagamento === metodo.value && styles.pagamentoSelected
                      ]}
                      onPress={() => {
                        setNewOrder({
                          ...newOrder, 
                          metodoPagamento: metodo.value,
                          prazos: metodo.value === 'boleto' ? [{ dias: '30', porcentagem: '100' }] : []
                        });
                      }}
                    >
                      <Text style={[
                        styles.pagamentoOptionText,
                        newOrder.metodoPagamento === metodo.value && styles.pagamentoSelectedText
                      ]}>
                        {metodo.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Prazos para Boleto */}
                {newOrder.metodoPagamento === 'boleto' && (
                  <View style={styles.prazosSection}>
                    <View style={styles.prazosHeader}>
                      <Text style={styles.prazosTitle}>Prazos de Pagamento</Text>
                      <TouchableOpacity style={styles.addPrazoButton} onPress={addPrazo}>
                        <Plus size={16} color="#007AFF" />
                        <Text style={styles.addPrazoText}>Adicionar</Text>
                      </TouchableOpacity>
                    </View>

                    {newOrder.prazos.map((prazo, index) => (
                      <View key={index} style={styles.prazoItem}>
                        <TextInput
                          style={styles.prazoInput}
                          placeholder="Dias"
                          value={prazo.dias}
                          onChangeText={(value) => updatePrazo(index, 'dias', value)}
                          keyboardType="numeric"
                        />
                        <Text style={styles.prazoSeparator}>dias</Text>
                        <TextInput
                          style={styles.prazoInput}
                          placeholder="0"
                          value={prazo.porcentagem}
                          onChangeText={(value) => updatePrazo(index, 'porcentagem', value)}
                          keyboardType="numeric"
                        />
                        <Text style={styles.prazoSeparator}>%</Text>
                        <TouchableOpacity
                          style={styles.removePrazoButton}
                          onPress={() => removePrazo(index)}
                        >
                          <X size={16} color="#f44336" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {newOrder.prazos.length > 0 && (
                      <Text style={styles.prazosInfo}>
                        Total: {newOrder.prazos.reduce((sum, prazo) => sum + (parseFloat(prazo.porcentagem) || 0), 0)}%
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Observações */}
              <View style={styles.observacoesSection}>
                <Text style={styles.sectionTitle}>Observações</Text>
                <TextInput
                  style={styles.observacoesInput}
                  placeholder="Observações sobre o pedido..."
                  value={newOrder.observacoes}
                  onChangeText={(text) => setNewOrder({...newOrder, observacoes: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Botões */}
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

      {/* Modal de Seleção de Produtos */}
      <Modal visible={showProductSelectionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.productSelectionModal}>
            <View style={styles.productSelectionHeader}>
              <Text style={styles.modalTitle}>Selecionar Produtos</Text>
              <TouchableOpacity
                style={styles.closeProductsButton}
                onPress={closeProductSelection}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Busca de Produtos */}
            <View style={styles.productSearchContainer}>
              <Search size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.productSearchInput}
                placeholder="Buscar produtos..."
                value={productSearch}
                onChangeText={setProductSearch}
              />
            </View>

            {/* Filtro por Indústrias */}
            <View style={styles.industriasFilter}>
              <Text style={styles.industriasFilterTitle}>Filtrar por Indústrias:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.industriasOptions}>
                  {industrias.map(industria => (
                    <TouchableOpacity
                      key={industria.id}
                      style={[
                        styles.industriaOption,
                        selectedIndustrias.includes(industria.nome) && styles.industriaSelected
                      ]}
                      onPress={() => toggleIndustria(industria.nome)}
                    >
                      <Text style={[
                        styles.industriaOptionText,
                        selectedIndustrias.includes(industria.nome) && styles.industriaSelectedText
                      ]}>
                        {industria.nome}
                      </Text>
                      {selectedIndustrias.includes(industria.nome) && (
                        <Check size={16} color="#fff" style={styles.industriaCheck} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Lista de Produtos */}
            <FlatList
              data={filteredProducts}
              renderItem={({ item }) => (
                <View style={styles.productSelectionItem}>
                  <Image
                    source={{ 
                      uri: item.imagem || 'https://via.placeholder.com/60x60/666666/white?text=Produto' 
                    }}
                    style={styles.productSelectionImage}
                  />
                  <View style={styles.productSelectionInfo}>
                    <Text style={styles.productSelectionName}>{item.nome}</Text>
                    <Text style={styles.productSelectionIndustria}>{item.industria}</Text>
                    <Text style={styles.productSelectionPrice}>R$ {item.preco.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addToOrderButton}
                    onPress={() => addProductToOrder(item)}
                  >
                    <ShoppingCart size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyProducts}>
                  <Text style={styles.emptyProductsText}>Nenhum produto encontrado</Text>
                </View>
              }
            />

            {/* Produtos já selecionados */}
            {newOrder.produtos.length > 0 && (
              <View style={styles.selectedProductsPreview}>
                <Text style={styles.selectedProductsTitle}>
                  {newOrder.produtos.length} produto(s) selecionado(s)
                </Text>
                <TouchableOpacity
                  style={styles.viewSelectedButton}
                  onPress={closeProductSelection}
                >
                  <Text style={styles.viewSelectedButtonText}>Ver Pedido</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Detalhes do Pedido */}
      <Modal visible={showOrderDetailsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedOrder && (
              <ScrollView>
                <View style={styles.orderDetailsHeader}>
                  <Text style={styles.modalTitle}>Pedido #{selectedOrder.id}</Text>
                  <TouchableOpacity
                    style={styles.exportButton}
                    onPress={() => exportOrderToPDF(selectedOrder)}
                  >
                    <Download size={20} color="#fff" />
                    <Text style={styles.exportButtonText}>Exportar PDF</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.detailLabel}>Cliente:</Text>
                <Text style={styles.detailValue}>{selectedOrder.cliente}</Text>
                
                <Text style={styles.detailLabel}>Data:</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedOrder.data).toLocaleDateString('pt-BR')}
                </Text>
                
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(selectedOrder.status)}</Text>
                </View>
                
                <Text style={styles.detailLabel}>Método de Pagamento:</Text>
                <Text style={styles.detailValue}>
                  {metodoPagamentoOptions.find(m => m.value === selectedOrder.metodoPagamento)?.label}
                </Text>

                {selectedOrder.metodoPagamento === 'boleto' && selectedOrder.prazos?.length > 0 && (
                  <>
                    <Text style={styles.detailLabel}>Prazos:</Text>
                    {selectedOrder.prazos.map((prazo, index) => (
                      <Text key={index} style={styles.detailValue}>
                        {prazo.dias} dias - {prazo.porcentagem}% (R$ {((selectedOrder.total * parseFloat(prazo.porcentagem)) / 100).toFixed(2)})
                      </Text>
                    ))}
                  </>
                )}
                
                <Text style={styles.detailLabel}>Produtos:</Text>
                {selectedOrder.produtos?.map((produto, index) => (
                  <View key={index} style={styles.produtoDetail}>
                    <Text style={styles.produtoDetailName}>{produto.nome}</Text>
                    <Text style={styles.produtoDetailInfo}>
                      Qtd: {produto.quantidade} x R$ {produto.preco?.toFixed(2) || '0.00'} = R$ {(produto.quantidade * produto.preco).toFixed(2)}
                    </Text>
                  </View>
                ))}

                {selectedOrder.desconto?.valor && (
                  <>
                    <Text style={styles.detailLabel}>Desconto:</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.desconto.tipo === 'percentual' ? 
                        `${selectedOrder.desconto.valor}%` : 
                        `R$ ${selectedOrder.desconto.valor}`
                      }
                    </Text>
                  </>
                )}
                
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 5,
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
    marginBottom: 3,
  },
  pedidoPagamento: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  orderModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 10,
    maxHeight: '95%',
    width: '95%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  orderDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  // Estilos da seção de cliente
  clienteSection: {
    marginBottom: 15,
  },
  clienteSearch: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  clienteList: {
    maxHeight: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clienteOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clienteSelected: {
    backgroundColor: '#e3f2fd',
  },
  clienteOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clienteOptionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedClienteDisplay: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  selectedClienteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Estilos da seção de produtos
  produtosSection: {
    marginBottom: 15,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addProductButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  emptyProducts: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  emptyProductsText: {
    color: '#999',
    fontSize: 16,
    fontStyle: 'italic',
  },
  productsList: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  quantityButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: 'center',
  },
  productTotal: {
    alignItems: 'flex-end',
  },
  productTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  removeProductButton: {
    backgroundColor: '#ffebee',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Estilos do resumo financeiro
  resumoFinanceiro: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  resumoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 16,
    color: '#666',
  },
  resumoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  descontoValue: {
    color: '#f44336',
  },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },

  // Estilos da seção de desconto
  descontoSection: {
    marginBottom: 10,
  },
  descontoLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  descontoControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  descontoTipoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    minWidth: 80,
  },
  descontoTipoPicker: {
    height: 40,
  },
  descontoInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },

  // Estilos da seção de pagamento
  pagamentoSection: {
    marginBottom: 15,
  },
  pagamentoOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  pagamentoOption: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pagamentoSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  pagamentoOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  pagamentoSelectedText: {
    color: '#fff',
  },

  // Estilos dos prazos
  prazosSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  prazosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  prazosTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addPrazoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addPrazoText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 4,
  },
  prazoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  prazoInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    width: 60,
    textAlign: 'center',
  },
  prazoSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  removePrazoButton: {
    backgroundColor: '#ffebee',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  prazosInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },

  // Estilos das observações
  observacoesSection: {
    marginBottom: 15,
  },
  observacoesInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlignVertical: 'top',
    height: 80,
  },

  // Estilos do modal de seleção de produtos
  productSelectionModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 10,
    maxHeight: '95%',
    width: '95%',
    flex: 1,
  },
  productSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeProductsButton: {
    padding: 5,
  },
  productSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  productSearchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  industriasFilter: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  industriasFilterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  industriasOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  industriaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  industriaSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  industriaOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  industriaSelectedText: {
    color: '#fff',
  },
  industriaCheck: {
    marginLeft: 4,
  },
  productSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productSelectionImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  productSelectionInfo: {
    flex: 1,
  },
  productSelectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productSelectionIndustria: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productSelectionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  addToOrderButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedProductsPreview: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedProductsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  viewSelectedButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewSelectedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Estilos dos botões
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

  // Estilos dos detalhes do pedido
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
});

export default PedidosScreen;