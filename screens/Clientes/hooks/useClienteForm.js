import { useState } from 'react';
import { formatCNPJ, formatCEP, formatTelefone } from '../utils/formatters';

const INITIAL_STATE = {
  id: null,
  cnpj: '',
  nomeFantasia: '',
  razaoSocial: '',
  inscricaoEstadual: '',
  nomeComprador: '',
  email: '',
  telefone: '',
  dataNascimento: new Date(),
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  }
};

export const useClienteForm = () => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const updateField = (field, value) => {
    let formattedValue = value;
    
    if (field === 'cnpj') {
      formattedValue = formatCNPJ(value);
    } else if (field === 'telefone') {
      formattedValue = formatTelefone(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const updateEndereco = (field, value) => {
    let formattedValue = value;
    
    if (field === 'cep') {
      formattedValue = formatCEP(value);
    } else if (field === 'estado') {
      formattedValue = value.toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: formattedValue }
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dataNascimento: selectedDate }));
    }
  };

  const setFormForEdit = (cliente) => {
    setFormData({
      ...cliente,
      dataNascimento: cliente.dataNascimento ? new Date(cliente.dataNascimento) : new Date(),
      endereco: cliente.endereco || INITIAL_STATE.endereco
    });
  };

  const resetForm = () => {
    setFormData(INITIAL_STATE);
  };

  const isEditing = formData.id !== null;

  return {
    formData,
    isEditing,
    showDatePicker,
    setShowDatePicker,
    updateField,
    updateEndereco,
    handleDateChange,
    setFormForEdit,
    resetForm
  };
};