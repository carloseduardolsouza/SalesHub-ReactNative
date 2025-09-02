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
import { Picker } from '@react-native-picker/picker';
import { Camera, Image as ImageIcon, Search, Plus, X, Edit3 } from 'lucide-react-native';

const ProdutosScreen = () => {
  const [produtos, setProdutos] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [industrias, setIndustrias] = useState([]);
  const [showVariacaoModal, setShowVariacaoModal] = useState(false);

  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    preco: '',
    imagem: null,
    industria: '',
    descricao: '',
    variacoes: []
  });

  const [novaVariacao, setNovaVariacao] = useState({
    tipo: 'cor', // cor ou tamanho
    valor: ''
  });

  // Carregar dados do AsyncStorage
  useEffect(() => {
    loadProdutos();
    loadIndustrias();
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

  const loadIndustrias = async () => {
    try {
      const industriasData = await AsyncStorage.getItem('industrias');
      if (industriasData) {
        const industriasList = JSON.parse(industriasData);
        setIndustrias(industriasList);
      }
    } catch (error) {
      console.error('Erro ao carregar indústrias:', error);
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
        produto.industria.toLowerCase().includes(searchText.toLowerCase())
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

  // Converter imagem para base64
  const convertImageToBase64 = (imageUri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        const reader = new FileReader();
        reader.onloadend = function() {
          resolve(reader.result);
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.open('GET', imageUri);
      xhr.responseType = 'blob';
      xhr.send();
    });
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
      includeBase64: true,
    };

    launchCamera(options, async (response) => {
      setShowImagePickerModal(false);
      
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        try {
          // Salvar a imagem como base64 para persistir nos dados
          const base64Data = `data:${asset.type};base64,${asset.base64}`;
          setNovoProduto({
            ...novoProduto,
            imagem: base64Data
          });
        } catch (error) {
          console.error('Erro ao processar imagem:', error);
          Alert.alert('Erro', 'Erro ao processar a imagem');
        }
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
      includeBase64: true,
    };

    launchImageLibrary(options, async (response) => {
      setShowImagePickerModal(false);
      
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        try {
          // Salvar a imagem como base64 para persistir nos dados
          const base64Data = `data:${asset.type};base64,${asset.base64}`;
          setNovoProduto({
            ...novoProduto,
            imagem: base64Data
          });
        } catch (error) {
          console.error('Erro ao processar imagem:', error);
          Alert.alert('Erro', 'Erro ao processar a imagem');
        }
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

  const handleMoneyInput = (value) => {
    const formatted = formatMoney(value);
    setNovoProduto({
      ...novoProduto,
      preco: formatted
    });
  };

  const parseMoneyValue = (formattedValue) => {
    return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.')) || 0;
  };

  // Adicionar variação
  const adicionarVariacao = () => {
    if (!novaVariacao.valor.trim()) {
      Alert.alert('Erro', 'Digite um valor para a variação!');
      return;
    }

    const variacaoExistente = novoProduto.variacoes.find(v => 
      v.tipo === novaVariacao.tipo && v.valor.toLowerCase() === novaVariacao.valor.toLowerCase()
    );

    if (variacaoExistente) {
      Alert.alert('Erro', 'Esta variação já foi adicionada!');
      return;
    }

    setNovoProduto({
      ...novoProduto,
      variacoes: [...novoProduto.variacoes, { ...novaVariacao }]
    });

    setNovaVariacao({ tipo: 'cor', valor: '' });
  };

  // Remover variação
  const removerVariacao = (index) => {
    const novasVariacoes = novoProduto.variacoes.filter((_, i) => i !== index);
    setNovoProduto({
      ...novoProduto,
      variacoes: novasVariacoes
    });
  };

  const salvarProduto = async () => {
    // Validações
    if (!novoProduto.nome.trim() || !novoProduto.preco || !novoProduto.industria) {
      Alert.alert('Erro', 'Nome, Preço e Indústria são obrigatórios!');
      return;
    }

    const preco = parseMoneyValue(novoProduto.preco);

    if (preco <= 0) {
      Alert.alert('Erro', 'O preço deve ser maior que zero!');
      return;
    }

    try {
      const produto = {
        id: Date.now(),
        nome: novoProduto.nome.trim(),
        preco: preco,
        imagem: novoProduto.imagem,
        industria: novoProduto.industria,
        descricao: novoProduto.descricao.trim(),
        variacoes: novoProduto.variacoes,
        dataCadastro: new Date().toISOString()
      };

      const novosProdutos = [produto, ...produtos];
      await saveProdutos(novosProdutos);

      // Limpar formulário
      setNovoProduto({
        nome: '',
        preco: '',
        imagem: null,
        industria: '',
        descricao: '',
        variacoes: []
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
        <Text style={styles.productCompany} numberOfLines={1}>{item.industria}</Text>
        <Text style={styles.productPrice}>R$ {item.preco.toFixed(2)}</Text>
        {item.variacoes.length > 0 && (
          <Text style={styles.productVariations}>
            {item.variacoes.length} variação{item.variacoes.length > 1 ? 'ões' : ''}
          </Text>
        )}
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
          placeholder="Pesquisar produto ou indústria..."
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
                  <Text style={styles.productDetailCompany}>{selectedProduct.industria}</Text>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Preço:</Text>
                    <Text style={styles.priceValue}>R$ {selectedProduct.preco.toFixed(2)}</Text>
                  </View>

                  {selectedProduct.descricao && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>Descrição:</Text>
                      <Text style={styles.descriptionValue}>{selectedProduct.descricao}</Text>
                    </View>
                  )}

                  {selectedProduct.variacoes && selectedProduct.variacoes.length > 0 && (
                    <View style={styles.variationsContainer}>
                      <Text style={styles.variationsLabel}>Variações:</Text>
                      {selectedProduct.variacoes.map((variacao, index) => (
                        <View key={index} style={styles.variationItem}>
                          <Text style={styles.variationType}>
                            {variacao.tipo === 'cor' ? 'Cor' : 'Tamanho'}:
                          </Text>
                          <Text style={styles.variationValue}>{variacao.valor}</Text>
                        </View>
                      ))}
                    </View>
                  )}

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
                  <Image source={{ uri: novoProduto.imagem }} style={styles.selectedImage} />
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
              
              <Text style={styles.inputLabel}>Preço *</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                value={novoProduto.preco}
                onChangeText={handleMoneyInput}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Indústria *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={novoProduto.industria}
                  onValueChange={(value) => setNovoProduto({...novoProduto, industria: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione uma indústria" value="" />
                  {industrias.map(industria => (
                    <Picker.Item 
                      key={industria.id} 
                      label={industria.nome} 
                      value={industria.nome} 
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descrição do produto (opcional)"
                value={novoProduto.descricao}
                onChangeText={(text) => setNovoProduto({...novoProduto, descricao: text})}
                multiline
                numberOfLines={3}
              />

              {/* Variações Section */}
              <Text style={styles.inputLabel}>Variações (Cores/Tamanhos)</Text>
              
              <View style={styles.variationInputContainer}>
                <View style={styles.variationTypeContainer}>
                  <Picker
                    selectedValue={novaVariacao.tipo}
                    onValueChange={(value) => setNovaVariacao({...novaVariacao, tipo: value})}
                    style={styles.variationTypePicker}
                  >
                    <Picker.Item label="Cor" value="cor" />
                    <Picker.Item label="Tamanho" value="tamanho" />
                  </Picker>
                </View>
                
                <TextInput
                  style={[styles.input, styles.variationInput]}
                  placeholder={novaVariacao.tipo === 'cor' ? 'Ex: Azul, Vermelho' : 'Ex: P, M, G'}
                  value={novaVariacao.valor}
                  onChangeText={(text) => setNovaVariacao({...novaVariacao, valor: text})}
                />
                
                <TouchableOpacity style={styles.addVariationButton} onPress={adicionarVariacao}>
                  <Plus size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Lista de variações adicionadas */}
              {novoProduto.variacoes.length > 0 && (
                <View style={styles.addedVariationsContainer}>
                  <Text style={styles.addedVariationsTitle}>Variações Adicionadas:</Text>
                  {novoProduto.variacoes.map((variacao, index) => (
                    <View key={index} style={styles.addedVariationItem}>
                      <Text style={styles.addedVariationText}>
                        {variacao.tipo === 'cor' ? 'Cor' : 'Tamanho'}: {variacao.valor}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeVariationButton}
                        onPress={() => removerVariacao(index)}
                      >
                        <X size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              
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