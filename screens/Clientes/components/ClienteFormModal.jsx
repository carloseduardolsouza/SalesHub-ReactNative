import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import DadosPrincipais from './form/DadosPrincipais';
import EnderecoForm from './form/EnderecoForm';
import ContatoForm from './form/ContatoForm';

const ClienteFormModal = ({
  visible,
  onClose,
  formData,
  isEditing,
  showDatePicker,
  onShowDatePicker,
  onUpdateField,
  onUpdateEndereco,
  onDateChange,
  onSave,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cadastroModalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Editar Cliente' : 'Cadastrar Cliente'}
            </Text>

            <DadosPrincipais
              formData={formData}
              onUpdateField={onUpdateField}
            />

            <EnderecoForm
              endereco={formData.endereco}
              onUpdateEndereco={onUpdateEndereco}
            />

            <ContatoForm
              formData={formData}
              showDatePicker={showDatePicker}
              onUpdateField={onUpdateField}
              onShowDatePicker={onShowDatePicker}
              onDateChange={onDateChange}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={onSave}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Salvar Edição' : 'Salvar Cliente'}
                </Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cadastroModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '95%',
    maxHeight: '95%',
    paddingVertical: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 30,
    marginHorizontal: 20,
    marginBottom: 20,
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

export default ClienteFormModal;