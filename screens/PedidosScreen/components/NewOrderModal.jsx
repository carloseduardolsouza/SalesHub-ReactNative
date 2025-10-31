import React, { useState, useMemo } from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Plus, X, Minus, Tag } from 'lucide-react-native';
import { calculateOrderTotals } from '../utils/calculations';

const metodoPagamentoOptions = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'pix', label: 'Pix' },
  { value: 'boleto', label: 'Boleto' }
];

const NewOrderModal = ({ 
  visible, 
  onClose, 
  newOrder, 
  setNewOrder, 
  clientes, 
  onCreateOrder,
  onOpenProductSelection 
}) => {
  const [clienteSearch, setClienteSearch] = useState('');
  const [editingDiscountIndex, setEditingDiscountIndex] = useState(null);

  const filteredClientes = useMemo(() => {
    if (!clienteSearch.trim()) return clientes;
    return clientes.filter(cliente =>
      cliente.nomeFantasia.toLowerCase().includes(clienteSearch.toLowerCase()) ||
      cliente.razaoSocial.toLowerCase().includes(clienteSearch.toLowerCase())
    );
  }, [clientes, clienteSearch]);

  const { 
    subtotalSemDescontos,
    subtotalComDescontosIndividuais, 
    descontosTotaisIndividuais,
    descontoGeral, 
    total 
  } = calculateOrderTotals(newOrder);

  const updateProductQuantity = (productIndex, newQuantity) => {
    if (newQuantity <= 0) {
      const updatedProducts = newOrder.produtos.filter((_, index) => index !== productIndex);
      setNewOrder({ ...newOrder, produtos: updatedProducts });
      return;
    }

    const updatedProducts = newOrder.produtos.map((p, index) =>
      index === productIndex ? { ...p, quantidade: newQuantity } : p
    );
    setNewOrder({ ...newOrder, produtos: updatedProducts });
  };

  const updateProductDiscount = (productIndex, tipo, valor) => {
    const updatedProducts = newOrder.produtos.map((p, index) =>
      index === productIndex ? { 
        ...p, 
        desconto: { tipo, valor } 
      } : p
    );
    setNewOrder({ ...newOrder, produtos: updatedProducts });
  };

  const removeProductFromOrder = (productIndex) => {
    const updatedProducts = newOrder.produtos.filter((_, index) => index !== productIndex);
    setNewOrder({ ...newOrder, produtos: updatedProducts });
  };

  const addPrazo = () => {
    setNewOrder({
      ...newOrder,
      prazos: [...newOrder.prazos, { dias: '' }]
    });
  };

  const updatePrazo = (index, value) => {
    const updatedPrazos = newOrder.prazos.map((prazo, i) =>
      i === index ? { dias: value } : prazo
    );
    setNewOrder({ ...newOrder, prazos: updatedPrazos });
  };

  const removePrazo = (index) => {
    const updatedPrazos = newOrder.prazos.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, prazos: updatedPrazos });
  };

  const calcularPrecoComDesconto = (produto) => {
    const precoTotal = produto.preco * produto.quantidade;
    if (!produto.desconto?.valor) return precoTotal;

    const valorDesconto = parseFloat(produto.desconto.valor.replace(',', '.')) || 0;
    let desconto = 0;
    
    if (produto.desconto.tipo === 'percentual') {
      desconto = (precoTotal * valorDesconto) / 100;
    } else {
      desconto = valorDesconto;
    }
    
    return Math.max(0, precoTotal - desconto);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
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

            {/* Produtos */}
            <View style={styles.produtosSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Produtos</Text>
                <TouchableOpacity style={styles.addProductButton} onPress={onOpenProductSelection}>
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
                    <View key={index} style={styles.selectedProduct}>
                      <View style={styles.productMainInfo}>
                        <View style={styles.productInfo}>
                          <Text style={styles.productName}>{produto.nome}</Text>
                          {produto.variacaoSelecionada && (
                            <Text style={styles.productVariation}>
                              {produto.variacaoSelecionada.tipo === 'cor' ? 'Cor' : 'Tamanho'}: {produto.variacaoSelecionada.valor}
                            </Text>
                          )}
                          <Text style={styles.productPrice}>R$ {produto.preco.toFixed(2)}</Text>
                        </View>

                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => updateProductQuantity(index, produto.quantidade - 1)}
                          >
                            <Minus size={16} color="#666" />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{produto.quantidade}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => updateProductQuantity(index, produto.quantidade + 1)}
                          >
                            <Plus size={16} color="#666" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.productTotal}>
                          <Text style={styles.productTotalText}>
                            R$ {calcularPrecoComDesconto(produto).toFixed(2)}
                          </Text>
                          <TouchableOpacity
                            style={styles.removeProductButton}
                            onPress={() => removeProductFromOrder(index)}
                          >
                            <X size={16} color="#f44336" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Desconto Individual */}
                      <View style={styles.productDiscountSection}>
                        <TouchableOpacity
                          style={styles.discountToggle}
                          onPress={() => setEditingDiscountIndex(editingDiscountIndex === index ? null : index)}
                        >
                          <Tag size={16} color="#FF9800" />
                          <Text style={styles.discountToggleText}>
                            {produto.desconto?.valor ? 'Editar desconto' : 'Adicionar desconto'}
                          </Text>
                        </TouchableOpacity>

                        {editingDiscountIndex === index && (
                          <View style={styles.discountControls}>
                            <View style={styles.discountTipoContainer}>
                              <Picker
                                selectedValue={produto.desconto?.tipo || 'percentual'}
                                style={styles.discountTipoPicker}
                                onValueChange={(value) =>
                                  updateProductDiscount(index, value, produto.desconto?.valor || '')
                                }
                              >
                                <Picker.Item label="%" value="percentual" />
                                <Picker.Item label="R$" value="fixo" />
                              </Picker>
                            </View>
                            <TextInput
                              style={styles.discountInput}
                              placeholder={produto.desconto?.tipo === 'percentual' ? '0' : '0,00'}
                              value={produto.desconto?.valor || ''}
                              onChangeText={(value) =>
                                updateProductDiscount(index, produto.desconto?.tipo || 'percentual', value)
                              }
                              keyboardType="numeric"
                            />
                          </View>
                        )}

                        {produto.desconto?.valor && (
                          <Text style={styles.discountApplied}>
                            Desconto aplicado: {produto.desconto.tipo === 'percentual' 
                              ? `${produto.desconto.valor}%` 
                              : `R$ ${produto.desconto.valor}`}
                          </Text>
                        )}
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
                  <Text style={styles.resumoLabel}>Subtotal (sem descontos):</Text>
                  <Text style={styles.resumoValue}>R$ {subtotalSemDescontos.toFixed(2)}</Text>
                </View>

                {descontosTotaisIndividuais > 0 && (
                  <View style={styles.resumoLine}>
                    <Text style={styles.resumoLabel}>Descontos nos produtos:</Text>
                    <Text style={[styles.resumoValue, styles.descontoValue]}>
                      -R$ {descontosTotaisIndividuais.toFixed(2)}
                    </Text>
                  </View>
                )}

                {descontosTotaisIndividuais > 0 && (
                  <View style={styles.resumoLine}>
                    <Text style={styles.resumoLabel}>Subtotal com descontos:</Text>
                    <Text style={styles.resumoValue}>R$ {subtotalComDescontosIndividuais.toFixed(2)}</Text>
                  </View>
                )}

                {/* Desconto Geral */}
                <View style={styles.descontoSection}>
                  <Text style={styles.descontoLabel}>Desconto Geral no Pedido:</Text>
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

                {descontoGeral > 0 && (
                  <View style={styles.resumoLine}>
                    <Text style={styles.resumoLabel}>Desconto geral aplicado:</Text>
                    <Text style={[styles.resumoValue, styles.descontoValue]}>
                      -R$ {descontoGeral.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={[styles.resumoLine, styles.totalLine]}>
                  <Text style={styles.totalLabel}>Total Final:</Text>
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
                        prazos: metodo.value === 'boleto' ? [{ dias: '30' }] : []
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
                    <Text style={styles.prazosTitle}>Prazos de Pagamento (dias)</Text>
                    <TouchableOpacity style={styles.addPrazoButton} onPress={addPrazo}>
                      <Plus size={16} color="#fff" />
                      <Text style={styles.addPrazoText}>Adicionar</Text>
                    </TouchableOpacity>
                  </View>

                  {newOrder.prazos.map((prazo, index) => (
                    <View key={index} style={styles.prazoItem}>
                      <TextInput
                        style={styles.prazoInput}
                        placeholder="Dias"
                        value={prazo.dias}
                        onChangeText={(value) => updatePrazo(index, value)}
                        keyboardType="numeric"
                      />
                      <Text style={styles.prazoSeparator}>dias</Text>
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
                      Total de parcelas: {newOrder.prazos.length}
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
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={onCreateOrder}>
                <Text style={styles.saveButtonText}>Criar Pedido</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productVariation: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 2,
    fontStyle: 'italic',
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
  productDiscountSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  discountToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  discountToggleText: {
    fontSize: 14,
    color: '#FF9800',
    marginLeft: 6,
    fontWeight: '500',
  },
  discountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  discountTipoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    minWidth: 80,
  },
  discountTipoPicker: {
    height: 40,
  },
  discountInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  discountApplied: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 6,
    fontStyle: 'italic',
  },
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
  descontoSection: {
    marginBottom: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  descontoLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
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
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addPrazoText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: 'bold',
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
    width: 80,
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
});

export default NewOrderModal;