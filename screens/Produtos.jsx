import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { Camera, Image as ImageIcon, Search, Filter, Plus } from 'lucide-react-native';

const ProdutosScreen = () => {
  const [produtos, setProdutos] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);

  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    valor: '',
    precoVenda: '',
    imagem: null,
    empresaResponsavel: ''
  });

  // Carregar dados do AsyncStorage
  useEffect(() => {
    loadProdutos();
    loadEmpresas();
  }, []);

  // Filtrar produtos quando houver mudanças
  useEffect(() => {
    filterProducts();
  }, [searchText, produtos]);

  const loadProdutos = async () => {
    try {
      const produtosData = await AsyncStorage.getItem('produtos');
      if (produtosData) {
        const produtos = JSON.parse(produtosData);
        setProdutos(produtos);
        setFilteredProducts(produtos);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      Alert.alert('Erro', 'Erro ao carregar dados dos produtos');
    }
  };

  const loadEmpresas = async () => {
    try {
      const clientesData = await AsyncStorage.getItem('clientes');
      if (clientesData) {
        const clientes = JSON.parse(clientesData);
        const empresasList = clientes.map(cliente => ({
          id: cliente.id,
          nome: cliente.nomeFantasia || cliente.razaoSocial
        }));
        setEmpresas(empresasList);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const saveProdutos = async (produtosData) => {
    try {
      await AsyncStorage.setItem('produtos', JSON.stringify(produtosData));
      setProdutos(produtosData);
      setFilteredProducts(produtosData);
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
      Alert.alert('Erro', 'Erro ao salvar dados dos produtos');
    }
  };

  const filterProducts = () => {
    let filtered = produtos;

    if (searchText) {
      filtered = filtered.filter(produto =>
        produto.nome.toLowerCase().includes(searchText.toLowerCase()) ||
        produto.empresaResponsavel.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  // Solicitar permissões da câmera (Android)
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permissão de Câmera',
            message: 'Este app precisa de acesso à câmera para tirar fotos dos produtos.',
            buttonNeutral: 'Perguntar Depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Abrir câmera
  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    
    if (!hasPermission) {
      Alert.alert('Permissão Negada', 'Permissão de câmera é necessária para tirar fotos.');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 600,
    };

    launchCamera(options, (response) => {
      setShowImagePickerModal(false);
      
      if (response.didCancel) {
        return;
      }

      if (response.error) {
        Alert.alert('Erro', 'Erro ao tirar foto: ' + response.error);
        return;
      }

      if (response.assets && response.assets[0]) {
        setNovoProduto({
          ...novoProduto,
          imagem: response.assets[0]
        });
      }
    });
  };

  // Abrir galeria
  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 600,
    };

    launchImageLibrary(options, (response) => {
      setShowImagePickerModal(false);
      
      if (response.didCancel) {
        return;
      }

      if (response.error) {
        Alert.alert('Erro', 'Erro ao selecionar imagem: ' + response.error);
        return;
      }

      if (response.assets && response.assets[0]) {
        setNovoProduto({
          ...novoProduto,
          imagem: response.assets[0]
        });
      }
    });
  };

  // Formatar valor monetário
  const formatMoney = (value) => {
    // Remove tudo que não é número
    const numericValue = value.replace(/[^\d]/g, '');
    
    // Converte para número e divide por 100 para ter centavos
    const numberValue = parseFloat(numericValue) / 100;
    
    // Formata como moeda brasileira
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleMoneyInput = (value, field) => {
    const formatted = formatMoney(value);
    setNovoProduto({
      ...novoProduto,
      [field]: formatted
    });
  };

  const parseMoneyValue = (formattedValue) => {
    return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const salvarProduto = async () => {
    // Validações
    if (!novoProduto.nome || !novoProduto.valor || !novoProduto.precoVenda) {
      Alert.alert('Erro', 'Nome, Valor e Preço de Venda são obrigatórios!');
      return;
    }

    if (!novoProduto.empresaResponsavel) {
      Alert.alert('Erro', 'Selecione uma empresa responsável!');
      return;
    }

    const valor = parseMoneyValue(novoProduto.valor);
    const precoVenda = parseMoneyValue(novoProduto.precoVenda);

    if (precoVenda <= valor) {
      Alert.alert('Atenção', 'O preço de venda deve ser maior que o valor de custo!');
    }

    try {
      const produto = {
        id: Date.now(),
        nome: novoProduto.nome,
        valor: valor,
        precoVenda: precoVenda,
        imagem: novoProduto.imagem ? novoProduto.imagem.uri : null,
        empresaResponsavel: novoProduto.empresaResponsavel,
        dataCadastro: new Date().toISOString(),
        margem: ((precoVenda - valor) / valor * 100).toFixed(2)
      };

      const novosProdutos = [produto, ...produtos];
      await saveProdutos(novosProdutos);

      // Limpar formulário
      setNovoProduto({
        nome: '',
        valor: '',
        precoVenda: '',
        imagem: null,
        empresaResponsavel: ''
      });

      setShowAddProductModal(false);
      Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      Alert.alert('Erro', 'Erro ao cadastrar produto');
    }
  };

  const deleteProduto = (produtoId) => {
    Alert.alert(
      'Excluir Produto',
      'Tem certeza que deseja excluir este produto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const produtosAtualizados = produtos.filter(p => p.id !== produtoId);
              await saveProdutos(produtosAtualizados);
              setShowProductModal(false);
              Alert.alert('Sucesso', 'Produto excluído com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir produto');
            }
          }
        }
      ]
    );
  };

  const renderProductCard = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        setSelectedProduct(item);
        setShowProductModal(true);
      }}
    >
      <Image 
        source={{ 
          uri: item.imagem || 'https://via.placeholder.com/150x150/666666/white?text=Sem+Imagem' 
        }} 
        style={styles.productImage} 
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.nome}</Text>
        <Text style={styles.productCompany} numberOfLines={1}>{item.empresaResponsavel}</Text>
        <Text style={styles.productPrice}>R$ {item.precoVenda.toFixed(2)}</Text>
        <Text style={styles.productMargin}>Margem: {item.margem}%</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produtos</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar produto ou empresa..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddProductModal(true)}
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.addButtonText}>Cadastrar Produto</Text>
      </TouchableOpacity>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhum produto encontrado</Text>
          </View>
        }
      />

      {/* Product Details Modal */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.productModalContainer}>
            <ScrollView>
              {selectedProduct && (
                <>
                  <Image
                    source={{ 
                      uri: selectedProduct.imagem || 'https://via.placeholder.com/200x200/666666/white?text=Sem+Imagem' 
                    }}
                    style={styles.productDetailImage}
                  />
                  <Text style={styles.productDetailName}>{selectedProduct.nome}</Text>
                  <Text style={styles.productDetailCompany}>{selectedProduct.empresaResponsavel}</Text>
                  
                  <View style={styles.priceContainer}>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Valor de Custo:</Text>
                      <Text style={styles.priceValue}>R$ {selectedProduct.valor.toFixed(2)}</Text>
                    </View>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Preço de Venda:</Text>
                      <Text style={styles.priceValueSale}>R$ {selectedProduct.precoVenda.toFixed(2)}</Text>
                    </View>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Margem de Lucro:</Text>
                      <Text style={styles.marginValue}>{selectedProduct.margem}%</Text>
                    </View>
                  </View>

                  <Text style={styles.dateText}>
                    Cadastrado em: {new Date(selectedProduct.dataCadastro).toLocaleDateString('pt-BR')}
                  </Text>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteProduto(selectedProduct.id)}
                    >
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setShowProductModal(false)}
                    >
                      <Text style={styles.closeButtonText}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Product Modal */}
      <Modal visible={showAddProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addProductModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Cadastrar Novo Produto</Text>
              
              {/* Image Section */}
              <Text style={styles.inputLabel}>Imagem do Produto</Text>
              <TouchableOpacity
                style={styles.imageSelector}
                onPress={() => setShowImagePickerModal(true)}
              >
                {novoProduto.imagem ? (
                  <Image source={{ uri: novoProduto.imagem.uri }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <ImageIcon size={40} color="#999" />
                    <Text style={styles.imagePlaceholderText}>Toque para adicionar foto</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>Nome do Produto *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o nome do produto"
                value={novoProduto.nome}
                onChangeText={(text) => setNovoProduto({...novoProduto, nome: text})}
              />
              
              <Text style={styles.inputLabel}>Valor de Custo *</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                value={novoProduto.valor}
                onChangeText={(text) => handleMoneyInput(text, 'valor')}
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Preço de Venda *</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                value={novoProduto.precoVenda}
                onChangeText={(text) => handleMoneyInput(text, 'precoVenda')}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Empresa Responsável *</Text>
              <TouchableOpacity
                style={styles.empresaSelector}
                onPress={() => setShowEmpresaModal(true)}
              >
                <Text style={[styles.empresaSelectorText, !novoProduto.empresaResponsavel && styles.placeholder]}>
                  {novoProduto.empresaResponsavel || 'Selecione uma empresa'}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddProductModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={salvarProduto}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal visible={showImagePickerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerModal}>
            <Text style={styles.modalTitle}>Selecionar Imagem</Text>
            
            <TouchableOpacity style={styles.imagePickerOption} onPress={openCamera}>
              <Camera size={24} color="#007AFF" />
              <Text style={styles.imagePickerText}>Tirar Foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imagePickerOption} onPress={openGallery}>
              <ImageIcon size={24} color="#007AFF" />
              <Text style={styles.imagePickerText}>Escolher da Galeria</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Empresa Selector Modal */}
      <Modal visible={showEmpresaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.empresaModalContainer}>
            <Text style={styles.modalTitle}>Selecionar Empresa</Text>
            
            <ScrollView style={styles.empresaList}>
              {empresas.map(empresa => (
                <TouchableOpacity
                  key={empresa.id}
                  style={styles.empresaOption}
                  onPress={() => {
                    setNovoProduto({...novoProduto, empresaResponsavel: empresa.nome});
                    setShowEmpresaModal(false);
                  }}
                >
                  <Text style={styles.empresaOptionText}>{empresa.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEmpresaModal(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
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
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 15,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  productsList: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 5,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  productInfo: {
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  productCompany: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  productMargin: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
  },
  productDetailImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 15,
  },
  productDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  productDetailCompany: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  priceContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  priceValueSale: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  marginValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  addProductModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    maxHeight: '95%',
    width: '95%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  imageSelector: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    height: 150,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
  empresaSelector: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  empresaSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  imagePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  imagePickerText: {
    fontSize: 18,
    color: '#333',
    marginLeft: 15,
  },
  empresaModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    maxHeight: '70%',
    width: '90%',
  },
  empresaList: {
    maxHeight: 300,
  },
  empresaOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  empresaOptionText: {
    fontSize: 16,
    color: '#333',
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
  deleteButton: {
    flex: 1,
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 15,
  },
  deleteButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
  },
  closeButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProdutosScreen;