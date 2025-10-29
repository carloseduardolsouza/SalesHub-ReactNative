import React, { useState, useMemo } from 'react';
import { View, Text, Modal, FlatList, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { Search, X, ShoppingCart, Check } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

const ProductSelectionModal = ({ visible, onClose, produtos, industrias, newOrder, setNewOrder }) => {
  const [productSearch, setProductSearch] = useState('');
  const [selectedIndustrias, setSelectedIndustrias] = useState([]);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState('');

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

  const handleProductClick = (produto) => {
    // Se o produto tem variações, mostrar modal de seleção
    if (produto.variacoes && produto.variacoes.length > 0) {
      setSelectedProduct(produto);
      setSelectedVariation(''); // Reset
      setShowVariationModal(true);
    } else {
      // Se não tem variações, adicionar direto
      addProductToOrder(produto, null);
    }
  };

  const addProductWithVariation = () => {
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
  };

  const addProductToOrder = (produto, variacao) => {
    // Criar uma chave única considerando produto + variação
    const variacaoKey = variacao ? `${variacao.tipo}:${variacao.valor}` : null;
    const productKey = variacaoKey ? `${produto.id}_${variacaoKey}` : produto.id;

    const existingProduct = newOrder.produtos.find(p => {
      if (variacaoKey) {
        return p.id === produto.id && p.variacaoSelecionada?.tipo === variacao.tipo && 
               p.variacaoSelecionada?.valor === variacao.valor;
      }
      return p.id === produto.id && !p.variacaoSelecionada;
    });

    if (existingProduct) {
      const updatedProducts = newOrder.produtos.map(p => {
        if (variacaoKey) {
          if (p.id === produto.id && p.variacaoSelecionada?.tipo === variacao.tipo && 
              p.variacaoSelecionada?.valor === variacao.valor) {
            return { ...p, quantidade: p.quantidade + 1 };
          }
        } else {
          if (p.id === produto.id && !p.variacaoSelecionada) {
            return { ...p, quantidade: p.quantidade + 1 };
          }
        }
        return p;
      });
      setNewOrder({ ...newOrder, produtos: updatedProducts });
    } else {
      const novoProduto = {
        ...produto,
        quantidade: 1,
        precoUnitario: produto.preco,
        variacaoSelecionada: variacao || null
      };
      setNewOrder({
        ...newOrder,
        produtos: [...newOrder.produtos, novoProduto]
      });
    }
  };

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
                    {item.variacoes && item.variacoes.length > 0 && (
                      <Text style={styles.productVariations}>
                        {item.variacoes.length} variação{item.variacoes.length > 1 ? 'ões' : ''}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleProductClick(item)}
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

      {/* Modal de Seleção de Variação */}
      <Modal visible={showVariationModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.variationModalContainer}>
            <Text style={styles.variationModalTitle}>Selecione a Variação</Text>
            
            {selectedProduct && (
              <>
                <View style={styles.productPreview}>
                  <Image
                    source={{
                      uri: selectedProduct.imagem || 'https://via.placeholder.com/80x80/666666/white?text=Produto'
                    }}
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
                    onValueChange={(value) => setSelectedVariation(value)}
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
  // Estilos do Modal de Variação
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