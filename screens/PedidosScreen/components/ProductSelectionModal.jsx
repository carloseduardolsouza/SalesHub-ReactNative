import React, { useState, useMemo } from 'react';
import { View, Text, Modal, FlatList, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { Search, X, ShoppingCart, Check } from 'lucide-react-native';

const ProductSelectionModal = ({ visible, onClose, produtos, industrias, newOrder, setNewOrder }) => {
  const [productSearch, setProductSearch] = useState('');
  const [selectedIndustrias, setSelectedIndustrias] = useState([]);

  const filteredProducts = useMemo(() => {
    let filtered = produtos;

    if (productSearch.trim()) {
      filtered = filtered.filter(produto =>
        produto.nome.toLowerCase().includes(productSearch.toLowerCase())
      );
    }

    if (selectedIndustrias.length > 0) {
      filtered = filtered.filter(produto =>
        selectedIndustrias.includes(produto.industria)
      );
    }

    return filtered;
  }, [produtos, productSearch, selectedIndustrias]);

  const toggleIndustria = (industriaNome) => {
    if (selectedIndustrias.includes(industriaNome)) {
      setSelectedIndustrias(selectedIndustrias.filter(i => i !== industriaNome));
    } else {
      setSelectedIndustrias([...selectedIndustrias, industriaNome]);
    }
  };

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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Selecionar Produtos</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar produtos..."
              value={productSearch}
              onChangeText={setProductSearch}
            />
          </View>

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

          <FlatList
            data={filteredProducts}
            renderItem={({ item }) => (
              <View style={styles.productItem}>
                <Image
                  source={{
                    uri: item.imagem || 'https://via.placeholder.com/60x60/666666/white?text=Produto'
                  }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.nome}</Text>
                  <Text style={styles.productIndustria}>{item.industria}</Text>
                  <Text style={styles.productPrice}>R$ {item.preco.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
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

          {newOrder.produtos.length > 0 && (
            <View style={styles.selectedProductsPreview}>
              <Text style={styles.selectedProductsTitle}>
                {newOrder.produtos.length} produto(s) selecionado(s)
              </Text>
              <TouchableOpacity style={styles.viewSelectedButton} onPress={onClose}>
                <Text style={styles.viewSelectedButtonText}>Ver Pedido</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 10,
    maxHeight: '95%',
    width: '95%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
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
  searchInput: {
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
  productItem: {
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
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productIndustria: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProducts: {
    padding: 40,
    alignItems: 'center',
  },
  emptyProductsText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
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
});

export default ProductSelectionModal;