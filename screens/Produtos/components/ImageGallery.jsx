import React from 'react';
import { View, Image, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

export const ImageGallery = ({ images, currentIndex, onPrev, onNext, onSelectImage }) => {
  if (!images || images.length === 0) {
    return (
      <Image
        source={{ uri: 'https://via.placeholder.com/200x200/666666/white?text=Sem+Imagem' }}
        style={styles.productDetailImage}
        resizeMode="cover"
      />
    );
  }

  return (
    <>
      <View style={styles.imageGallery}>
        <Image
          source={{ uri: images[currentIndex] }}
          style={styles.productDetailImage}
          resizeMode="cover"
        />
        {images.length > 1 && (
          <>
            <TouchableOpacity style={styles.navButtonLeft} onPress={onPrev}>
              <ChevronLeft size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButtonRight} onPress={onNext}>
              <ChevronRight size={30} color="#fff" />
            </TouchableOpacity>
            <View style={styles.imageIndicator}>
              <Text style={styles.imageIndicatorText}>
                {currentIndex + 1} / {images.length}
              </Text>
            </View>
          </>
        )}
      </View>

      {images.length > 1 && (
        <ScrollView horizontal style={styles.thumbnailContainer} showsHorizontalScrollIndicator={false}>
          {images.map((img, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => onSelectImage(index)}
              style={[
                styles.thumbnail,
                currentIndex === index && styles.thumbnailActive
              ]}
            >
              <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  imageGallery: {
    position: 'relative',
    marginBottom: 15,
  },
  productDetailImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  navButtonLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  imageIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  thumbnailContainer: {
    marginVertical: 10,
    maxHeight: 70,
  },
  thumbnail: {
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#007AFF',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
  },
});