import React, { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, Modal, FlatList, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { Search, X, ShoppingCart, Check } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

// Função helper para obter imagem do produto
const getProductImageHelper = (produto) => {
  if (produto.imagens && produto.imagens.length > 0) {
    return produto.imagens[0];
  }
  if (produto.imagem) {
    return produto.imagem;
  }
  return 'https://via.placeholder.com/60x60/666666/white?text=Produto';
};

// Componente de item de produto memoizado
const ProductItem = memo(({ produto, onPress }) => {
  const imagemUri = useMemo(() => getProductImageHelper(produto), [produto]);

  return (
    <View style={styles.productItem}>
      <Image
        source={{ uri: imagemUri }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{produto.nome}</Text>
        <Text style={styles.productIndustria}>{produto.industria}</Text>
        <Text style={styles.productPrice}>R$ {produto.preco.toFixed(2)}</Text>
        {produto.variacoes && produto.variacoes.length > 0 && (
          <Text style={styles.productVariations}>
            {produto.variacoes.length} variação{produto.variacoes.length > 1 ? 'ões' : ''}
          </Text>
        )}
      </View>
      <TouchableOpacity style={styles.addButton} onPress={onPress}>
        <ShoppingCart size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
});

ProductItem.displayName = 'ProductItem';

// Componente de chip de indústria memoizado
const IndustriaChip = memo(({ industria, isSelected, count, onPress }) => (
  <TouchableOpacity
    style={[styles.industriaOption, isSelected && styles.industriaSelected]}
    onPress={onPress}
  >
    <Text style={[styles.industriaOptionText, isSelected && styles.industriaSelectedText]}>
      {industria.nome} ({count})
    </Text>
    {isSelected && <Check size={16} color="#fff" style={styles.industriaCheck} />}
  </TouchableOpacity>
));

IndustriaChip.displayName = 'IndustriaChip';

const ProductSelectionModal = ({ visible, onClose, produtos, industrias, newOrder, setNewOrder }) => {
  const [productSearch, setProductSearch] = useState('');
  const [selectedIndustrias, setSelectedIndustrias] = useState([]);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState('');

  // Memoiza contagem de produtos por indústria
  const productCountByIndustry = useMemo(() => {
    const counts = {};
    produtos.forEach(p => {
      counts[p.industria] = (counts[p.industria] || 0) + 1;
    });
    return counts;
  }, [produtos]);

  // Memoiza produtos filtrados
  const filteredProducts = useMemo(() => {
    let filtered = produtos;

    if (productSearch.trim()) {
      const searchLower = productSearch.toLowerCase();
      filtered = filtered.filter(produto =>
        produto.nome.toLowerCase().includes(searchLower)
      );
    }

    if (selectedIndustrias.length > 0) {
      filtered = filtered.filter(produto =>
        selectedIndustrias.includes(produto.industria)
      );
    }

    return filtered;
  }, [produtos, productSearch, selectedIndustrias]);

  const toggleIndustria = useCallback((industriaNome) => {
    setSelectedIndustrias(prev =>
      prev.includes(industriaNome)
        ? prev.filter(i => i !== industriaNome)
        : [...prev, industriaNome]
    );
  }, []);

  const handleProductClick = useCallback((produto) => {
    if (produto.variacoes && produto.variacoes.length > 0) {
      setSelectedProduct(produto);
      setSelectedVariation('');
      setShowVariationModal(true);
    } else {
      addProductToOrder(produto, null);
    }
  }, []);

  const addProductWithVariation = useCallback(() => {
    if (!selectedVariation) {
      alert('Por favor, selecione uma variação!');
      return;
    }

    const variation = selectedProduct.variacoes.find(v => 
      `${v.tipo}:${v.valor}` === selectedVariation
    );

    addProductToOrder(selectedProduct, variation);
    setShowVariationModal(false);
    setSelectedProduct(null);
    setSelectedVariation('');
  }, [selectedProduct, selectedVariation]);

  const addProductToOrder = useCallback((produto, variacao) => {
    setNewOrder(prev => {
      const existingIndex = prev.produtos.findIndex(p => {
        if (variacao) {
          return p.id === produto.id && 
                 p.variacaoSelecionada?.tipo === variacao.tipo && 
                 p.variacaoSelecionada?.valor === variacao.valor;
        }
        return p.id === produto.id && !p.variacaoSelecionada;
      });

      if (existingIndex !== -1) {
        const updatedProducts = [...prev.produtos];
        updatedProducts[existingIndex] = {
          ...updatedProducts[existingIndex],
          quantidade: updatedProducts[existingIndex].quantidade + 1
        };
        return { ...prev, produtos: updatedProducts };
      }

      const novoProduto = {
        ...produto,
        quantidade: 1,
        precoUnitario: produto.preco,
        variacaoSelecionada: variacao || null,
        desconto: { tipo: 'percentual', valor: '' }
      };

      return {
        ...prev,
        produtos: [...prev.produtos, novoProduto]
      };
    });
  }, [setNewOrder]);

  const renderProductItem = useCallback(({ item }) => (
    <ProductItem
      produto={item}
      onPress={() => handleProductClick(item)}
    />
  ), [handleProductClick]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const getItemLayout = useCallback((data, index) => ({
    length: 90,
    offset: 90 * index,
    index,
  }), []);

  return (
    <>
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
                    <IndustriaChip
                      key={industria.id}
                      industria={industria}
                      isSelected={selectedIndustrias.includes(industria.nome)}
                      count={productCountByIndustry[industria.nome] || 0}
                      onPress={() => toggleIndustria(industria.nome)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              getItemLayout={getItemLayout}
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

      {/* Modal de Seleção de Variação */}
      <Modal visible={showVariationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.variationModalContainer}>
            <Text style={styles.variationModalTitle}>Selecione a Variação</Text>
            
            {selectedProduct && (
              <>
                <View style={styles.productPreview}>
                  <Image
                    source={{ uri: getProductImageHelper(selectedProduct) }}
                    style={styles.productPreviewImage}
                  />
                  <View>
                    <Text style={styles.productPreviewName}>{selectedProduct.nome}</Text>
                    <Text style={styles.productPreviewPrice}>R$ {selectedProduct.preco.toFixed(2)}</Text>
                  </View>
                </View>

                <Text style={styles.variationLabel}>Escolha uma opção:</Text>
                
                <View style={styles.variationPickerContainer}>
                  <Picker
                    selectedValue={selectedVariation}
                    onValueChange={setSelectedVariation}
                    style={styles.variationPicker}
                  >
                    <Picker.Item label="Selecione uma variação..." value="" />
                    {selectedProduct.variacoes.map((variacao, index) => (
                      <Picker.Item
                        key={index}
                        label={`${variacao.tipo === 'cor' ? 'Cor' : 'Tamanho'}: ${variacao.valor}`}
                        value={`${variacao.tipo}:${variacao.valor}`}
                      />
                    ))}
                  </Picker>
                </View>

                <View style={styles.variationModalButtons}>
                  <TouchableOpacity
                    style={styles.variationCancelButton}
                    onPress={() => {
                      setShowVariationModal(false);
                      setSelectedProduct(null);
                      setSelectedVariation('');
                    }}
                  >
                    <Text style={styles.variationCancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.variationConfirmButton,
                      !selectedVariation && styles.variationConfirmButtonDisabled
                    ]}
                    onPress={addProductWithVariation}
                    disabled={!selectedVariation}
                  >
                    <Text style={styles.variationConfirmButtonText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
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
    backgroundColor: '#f0f0f0',
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
  productVariations: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 2,
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
  variationModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  variationModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  productPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  productPreviewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productPreviewPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  variationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  variationPickerContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  variationPicker: {
    height: 50,
  },
  variationModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  variationCancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
  },
  variationCancelButtonText: {
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  variationConfirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
  },
  variationConfirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  variationConfirmButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProductSelectionModal;