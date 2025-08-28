import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { Search, Filter, Plus, Check } from 'lucide-react-native';

const ClientesScreen = ({ navigation }) => {
  // Dados de exemplo dos clientes
  const [clientes] = useState([
    {
      id: 1,
      nomeLoja: 'Mercado Central',
      cidade: 'São Paulo',
      cnpj: '12.345.678/0001-90',
      telefone: '(11) 99999-9999',
      endereco: 'Rua das Flores, 123',
      email: 'contato@mercadocentral.com'
    },
    {
      id: 2,
      nomeLoja: 'Farmácia Saúde',
      cidade: 'Rio de Janeiro',
      cnpj: '98.765.432/0001-10',
      telefone: '(21) 88888-8888',
      endereco: 'Av. Principal, 456',
      email: 'farmacia@saude.com'
    },
    {
      id: 3,
      nomeLoja: 'Padaria do Bairro',
      cidade: 'Belo Horizonte',
      cnpj: '11.222.333/0001-44',
      telefone: '(31) 77777-7777',
      endereco: 'Rua do Pão, 789',
      email: 'padaria@bairro.com'
    },
    {
      id: 4,
      nomeLoja: 'Loja de Roupas Fashion',
      cidade: 'Porto Alegre',
      cnpj: '55.666.777/0001-88',
      telefone: '(51) 66666-6666',
      endereco: 'Rua da Moda, 321',
      email: 'fashion@roupas.com'
    },
    {
      id: 5,
      nomeLoja: 'Supermercado Popular',
      cidade: 'Brasília',
      cnpj: '33.444.555/0001-22',
      telefone: '(61) 55555-5555',
      endereco: 'Quadra 10, Lote 15',
      email: 'super@popular.com'
    }
  ]);

  // Estados
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState(['nomeLoja', 'cidade', 'cnpj']);

  // Opções de campos disponíveis
  const availableFields = [
    { key: 'nomeLoja', label: 'Nome da Loja' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'endereco', label: 'Endereço' },
    { key: 'email', label: 'Email' }
  ];

  // Função para detectar se é CNPJ (apenas números e formatação)
  const isCNPJ = (text) => {
    const cleanText = text.replace(/\D/g, '');
    return cleanText.length >= 11 && /^\d+$/.test(cleanText);
  };

  // Filtrar clientes baseado na busca
  const filteredClientes = useMemo(() => {
    if (!searchText.trim()) return clientes;

    return clientes.filter(cliente => {
      const searchLower = searchText.toLowerCase().trim();
      
      if (isCNPJ(searchText)) {
        // Se parece com CNPJ, busca apenas no CNPJ
        const cnpjNumbers = cliente.cnpj.replace(/\D/g, '');
        const searchNumbers = searchText.replace(/\D/g, '');
        return cnpjNumbers.includes(searchNumbers);
      } else {
        // Se não parece com CNPJ, busca no nome da loja
        return cliente.nomeLoja.toLowerCase().includes(searchLower);
      }
    });
  }, [clientes, searchText]);

  // Função para alternar seleção de campo
  const toggleField = (fieldKey) => {
    if (selectedFields.includes(fieldKey)) {
      if (selectedFields.length > 1) {
        setSelectedFields(selectedFields.filter(field => field !== fieldKey));
      } else {
        Alert.alert('Atenção', 'Pelo menos um campo deve estar selecionado');
      }
    } else {
      setSelectedFields([...selectedFields, fieldKey]);
    }
  };

  // Função para navegar para cadastro
  const navigateToNewClient = () => {
    // navigation.navigate('CadastroCliente');
    Alert.alert('Navegação', 'Aqui você navegaria para a tela de cadastro de cliente');
  };

  // Componente para renderizar cada linha da tabela
  const renderClienteItem = ({ item }) => (
    <View style={styles.tableRow}>
      {selectedFields.map(fieldKey => (
        <View key={fieldKey} style={styles.tableCell}>
          <Text style={styles.cellText} numberOfLines={2}>
            {item[fieldKey]}
          </Text>
        </View>
      ))}
    </View>
  );

  // Renderizar cabeçalho da tabela
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      {selectedFields.map(fieldKey => {
        const field = availableFields.find(f => f.key === fieldKey);
        return (
          <View key={fieldKey} style={styles.tableCell}>
            <Text style={styles.headerText}>{field?.label}</Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={navigateToNewClient}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Novo Cliente</Text>
        </TouchableOpacity>
      </View>

      {/* Controles de busca e filtro */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome da loja ou CNPJ..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tabela */}
      <View style={styles.tableContainer}>
        {renderTableHeader()}
        <FlatList
          data={filteredClientes}
          renderItem={renderClienteItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
            </View>
          }
        />
      </View>

      {/* Modal de Filtros */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Colunas</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {availableFields.map(field => (
                <TouchableOpacity
                  key={field.key}
                  style={styles.fieldOption}
                  onPress={() => toggleField(field.key)}
                >
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <View style={[
                    styles.checkbox,
                    selectedFields.includes(field.key) && styles.checkboxSelected
                  ]}>
                    {selectedFields.includes(field.key) && (
                      <Check size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>
                {selectedFields.length} de {availableFields.length} colunas selecionadas
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingVertical: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  cellText: {
    color: '#666',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalContent: {
    maxHeight: 400,
  },
  fieldOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fieldLabel: {
    fontSize: 16,
    color: '#333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectedCount: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  selectedCountText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});

export default ClientesScreen;