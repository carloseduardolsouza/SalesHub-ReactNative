import { useState, useMemo } from 'react';

const AVAILABLE_FIELDS = [
  { key: 'nomeFantasia', label: 'Nome Fantasia' },
  { key: 'razaoSocial', label: 'Razão Social' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'cnpj', label: 'CNPJ' },
  { key: 'inscricaoEstadual', label: 'Inscrição Estadual' },
  { key: 'nomeComprador', label: 'Nome do Comprador' },
  { key: 'estado', label: 'Estado' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'email', label: 'Email' },
  { key: 'enderecoCompleto', label: 'Endereço' }
];

export const useClienteFilters = (clientes) => {
  const [searchText, setSearchText] = useState('');
  const [selectedFields, setSelectedFields] = useState(['nomeFantasia', 'cidade', 'cnpj']);

  const isCNPJ = (text) => {
    const cleanText = text.replace(/\D/g, '');
    return cleanText.length >= 11 && /^\d+$/.test(cleanText);
  };

  const filteredClientes = useMemo(() => {
    if (!searchText.trim()) return clientes;

    return clientes.filter(cliente => {
      const searchLower = searchText.toLowerCase().trim();

      if (isCNPJ(searchText)) {
        const cnpjNumbers = (cliente.cnpj || '').replace(/\D/g, '');
        const searchNumbers = searchText.replace(/\D/g, '');
        return cnpjNumbers.includes(searchNumbers);
      } else {
        return (cliente.nomeFantasia || '').toLowerCase().includes(searchLower) ||
          (cliente.razaoSocial || '').toLowerCase().includes(searchLower);
      }
    });
  }, [clientes, searchText]);

  const toggleField = (fieldKey) => {
    if (selectedFields.includes(fieldKey)) {
      if (selectedFields.length > 1) {
        setSelectedFields(selectedFields.filter(field => field !== fieldKey));
      }
    } else {
      setSelectedFields([...selectedFields, fieldKey]);
    }
  };

  return {
    searchText,
    setSearchText,
    selectedFields,
    toggleField,
    filteredClientes,
    availableFields: AVAILABLE_FIELDS
  };
};