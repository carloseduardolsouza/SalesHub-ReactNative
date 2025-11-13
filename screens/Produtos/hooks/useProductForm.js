import { useState } from 'react';
import { Alert } from 'react-native';

export const useProductForm = (initialState = {
  nome: '',
  preco: '',
  imagens: [],
  industria: '',
  descricao: '',
  variacoes: []
}) => {
  const [formData, setFormData] = useState(initialState);
  const [novaVariacao, setNovaVariacao] = useState({ tipo: 'cor', valor: '' });

  const formatMoney = (value) => {
    if (!value) return '';
    const numericValue = String(value).replace(/[^\d]/g, '');
    if (numericValue.length === 0) return '';
    if (numericValue.length > 15) return formatMoney(numericValue.slice(0, 15));
    const numberValue = parseFloat(numericValue) / 100;
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseMoneyValue = (formattedValue) => {
    if (!formattedValue) return 0;
    const onlyNumbers = String(formattedValue).replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(onlyNumbers);
    return isNaN(parsed) ? 0 : parsed;
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMoneyInput = (value) => {
    const formatted = formatMoney(value);
    updateField('preco', formatted);
  };

  const adicionarVariacao = () => {
    if (!novaVariacao.valor.trim()) {
      Alert.alert('Erro', 'Digite um valor para a variação!');
      return;
    }

    const variacaoExistente = formData.variacoes.find(v =>
      v.tipo === novaVariacao.tipo && v.valor.toLowerCase() === novaVariacao.valor.toLowerCase()
    );

    if (variacaoExistente) {
      Alert.alert('Erro', 'Esta variação já foi adicionada!');
      return;
    }

    setFormData(prev => ({
      ...prev,
      variacoes: [...prev.variacoes, { ...novaVariacao }]
    }));

    setNovaVariacao({ tipo: 'cor', valor: '' });
  };

  const removerVariacao = (index) => {
    setFormData(prev => ({
      ...prev,
      variacoes: prev.variacoes.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData(initialState);
    setNovaVariacao({ tipo: 'cor', valor: '' });
  };

  return {
    formData,
    novaVariacao,
    setFormData,
    setNovaVariacao,
    updateField,
    handleMoneyInput,
    parseMoneyValue,
    adicionarVariacao,
    removerVariacao,
    resetForm
  };
};