import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ProductInfo = ({ produto }) => {
  return (
    <>
      <Text style={styles.productDetailName}>{produto.nome}</Text>
      <Text style={styles.productDetailCompany}>{produto.industria}</Text>

      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Preço:</Text>
        <Text style={styles.priceValue}>R$ {produto.preco.toFixed(2)}</Text>
      </View>

      {produto.descricao ? (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Descrição:</Text>
          <Text style={styles.descriptionValue}>{produto.descricao}</Text>
        </View>
      ) : null}

      {produto.variacoes && produto.variacoes.length > 0 && (
        <View style={styles.variationsContainer}>
          <Text style={styles.variationsLabel}>Variações:</Text>
          {produto.variacoes.map((variacao, index) => (
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
        Cadastrado em: {new Date(produto.dataCadastro).toLocaleDateString('pt-BR')}
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
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
});