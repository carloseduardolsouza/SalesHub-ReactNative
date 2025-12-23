import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import database from '../../database/database';

import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ClientesList from './components/ClientesList';
import ClienteFormModal from './components/ClienteFormModal';
import ColumnFilterModal from './components/ColumnFilterModal';
import { useClienteForm } from './hooks/useClienteForm';
import { useClienteFilters } from './hooks/useClienteFilters';

const ClientesScreen = () => {
  const [clientes, setClientes] = useState([]);
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const {
    formData,
    isEditing,
    showDatePicker,
    setShowDatePicker,
    updateField,
    updateEndereco,
    handleDateChange,
    setFormForEdit,
    resetForm
  } = useClienteForm();

  const {
    searchText,
    setSearchText,
    selectedFields,
    toggleField,
    filteredClientes,
    availableFields
  } = useClienteFilters(clientes);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const clientesData = await database.getAllClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      Alert.alert('Erro', 'Erro ao carregar dados dos clientes');
    }
  };

  const handleSalvarCliente = async () => {
    if (!formData.cnpj || !formData.nomeFantasia || !formData.razaoSocial) {
      Alert.alert('Erro', 'CNPJ, Nome Fantasia e Razão Social são obrigatórios!');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      Alert.alert('Erro', 'Email inválido!');
      return;
    }

    const cnpjLimpo = formData.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      Alert.alert('Erro', 'CNPJ deve ter 14 dígitos!');
      return;
    }

    const clienteExistente = clientes.find(cliente =>
      (cliente.cnpj || '').replace(/\D/g, '') === cnpjLimpo && cliente.id !== formData.id
    );

    if (clienteExistente) {
      Alert.alert('Erro', 'CNPJ já cadastrado!');
      return;
    }

    try {
      const clienteFormatado = {
        ...formData,
        id: formData.id || Date.now(),
        dataCadastro: formData.dataCadastro || new Date().toISOString()
      };

      let success;
      if (isEditing) {
        success = await database.updateCliente(clienteFormatado);
      } else {
        success = await database.insertCliente(clienteFormatado);
      }

      if (success) {
        await loadClientes();
        handleCloseModal();
        Alert.alert('Sucesso', `Cliente ${isEditing ? 'editado' : 'cadastrado'} com sucesso!`);
      } else {
        Alert.alert('Erro', `Erro ao ${isEditing ? 'editar' : 'cadastrar'} cliente`);
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      Alert.alert('Erro', `Erro ao ${isEditing ? 'editar' : 'cadastrar'} cliente`);
    }
  };

  const handleEditCliente = (cliente) => {
    setFormForEdit(cliente);
    setShowCadastroModal(true);
  };

  const handleDeleteCliente = (id) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja deletar este cliente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          onPress: async () => {
            const success = await database.deleteCliente(id);
            if (success) {
              await loadClientes();
              Alert.alert("Sucesso", "Cliente deletado com sucesso!");
            } else {
              Alert.alert("Erro", "Erro ao deletar cliente");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleCloseModal = () => {
    resetForm();
    setShowCadastroModal(false);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <View style={styles.container}>
      <Header onAddPress={() => {
        resetForm();
        setShowCadastroModal(true);
      }} />

      <SearchBar
        searchText={searchText}
        onSearchChange={setSearchText}
        onFilterPress={() => setShowFilterModal(true)}
      />

      <ClientesList
        clientes={filteredClientes}
        selectedFields={selectedFields}
        availableFields={availableFields}
        onEdit={handleEditCliente}
        onDelete={handleDeleteCliente}
      />

      <ClienteFormModal
        visible={showCadastroModal}
        onClose={handleCloseModal}
        formData={formData}
        isEditing={isEditing}
        showDatePicker={showDatePicker}
        onShowDatePicker={setShowDatePicker}
        onUpdateField={updateField}
        onUpdateEndereco={updateEndereco}
        onDateChange={handleDateChange}
        onSave={handleSalvarCliente}
      />

      <ColumnFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        availableFields={availableFields}
        selectedFields={selectedFields}
        onToggleField={toggleField}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
});

export default ClientesScreen;