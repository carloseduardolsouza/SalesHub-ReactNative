import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const DadosPrincipais = ({ formData, onUpdateField }) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Dados Principais</Text>

      <Text style={styles.inputLabel}>CNPJ *</Text>
      <TextInput
        style={styles.input}
        placeholder="00.000.000/0000-00"
        value={formData.cnpj}
        onChangeText={(text) => onUpdateField('cnpj', text)}
        keyboardType="numeric"
        maxLength={18}
      />

      <Text style={styles.inputLabel}>Nome Fantasia *</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome fantasia da empresa"
        value={formData.nomeFantasia}
        onChangeText={(text) => onUpdateField('nomeFantasia', text)}
      />

      <Text style={styles.inputLabel}>Razão Social *</Text>
      <TextInput
        style={styles.input}
        placeholder="Razão social da empresa"
        value={formData.razaoSocial}
        onChangeText={(text) => onUpdateField('razaoSocial', text)}
      />

      <Text style={styles.inputLabel}>Inscrição Estadual</Text>
      <TextInput
        style={styles.input}
        placeholder="Inscrição estadual"
        value={formData.inscricaoEstadual}
        onChangeText={(text) => onUpdateField('inscricaoEstadual', text)}
      />
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
});

export default DadosPrincipais;