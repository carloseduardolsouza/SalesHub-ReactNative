import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

const ContatoForm = ({
  formData,
  showDatePicker,
  onUpdateField,
  onShowDatePicker,
  onDateChange,
}) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Contato</Text>

      <Text style={styles.inputLabel}>Nome do Comprador</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome da pessoa responsável pelas compras"
        value={formData.nomeComprador}
        onChangeText={(text) => onUpdateField('nomeComprador', text)}
      />

      <Text style={styles.inputLabel}>Email *</Text>
      <TextInput
        style={styles.input}
        placeholder="email@empresa.com"
        value={formData.email}
        onChangeText={(text) => onUpdateField('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.inputLabel}>Telefone</Text>
      <TextInput
        style={styles.input}
        placeholder="(11) 99999-9999"
        value={formData.telefone}
        onChangeText={(text) => onUpdateField('telefone', text)}
        keyboardType="phone-pad"
        maxLength={15}
      />

      <Text style={styles.inputLabel}>Data de Nascimento (Comprador)</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => onShowDatePicker(true)}
      >
        <Calendar size={20} color="#666" />
        <Text style={styles.dateButtonText}>
          {formData.dataNascimento.toLocaleDateString('pt-BR')}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={formData.dataNascimento}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
    paddingHorizontal: 20,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  dateButton: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
});

export default ContatoForm;