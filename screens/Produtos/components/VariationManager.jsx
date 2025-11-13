import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Plus, X } from 'lucide-react-native';

export const VariationManager = ({ 
  variacoes, 
  novaVariacao, 
  onVariacaoChange, 
  onAddVariacao, 
  onRemoveVariacao 
}) => {
  return (
    <>
      <Text style={styles.inputLabel}>Variações (Cores/Tamanhos)</Text>

      <View style={styles.variationInputContainer}>
        <View style={styles.variationTypeContainer}>
          <Picker
            selectedValue={novaVariacao.tipo}
            onValueChange={(value) => onVariacaoChange({ ...novaVariacao, tipo: value })}
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
          onChangeText={(text) => onVariacaoChange({ ...novaVariacao, valor: text })}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.addVariationButton} onPress={onAddVariacao}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {variacoes.length > 0 && (
        <View style={styles.addedVariationsContainer}>
          <Text style={styles.addedVariationsTitle}>Variações Adicionadas:</Text>
          {variacoes.map((variacao, index) => (
            <View key={index} style={styles.addedVariationItem}>
              <Text style={styles.addedVariationText}>
                {variacao.tipo === 'cor' ? 'Cor' : 'Tamanho'}: {variacao.valor}
              </Text>
              <TouchableOpacity
                style={styles.removeVariationButton}
                onPress={() => onRemoveVariacao(index)}
              >
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
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
});