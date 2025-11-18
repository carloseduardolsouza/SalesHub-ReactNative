import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const EnderecoForm = ({ endereco, onUpdateEndereco }) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Endereço</Text>

      <Text style={styles.inputLabel}>CEP</Text>
      <TextInput
        style={styles.input}
        placeholder="00000-000"
        value={endereco.cep}
        onChangeText={(text) => onUpdateEndereco('cep', text)}
        keyboardType="numeric"
        maxLength={9}
      />

      <Text style={styles.inputLabel}>Logradouro</Text>
      <TextInput
        style={styles.input}
        placeholder="Rua, Avenida, etc."
        value={endereco.logradouro}
        onChangeText={(text) => onUpdateEndereco('logradouro', text)}
      />

      <View style={styles.rowInputs}>
        <View style={styles.smallInputContainer}>
          <Text style={styles.inputLabel}>Número</Text>
          <TextInput
            style={styles.input}
            placeholder="123"
            value={endereco.numero}
            onChangeText={(text) => onUpdateEndereco('numero', text)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.largeInputContainer}>
          <Text style={styles.inputLabel}>Complemento</Text>
          <TextInput
            style={styles.input}
            placeholder="Apto, Sala, etc."
            value={endereco.complemento}
            onChangeText={(text) => onUpdateEndereco('complemento', text)}
          />
        </View>
      </View>

      <Text style={styles.inputLabel}>Bairro</Text>
      <TextInput
        style={styles.input}
        placeholder="Bairro"
        value={endereco.bairro}
        onChangeText={(text) => onUpdateEndereco('bairro', text)}
      />

      <View style={styles.rowInputs}>
        <View style={styles.largeInputContainer}>
          <Text style={styles.inputLabel}>Cidade</Text>
          <TextInput
            style={styles.input}
            placeholder="Cidade"
            value={endereco.cidade}
            onChangeText={(text) => onUpdateEndereco('cidade', text)}
          />
        </View>

        <View style={styles.smallInputContainer}>
          <Text style={styles.inputLabel}>UF</Text>
          <TextInput
            style={styles.input}
            placeholder="SP"
            value={endereco.estado}
            onChangeText={(text) => onUpdateEndereco('estado', text)}
            maxLength={2}
          />
        </View>
      </View>
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
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
  },
  smallInputContainer: {
    flex: 1,
  },
  largeInputContainer: {
    flex: 2,
  },
});

export default EnderecoForm;