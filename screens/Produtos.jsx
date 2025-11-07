import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Picker } from '@react-native-picker/picker';
import { Camera, Image as ImageIcon, Search, Plus, X, Edit, ChevronLeft, ChevronRight } from 'lucide-react-native';

// Componente de Card de Produto Memoizado
const ProductCard = React.memo(({ item, onPress }) => {
  const imagemPrincipal = item.imagens?.[0] || 'https://via.placeholder.com/150x150/666666/white?text=Sem+Imagem';
  
  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardImageContainer}>
        <Image
          source={{ uri: imagemPrincipal }}
          style={styles.productImage}
          resizeMode="cover"
        />
        {item.imagens?.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountText}>+{item.imagens.length - 1}</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.nome}</Text>
        <Text style={styles.productCompany} numberOfLines={1}>{item.industria}</Text>
        <Text style={styles.productPrice}>R$ {item.preco.toFixed(2)}</Text>
        {item.variacoes?.length > 0 && (
          <Text style={styles.productVariations}>
            {item.variacoes.length} variação{item.variacoes.length > 1 ? 'ões' : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => prevProps.item.id === nextProps.item.id);

const ProdutosScreen = () => {
  const [produtos, setProdutos] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [industrias, setIndustrias] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    preco: '',
    imagens: [],
    industria: '',
    descricao: '',
    variacoes: []
  });

  const [novaVariacao, setNovaVariacao] = useState({
    tipo: 'cor',
    valor: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Carregar dados em paralelo
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [produtosData, industriasData] = await Promise.all([
        AsyncStorage.getItem('produtos'),
        AsyncStorage.getItem('industrias')
      ]);

      if (produtosData) {
        const produtosParsed = JSON.parse(produtosData);
        const produtosMigrados = produtosParsed.map(p => ({
          ...p,
          imagens: p.imagens || (p.imagem ? [p.imagem] : [])
        }));
        setProdutos(produtosMigrados);
      }

      if (industriasData) {
        setIndustrias(JSON.parse(industriasData));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrar produtos de forma otimizada com useMemo
  const filteredProducts = useMemo(() => {
    if (!searchText.trim()) return produtos;
    
    const q = searchText.toLowerCase();
    return produtos.filter(produto =>
      produto.nome.toLowerCase().includes(q) ||
      produto.industria.toLowerCase().includes(q)
    );
  }, [produtos, searchText]);

  // Função otimizada para comprimir imagem (mais agressiva)
  const compressImage = useCallback(async (uri) => {
    try {
      // Redimensionar para 600px mantendo proporção + compressão 50%
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 600 } }],
        { 
          compress: 0.5, // Compressão de 50%
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );

      return `data:image/jpeg;base64,${manipulatedImage.base64}`;
    } catch (error) {
      console.error('Erro ao comprimir imagem:', error);
      throw error;
    }
  }, []);

  const saveProdutos = useCallback(async (produtosData) => {
    try {
      // Verificar tamanho antes de salvar
      const jsonString = JSON.stringify(produtosData);
      const sizeKB = (jsonString.length * 2) / 1024;
      
      if (sizeKB > 5000) {
        throw new Error('Dados muito grandes!');
      }

      await AsyncStorage.setItem('produtos', jsonString);
      setProdutos(produtosData);
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
      
      if (error.message.includes('Row too big') || error.message.includes('muito grandes')) {
        Alert.alert(
          'Limite Excedido',
          'Você atingiu o limite de armazenamento. Reduza o número de imagens (máx. 2 por produto) ou delete produtos antigos.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erro', 'Erro ao salvar produto');
      }
      throw error;
    }
  }, []);

  const openCamera = useCallback(async () => {
    setShowImagePickerModal(false);

    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Permissão Negada', 'Precisamos da permissão para acessar a câmera.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.4,
      });

      if (!result.canceled && result.assets?.[0]) {
        const compressedImage = await compressImage(result.assets[0].uri);
        setNovoProduto(prev => ({ 
          ...prev, 
          imagens: [...prev.imagens, compressedImage] 
        }));
        Alert.alert('✅', 'Imagem adicionada!');
      }
    } catch (error) {
      console.error('Erro ao usar câmera:', error);
      Alert.alert('Erro', 'Erro ao usar câmera');
    }
  }, [compressImage]);

  const openGallery = useCallback(async () => {
    setShowImagePickerModal(false);

    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permissão Negada', 'Precisamos da permissão para acessar a galeria.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.4,
      });

      if (!result.canceled && result.assets?.[0]) {
        const compressedImage = await compressImage(result.assets[0].uri);
        setNovoProduto(prev => ({ 
          ...prev, 
          imagens: [...prev.imagens, compressedImage] 
        }));
        Alert.alert('✅', 'Imagem adicionada!');
      }
    } catch (error) {
      console.error('Erro ao usar galeria:', error);
      Alert.alert('Erro', 'Erro ao acessar galeria');
    }
  }, [compressImage]);

  const removeImage = useCallback((index) => {
    Alert.alert(
      'Remover Imagem',
      'Deseja remover esta imagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => setNovoProduto(prev => ({
            ...prev,
            imagens: prev.imagens.filter((_, i) => i !== index)
          }))
        }
      ]
    );
  }, []);

  const formatMoney = useCallback((value) => {
    if (!value) return '';
    const numericValue = String(value).replace(/[^\d]/g, '');
    if (!numericValue) return '';
    if (numericValue.length > 15) return formatMoney(numericValue.slice(0, 15));
    
    const numberValue = parseFloat(numericValue) / 100;
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const handleMoneyInput = useCallback((value) => {
    setNovoProduto(prev => ({ ...prev, preco: formatMoney(value) }));
  }, [formatMoney]);

  const parseMoneyValue = useCallback((formattedValue) => {
    if (!formattedValue) return 0;
    const parsed = parseFloat(String(formattedValue).replace(/\./g, '').replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const adicionarVariacao = useCallback(() => {
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
  }, [novaVariacao, novoProduto.variacoes]);

  const removerVariacao = useCallback((index) => {
    setNovoProduto(prev => ({
      ...prev,
      variacoes: prev.variacoes.filter((_, i) => i !== index)
    }));
  }, []);

  const openEditMode = useCallback((produto) => {
    setIsEditMode(true);
    setNovoProduto({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco.toFixed(2).replace('.', ','),
      imagens: produto.imagens || [],
      industria: produto.industria,
      descricao: produto.descricao || '',
      variacoes: produto.variacoes || []
    });
    setShowProductModal(false);
    setShowAddProductModal(true);
  }, []);

  const salvarProduto = useCallback(async () => {
    if (!novoProduto.nome.trim() || !novoProduto.preco || !novoProduto.industria) {
      Alert.alert('Erro', 'Nome, Preço e Indústria são obrigatórios!');
      return;
    }

    // LIMITE REDUZIDO: máximo 2 imagens
    if (novoProduto.imagens.length > 2) {
      Alert.alert('Atenção', 'Máximo de 2 imagens por produto para melhor performance.');
      return;
    }

    const preco = parseMoneyValue(novoProduto.preco);

    if (preco <= 0) {
      Alert.alert('Erro', 'O preço deve ser maior que zero!');
      return;
    }

    try {
      if (isEditMode) {
        const produtosAtualizados = produtos.map(p =>
          p.id === novoProduto.id
            ? {
                ...p,
                nome: novoProduto.nome.trim(),
                preco,
                imagens: novoProduto.imagens,
                industria: novoProduto.industria,
                descricao: novoProduto.descricao.trim(),
                variacoes: novoProduto.variacoes,
                dataAtualizacao: new Date().toISOString()
              }
            : p
        );
        
        await saveProdutos(produtosAtualizados);
        Alert.alert('Sucesso', 'Produto atualizado!');
      } else {
        const produto = {
          id: Date.now(),
          nome: novoProduto.nome.trim(),
          preco,
          imagens: novoProduto.imagens,
          industria: novoProduto.industria,
          descricao: novoProduto.descricao.trim(),
          variacoes: novoProduto.variacoes,
          dataCadastro: new Date().toISOString()
        };

        const novosProdutos = [produto, ...produtos];
        await saveProdutos(novosProdutos);
        Alert.alert('Sucesso', 'Produto cadastrado!');
      }

      setNovoProduto({
        nome: '',
        preco: '',
        imagens: [],
        industria: '',
        descricao: '',
        variacoes: []
      });
      setIsEditMode(false);
      setShowAddProductModal(false);
      
    } catch (error) {
      // Erro já tratado em saveProdutos
    }
  }, [novoProduto, produtos, isEditMode, parseMoneyValue, saveProdutos]);

  const deleteProduto = useCallback((produtoId) => {
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
              Alert.alert('Sucesso', 'Produto excluído!');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir produto');
            }
          }
        }
      ]
    );
  }, [produtos, saveProdutos]);

  const nextImage = useCallback(() => {
    if (selectedProduct?.imagens) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedProduct.imagens.length);
    }
  }, [selectedProduct]);

  const prevImage = useCallback(() => {
    if (selectedProduct?.imagens) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedProduct.imagens.length - 1 : prev - 1
      );
    }
  }, [selectedProduct]);

  const renderProductCard = useCallback(({ item }) => (
    <ProductCard
      item={item}
      onPress={() => {
        setSelectedProduct(item);
        setCurrentImageIndex(0);
        setShowProductModal(true);
      }}
    />
  ), []);

  // Otimização de keyExtractor
  const keyExtractor = useCallback((item) => String(item.id), []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produtos</Text>
        <Text style={styles.headerSubtitle}>Total: {produtos.length} produtos</Text>
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
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={6}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhum produto encontrado</Text>
          </View>
        }
      />

      {/* Modal de Detalhes */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.productModalContainer}>
            <ScrollView>
              {selectedProduct && (
                <>
                  {selectedProduct.imagens?.length > 0 ? (
                    <View style={styles.imageGallery}>
                      <Image
                        source={{ uri: selectedProduct.imagens[currentImageIndex] }}
                        style={styles.productDetailImage}
                        resizeMode="cover"
                      />
                      {selectedProduct.imagens.length > 1 && (
                        <>
                          <TouchableOpacity style={styles.navButtonLeft} onPress={prevImage}>
                            <ChevronLeft size={30} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.navButtonRight} onPress={nextImage}>
                            <ChevronRight size={30} color="#fff" />
                          </TouchableOpacity>
                          <View style={styles.imageIndicator}>
                            <Text style={styles.imageIndicatorText}>
                              {currentImageIndex + 1} / {selectedProduct.imagens.length}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  ) : (
                    <Image
                      source={{ uri: 'https://via.placeholder.com/200x200/666666/white?text=Sem+Imagem' }}
                      style={styles.productDetailImage}
                      resizeMode="cover"
                    />
                  )}

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

                  {selectedProduct.variacoes?.length > 0 && (
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

      {/* Modal de Adicionar/Editar */}
      <Modal visible={showAddProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addProductModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </Text>

              <Text style={styles.inputLabel}>
                Imagens do Produto ({novoProduto.imagens.length}/2)
              </Text>
              <Text style={styles.imageHint}>
                💡 Máximo 2 imagens (otimizadas automaticamente)
              </Text>
              
              {novoProduto.imagens.length > 0 && (
                <ScrollView horizontal style={styles.imagesGrid} showsHorizontalScrollIndicator={false}>
                  {novoProduto.imagens.map((img, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                      <Image source={{ uri: img }} style={styles.imagePreview} resizeMode="cover" />
                      <TouchableOpacity 
                        style={styles.removeImageButtonSmall} 
                        onPress={() => removeImage(index)}
                      >
                        <X size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {novoProduto.imagens.length < 2 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => setShowImagePickerModal(true)}
                >
                  <ImageIcon size={24} color="#007AFF" />
                  <Text style={styles.addImageButtonText}>Adicionar Imagem</Text>
                </TouchableOpacity>
              )}

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
                  placeholder={novaVariacao.tipo === 'cor' ? 'Ex: Azul' : 'Ex: M'}
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
                  <Text style={styles.addedVariationsTitle}>Variações:</Text>
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
                      imagens: [],
                      industria: '',
                      descricao: '',
                      variacoes: []
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={salvarProduto}>
                  <Text style={styles.saveButtonText}>
                    {isEditMode ? 'Atualizar' : 'Salvar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Imagem */}
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

// Estilos (mesmos do original, sem mudanças)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
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
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 8,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 0,
  },
  cardImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  imageCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  imageGallery: {
    position: 'relative',
    marginBottom: 15,
  },
  productDetailImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  navButtonLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  imageIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  imageHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
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
  imagesGrid: {
    marginBottom: 10,
    maxHeight: 120,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButtonSmall: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#f44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    padding: 15,
    marginBottom: 15,
  },
  addImageButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
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
  },
  closeButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProdutosScreen;