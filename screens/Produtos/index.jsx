import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Camera, Image as ImageIcon, Plus, Edit } from 'lucide-react-native';

import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../components/SearchBar';
import { ImageGallery } from '../components/ImageGallery';
import { ProductInfo } from '../components/ProductInfo';
import { ImagePickerComponent } from '../components/ImagePicker';
import { VariationManager } from '../components/VariationManager';
import { useProductForm } from '../hooks/useProductForm';
import { useImageHandler } from '../hooks/useImageHandler';

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const {
    formData: novoProduto,
    novaVariacao,
    setFormData: setNovoProduto,
    setNovaVariacao,
    updateField,
    handleMoneyInput,
    parseMoneyValue,
    adicionarVariacao,
    removerVariacao,
    resetForm
  } = useProductForm();

  const { openCamera, openGallery } = useImageHandler();

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
        const produtosMigrados = produtosParsed.map(p => ({
          ...p,
          imagens: p.imagens || (p.imagem ? [p.imagem] : [])
        }));
        setProdutos(produtosMigrados);
        setFilteredProducts(produtosMigrados);
      } else {
        setProdutos([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      Alert.alert('Erro', 'Erro ao carregar dados dos produtos');
    }
  };

  const loadIndustrias = async () => {
    try {
      const industriasData = await AsyncStorage.getItem('industrias');
      if (industriasData) {
        setIndustrias(JSON.parse(industriasData));
      }
    } catch (error) {
      console.error('Erro ao carregar indústrias:', error);
    }
  };

  const saveProdutos = async (produtosData) => {
    try {
      const jsonString = JSON.stringify(produtosData);
      const sizeKB = (jsonString.length * 2) / 1024;
      
      if (sizeKB > 5000) {
        throw new Error('Dados muito grandes! Reduza o número de imagens ou produtos.');
      }

      await AsyncStorage.setItem('produtos', jsonString);
      setProdutos(produtosData);
      setFilteredProducts(produtosData);
    } catch (error) {
      console.error('❌ Erro ao salvar produtos:', error);
      if (error.message.includes('Row too big')) {
        Alert.alert(
          'Dados Muito Grandes',
          'As imagens são muito pesadas. Por favor:\n\n' +
          '• Use menos imagens por produto (máx. 3)\n' +
          '• As imagens já são comprimidas automaticamente\n' +
          '• Considere deletar produtos antigos se necessário',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erro', 'Erro ao salvar dados dos produtos. Por favor, tente novamente.');
      }
      throw error;
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

  const openEditMode = (produto) => {
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
  };

  const salvarProduto = async () => {
    if (!novoProduto.nome.trim() || !novoProduto.preco || !novoProduto.industria) {
      Alert.alert('Erro', 'Nome, Preço e Indústria são obrigatórios!');
      return;
    }

    if (novoProduto.imagens.length > 5) {
      Alert.alert('Atenção', 'Máximo de 5 imagens por produto para evitar problemas de armazenamento.');
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
                preco: preco,
                imagens: novoProduto.imagens,
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
        const produto = {
          id: Date.now(),
          nome: novoProduto.nome.trim(),
          preco: preco,
          imagens: novoProduto.imagens,
          industria: novoProduto.industria,
          descricao: novoProduto.descricao.trim(),
          variacoes: novoProduto.variacoes,
          dataCadastro: new Date().toISOString()
        };

        const produtosAtuais = await AsyncStorage.getItem('produtos');
        const listaProdutosAtuais = produtosAtuais ? JSON.parse(produtosAtuais) : [];
        const novosProdutos = [produto, ...listaProdutosAtuais];
        
        await saveProdutos(novosProdutos);
        Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
      }

      resetForm();
      setIsEditMode(false);
      setShowAddProductModal(false);
      await loadProdutos();
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
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
              console.error('❌ Erro ao excluir produto:', error);
              Alert.alert('Erro', 'Erro ao excluir produto');
            }
          }
        }
      ]
    );
  };

  const handleImageSelected = (compressedImage) => {
    setNovoProduto(prev => ({ 
      ...prev, 
      imagens: [...prev.imagens, compressedImage] 
    }));
    setShowImagePickerModal(false);
  };

  const removeImage = (index) => {
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
  };

  const nextImage = () => {
    if (selectedProduct && selectedProduct.imagens) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedProduct.imagens.length);
    }
  };

  const prevImage = () => {
    if (selectedProduct && selectedProduct.imagens) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedProduct.imagens.length - 1 : prev - 1
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Produtos</Text>
        <Text style={styles.headerSubtitle}>Total: {produtos.length} produtos</Text>
      </View>

      <SearchBar value={searchText} onChangeText={setSearchText} />

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
        renderItem={({ item }) => (
          <ProductCard
            produto={item}
            onPress={() => {
              setSelectedProduct(item);
              setCurrentImageIndex(0);
              setShowProductModal(true);
            }}
          />
        )}
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

      {/* Modal de Detalhes do Produto */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.productModalContainer}>
            <ScrollView>
              {selectedProduct && (
                <>
                  <ImageGallery
                    images={selectedProduct.imagens}
                    currentIndex={currentImageIndex}
                    onPrev={prevImage}
                    onNext={nextImage}
                    onSelectImage={setCurrentImageIndex}
                  />

                  <ProductInfo produto={selectedProduct} />

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

      {/* Modal de Adicionar/Editar Produto */}
      <Modal visible={showAddProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addProductModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </Text>

              <ImagePickerComponent
                images={novoProduto.imagens}
                onAddImage={() => setShowImagePickerModal(true)}
                onRemoveImage={removeImage}
                maxImages={5}
              />

              <Text style={styles.inputLabel}>Nome do Produto *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o nome do produto"
                value={novoProduto.nome}
                onChangeText={(text) => updateField('nome', text)}
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
                  onValueChange={(value) => updateField('industria', value)}
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
                onChangeText={(text) => updateField('descricao', text)}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
                textAlignVertical="top"
              />

              <VariationManager
                variacoes={novoProduto.variacoes}
                novaVariacao={novaVariacao}
                onVariacaoChange={setNovaVariacao}
                onAddVariacao={adicionarVariacao}
                onRemoveVariacao={removerVariacao}
              />

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddProductModal(false);
                    setIsEditMode(false);
                    resetForm();
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

      {/* Modal de Seleção de Imagem */}
      <Modal visible={showImagePickerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerModal}>
            <Text style={styles.modalTitle}>Selecionar Imagem</Text>

            <TouchableOpacity 
              style={styles.imagePickerOption} 
              onPress={() => openCamera(handleImageSelected)}
            >
              <Camera size={24} color="#007AFF" />
              <Text style={styles.imagePickerText}>Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.imagePickerOption} 
              onPress={() => openGallery(handleImageSelected)}
            >
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
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
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