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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Camera, Image as ImageIcon, Search, Plus, X, Edit } from 'lucide-react-native';

const ProdutosScreen = () => {
  const [produtos, setProdutos] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [industrias, setIndustrias] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    preco: '',
    imagem: null,
    industria: '',
    descricao: '',
    variacoes: []
  });

  const [novaVariacao, setNovaVariacao] = useState({
    tipo: 'cor',
    valor: ''
  });

  useEffect(() => {
    loadProdutos();
    loadIndustrias();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchText, produtos]);

  const loadProdutos = async () => {
    try {
      const produtosData = await AsyncStorage.getItem('produtos');
      if (produtosData) {
        const produtosParsed = JSON.parse(produtosData);
        setProdutos(produtosParsed);
        setFilteredProducts(produtosParsed);
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
    let filtered = produtos.slice();

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(produto =>
        (produto.nome || '').toLowerCase().includes(q) ||
        (produto.industria || '').toLowerCase().includes(q)
      );
    }

    setFilteredProducts(filtered);
  };

  const openCamera = async () => {
    setShowImagePickerModal(false);

    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permissão Negada',
        'Precisamos da sua permissão para acessar a câmera e tirar fotos.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
        setNovoProduto(prev => ({ ...prev, imagem: base64Data }));
      }
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar usar a câmera.');
    }
  };

  const openGallery = async () => {
    setShowImagePickerModal(false);

    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permissão Negada',
        'Precisamos da sua permissão para acessar a galeria de imagens.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
        setNovoProduto(prev => ({ ...prev, imagem: base64Data }));
      }
    } catch (error) {
      console.error('Erro ao acessar a galeria:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar acessar a galeria.');
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remover Imagem',
      'Deseja remover a imagem selecionada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => setNovoProduto(prev => ({ ...prev, imagem: null }))
        }
      ]
    );
  };

  const formatMoney = (value) => {
    if (!value) return '';

    const numericValue = String(value).replace(/[^\d]/g, '');
    if (numericValue.length === 0) return '';

    if (numericValue.length > 15) return formatMoney(numericValue.slice(0, 15));

    const numberValue = parseFloat(numericValue) / 100;
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleMoneyInput = (value) => {
    const formatted = formatMoney(value);
    setNovoProduto(prev => ({ ...prev, preco: formatted }));
  };

  const parseMoneyValue = (formattedValue) => {
    if (!formattedValue) return 0;
    const onlyNumbers = String(formattedValue).replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(onlyNumbers);
    return isNaN(parsed) ? 0 : parsed;
  };

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

    setNovoProduto(prev => ({
      ...prev,
      variacoes: [...prev.variacoes, { ...novaVariacao }]
    }));

    setNovaVariacao({ tipo: 'cor', valor: '' });
  };

  const removerVariacao = (index) => {
    setNovoProduto(prev => {
      const novas = prev.variacoes.filter((_, i) => i !== index);
      return { ...prev, variacoes: novas };
    });
  };

  const openEditMode = (produto) => {
    setIsEditMode(true);
    setNovoProduto({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco.toFixed(2).replace('.', ','),
      imagem: produto.imagem,
      industria: produto.industria,
      descricao: produto.descricao || '',
      variacoes: produto.variacoes || []
    });
    setShowProductModal(false);
    setShowAddProductModal(true);
  };

  const salvarProduto = async () => {
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
      if (isEditMode) {
        // Atualizar produto existente
        const produtosAtualizados = produtos.map(p =>
          p.id === novoProduto.id
            ? {
                ...p,
                nome: novoProduto.nome.trim(),
                preco: preco,
                imagem: novoProduto.imagem,
                industria: novoProduto.industria,
                descricao: novoProduto.descricao.trim(),
                variacoes: novoProduto.variacoes,
                dataAtualizacao: new Date().toISOString()
              }
            : p
        );
        await saveProdutos(produtosAtualizados);
        Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
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
        Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
      }

      // Limpar formulário
      setNovoProduto({
        nome: '',
        preco: '',
        imagem: null,
        industria: '',
        descricao: '',
        variacoes: []
      });
      setIsEditMode(false);
      setShowAddProductModal(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      Alert.alert('Erro', 'Erro ao salvar produto');
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
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri: item.imagem || 'https://via.placeholder.com/150x150/666666/white?text=Sem+Imagem'
        }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.nome}</Text>
        <Text style={styles.productCompany} numberOfLines={1}>{item.industria}</Text>
        <Text style={styles.productPrice}>R$ {item.preco.toFixed(2)}</Text>
        {item.variacoes && item.variacoes.length > 0 && (
          <Text style={styles.productVariations}>
            {item.variacoes.length} variação{item.variacoes.length > 1 ? 'ões' : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produtos</Text>
      </View>

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

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setIsEditMode(false);
          setShowAddProductModal(true);
        }}
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.addButtonText}>Cadastrar Produto</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={item => String(item.id)}
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
                    resizeMode="cover"
                  />
                  <Text style={styles.productDetailName}>{selectedProduct.nome}</Text>
                  <Text style={styles.productDetailCompany}>{selectedProduct.industria}</Text>

                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Preço:</Text>
                    <Text style={styles.priceValue}>R$ {selectedProduct.preco.toFixed(2)}</Text>
                  </View>

                  {selectedProduct.descricao ? (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>Descrição:</Text>
                      <Text style={styles.descriptionValue}>{selectedProduct.descricao}</Text>
                    </View>
                  ) : null}

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

                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditMode(selectedProduct)}
                    >
                      <Edit size={16} color="#fff" />
                      <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteProduto(selectedProduct.id)}
                    >
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.closeButtonFull}
                    onPress={() => setShowProductModal(false)}
                  >
                    <Text style={styles.closeButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Product Modal */}
      <Modal visible={showAddProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addProductModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </Text>

              <Text style={styles.inputLabel}>Imagem do Produto</Text>
              <TouchableOpacity
                style={styles.imageSelector}
                onPress={() => setShowImagePickerModal(true)}
                activeOpacity={0.8}
              >
                {novoProduto.imagem ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: novoProduto.imagem }} style={styles.selectedImage} resizeMode="cover" />
                    <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
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
                onChangeText={(text) => setNovoProduto(prev => ({ ...prev, nome: text }))}
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Preço *</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                value={novoProduto.preco}
                onChangeText={handleMoneyInput}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Indústria *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={novoProduto.industria}
                  onValueChange={(value) => setNovoProduto(prev => ({ ...prev, industria: value }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione uma indústria" value="" />
                  {industrias.map(industria => (
                    <Picker.Item
                      key={industria.id ?? industria.nome}
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
                onChangeText={(text) => setNovoProduto(prev => ({ ...prev, descricao: text }))}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Variações (Cores/Tamanhos)</Text>

              <View style={styles.variationInputContainer}>
                <View style={styles.variationTypeContainer}>
                  <Picker
                    selectedValue={novaVariacao.tipo}
                    onValueChange={(value) => setNovaVariacao(prev => ({ ...prev, tipo: value }))}
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
                  onChangeText={(text) => setNovaVariacao(prev => ({ ...prev, valor: text }))}
                  placeholderTextColor="#999"
                />

                <TouchableOpacity style={styles.addVariationButton} onPress={adicionarVariacao}>
                  <Plus size={20} color="#fff" />
                </TouchableOpacity>
              </View>

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

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddProductModal(false);
                    setIsEditMode(false);
                    setNovoProduto({
                      nome: '',
                      preco: '',
                      imagem: null,
                      industria: '',
                      descricao: '',
                      variacoes: []
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={salvarProduto}
                >
                  <Text style={styles.saveButtonText}>
                    {isEditMode ? 'Atualizar' : 'Salvar'}
                  </Text>
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  productsList: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 8,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minWidth: 0,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
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
  productVariations: {
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
    backgroundColor: '#f0f0f0',
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
  priceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  descriptionContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  variationsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  variationsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  variationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  variationType: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginRight: 8,
    minWidth: 60,
  },
  variationValue: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
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
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f44336',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  picker: {
    height: 50,
    color: '#333',
  },
  variationInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  variationTypeContainer: {
    flex: 0.3,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  variationTypePicker: {
    height: 50,
    color: '#333',
  },
  variationInput: {
    flex: 1,
    marginBottom: 0,
    marginLeft: 8,
    marginRight: 8,
  },
  addVariationButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  addedVariationsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  addedVariationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  addedVariationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addedVariationText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  removeVariationButton: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginRight: 8,
    elevation: 2,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    marginLeft: 8,
    elevation: 3,
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    marginRight: 8,
    elevation: 3,
  },
  editButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 15,
    marginLeft: 8,
    elevation: 3,
  },
  deleteButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButtonFull: {
    backgroundColor: '#666',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    elevation: 3,
  },
  closeButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProdutosScreen;