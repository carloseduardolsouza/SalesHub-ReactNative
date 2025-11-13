import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

export const ProductCard = ({ produto, onPress }) => {
  const imagemPrincipal = produto.imagens && produto.imagens.length > 0 
    ? produto.imagens[0] 
    : 'https://via.placeholder.com/150x150/666666/white?text=Sem+Imagem';
  
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
        {produto.imagens && produto.imagens.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountText}>+{produto.imagens.length - 1}</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{produto.nome}</Text>
        <Text style={styles.productCompany} numberOfLines={1}>{produto.industria}</Text>
        <Text style={styles.productPrice}>R$ {produto.preco.toFixed(2)}</Text>
        {produto.variacoes && produto.variacoes.length > 0 && (
          <Text style={styles.productVariations}>
            {produto.variacoes.length} variação{produto.variacoes.length > 1 ? 'ões' : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});