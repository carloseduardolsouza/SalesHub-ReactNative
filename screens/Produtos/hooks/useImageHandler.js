import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export const useImageHandler = () => {
  const compressImage = async (uri) => {
    try {
      console.log('🔄 Comprimindo imagem...');
      
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { 
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );

      const compressedBase64 = `data:image/jpeg;base64,${manipulatedImage.base64}`;
      const sizeKB = (compressedBase64.length * 0.75) / 1024;
      console.log(`✅ Imagem comprimida: ~${sizeKB.toFixed(0)}KB`);
      
      return compressedBase64;
    } catch (error) {
      console.error('❌ Erro ao comprimir imagem:', error);
      throw error;
    }
  };

  const openCamera = async (onImageSelected) => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permissão Negada',
        'Precisamos da sua permissão para acessar a câmera e tirar fotos.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const compressedImage = await compressImage(result.assets[0].uri);
        onImageSelected(compressedImage);
        Alert.alert('✅', 'Imagem adicionada e otimizada!');
      }
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar usar a câmera.');
    }
  };

  const openGallery = async (onImageSelected) => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permissão Negada',
        'Precisamos da sua permissão para acessar a galeria de imagens.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const compressedImage = await compressImage(result.assets[0].uri);
        onImageSelected(compressedImage);
        Alert.alert('✅', 'Imagem adicionada e otimizada!');
      }
    } catch (error) {
      console.error('Erro ao acessar a galeria:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar acessar a galeria.');
    }
  };

  return {
    compressImage,
    openCamera,
    openGallery
  };
};