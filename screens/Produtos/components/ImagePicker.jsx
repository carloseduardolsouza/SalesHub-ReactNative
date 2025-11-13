import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Image as ImageIcon, X } from 'lucide-react-native';

export const ImagePickerComponent = ({ images, onAddImage, onRemoveImage, maxImages = 5 }) => {
  return (
    <>
      <Text style={styles.inputLabel}>
        Imagens do Produto ({images.length}/{maxImages})
      </Text>
      <Text style={styles.imageHint}>
        💡 Imagens são otimizadas automaticamente
      </Text>
      
      {images.length > 0 && (
        <ScrollView horizontal style={styles.imagesGrid} showsHorizontalScrollIndicator={false}>
          {images.map((img, index) => (
            <View key={index} style={styles.imagePreviewContainer}>
              <Image source={{ uri: img }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity 
                style={styles.removeImageButtonSmall} 
                onPress={() => onRemoveImage(index)}
              >
                <X size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {images.length < maxImages && (
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={onAddImage}
          activeOpacity={0.8}
        >
          <ImageIcon size={24} color="#007AFF" />
          <Text style={styles.addImageButtonText}>Adicionar Imagem</Text>
        </TouchableOpacity>
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
  imageHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
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
});