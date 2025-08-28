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

// Dados mockados para demonstração
const mockProducts = [
  {
    id: 1,
    name: 'iPhone 14 Pro',
    industry: 'Tecnologia',
    price: 4999.99,
    image: 'https://via.placeholder.com/150x150/007AFF/white?text=iPhone',
    description: 'Smartphone premium da Apple com chip A16 Bionic'
  },
  {
    id: 2,
    name: 'Notebook Dell XPS',
    industry: 'Tecnologia',
    price: 3299.99,
    image: 'https://via.placeholder.com/150x150/0078D4/white?text=Dell',
    description: 'Notebook ultrabook para profissionais'
  },
  {
    id: 3,
    name: 'Nike Air Max',
    industry: 'Esporte',
    price: 299.99,
    image: 'https://via.placeholder.com/150x150/FF6B35/white?text=Nike',
    description: 'Tênis esportivo para corrida e uso casual'
  },
  {
    id: 4,
    name: 'Samsung Galaxy S23',
    industry: 'Tecnologia',
    price: 3499.99,
    image: 'https://via.placeholder.com/150x150/1428A0/white?text=Samsung',
    description: 'Smartphone Android flagship'
  },
  {
    id: 5,
    name: 'Adidas Ultraboost',
    industry: 'Esporte',
    price: 399.99,
    image: 'https://via.placeholder.com/150x150/000000/white?text=Adidas',
    description: 'Tênis de performance para running'
  },
];

const industries = ['Todos', 'Tecnologia', 'Esporte', 'Casa', 'Beleza', 'Automóvel'];

const ProductsScreen = () => {
  const [products, setProducts] = useState(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState(mockProducts);
  const [searchText, setSearchText] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('Todos');
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    industry: 'Tecnologia',
    price: '',
    image: '',
    description: ''
  });

  // Filtrar produtos
  useEffect(() => {
    let filtered = products;

    // Filtro por texto
    if (searchText) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filtro por indústria
    if (selectedIndustry !== 'Todos') {
      filtered = filtered.filter(product => product.industry === selectedIndustry);
    }

    setFilteredProducts(filtered);
  }, [searchText, selectedIndustry, products]);

  const updatePriceWithAI = () => {
    Alert.alert(
      'Atualizar Preços com IA',
      'Os preços dos produtos foram atualizados usando inteligência artificial!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Simular atualização de preços
            const updatedProducts = products.map(product => ({
              ...product,
              price: product.price * (0.9 + Math.random() * 0.2) // Variação de ±10%
            }));
            setProducts(updatedProducts);
          }
        }
      ]
    );
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert('Erro', 'Nome e preço são obrigatórios!');
      return;
    }

    const product = {
      id: Date.now(),
      name: newProduct.name,
      industry: newProduct.industry,
      price: parseFloat(newProduct.price),
      image: newProduct.image || 'https://via.placeholder.com/150x150/666666/white?text=Produto',
      description: newProduct.description || 'Sem descrição'
    };

    setProducts([...products, product]);
    setNewProduct({ name: '', industry: 'Tecnologia', price: '', image: '', description: '' });
    setShowAddProductModal(false);
    Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
  };

  const renderProductCard = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        setSelectedProduct(item);
        setShowProductModal(true);
      }}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productIndustry}>{item.industry}</Text>
        <Text style={styles.productPrice}>R$ {item.price.toFixed(2)}</Text>
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
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar produto..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filter and Actions */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowIndustryModal(true)}
        >
          <Text style={styles.filterButtonText}>
            {selectedIndustry}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={updatePriceWithAI}
        >
          <Text style={styles.aiButtonText}>🤖 Atualizar Preços IA</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddProductModal(true)}
      >
        <Text style={styles.addButtonText}>➕ Cadastrar Produto</Text>
      </TouchableOpacity>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
      />

      {/* Industry Filter Modal */}
      <Modal visible={showIndustryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecionar Indústria</Text>
            {industries.map(industry => (
              <TouchableOpacity
                key={industry}
                style={[
                  styles.industryOption,
                  selectedIndustry === industry && styles.selectedIndustry
                ]}
                onPress={() => {
                  setSelectedIndustry(industry);
                  setShowIndustryModal(false);
                }}
              >
                <Text style={[
                  styles.industryOptionText,
                  selectedIndustry === industry && styles.selectedIndustryText
                ]}>
                  {industry}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowIndustryModal(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Product Details Modal */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.productModalContainer}>
            {selectedProduct && (
              <>
                <Image
                  source={{ uri: selectedProduct.image }}
                  style={styles.productDetailImage}
                />
                <Text style={styles.productDetailName}>{selectedProduct.name}</Text>
                <Text style={styles.productDetailIndustry}>{selectedProduct.industry}</Text>
                <Text style={styles.productDetailPrice}>
                  R$ {selectedProduct.price.toFixed(2)}
                </Text>
                <Text style={styles.productDetailDescription}>
                  {selectedProduct.description}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowProductModal(false)}
                >
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Product Modal */}
      <Modal visible={showAddProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addProductModalContainer}>
            <ScrollView>
              <Text style={styles.modalTitle}>Cadastrar Novo Produto</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Nome do produto"
                value={newProduct.name}
                onChangeText={(text) => setNewProduct({...newProduct, name: text})}
              />
              
              <TouchableOpacity
                style={styles.industrySelector}
                onPress={() => {
                  // Aqui você poderia abrir outro modal para selecionar indústria
                }}
              >
                <Text>Indústria: {newProduct.industry}</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                placeholder="Preço (ex: 99.99)"
                value={newProduct.price}
                onChangeText={(text) => setNewProduct({...newProduct, price: text})}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="URL da imagem (opcional)"
                value={newProduct.image}
                onChangeText={(text) => setNewProduct({...newProduct, image: text})}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descrição do produto"
                value={newProduct.description}
                onChangeText={(text) => setNewProduct({...newProduct, description: text})}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddProductModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={addProduct}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    padding: 15,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonText: {
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  aiButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
  },
  aiButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    margin: 15,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 15,
  },
  addButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productsList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
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
  productIndustry: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  industryOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedIndustry: {
    backgroundColor: '#007AFF',
  },
  industryOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedIndustryText: {
    color: '#fff',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
  },
  closeButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  productModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    alignItems: 'center',
  },
  productDetailImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  productDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  productDetailIndustry: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  productDetailPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 15,
  },
  productDetailDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  addProductModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    maxHeight: '90%',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  industrySelector: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
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
});

export default ProductsScreen;