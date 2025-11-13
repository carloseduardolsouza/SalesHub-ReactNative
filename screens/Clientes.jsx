import React, { useState, useMemo, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Filter, Plus, Check, Calendar, Edit, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Estado inicial do formulário (usado para novo cliente e reset)
const INITIAL_CLIENTE_STATE = {
  id: null,
  cnpj: '',
  nomeFantasia: '',
  razaoSocial: '',
  inscricaoEstadual: '',
  nomeComprador: '',
  email: '',
  telefone: '',
  dataNascimento: new Date(),
  // Campos de endereço
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

const ClientesScreen = ({ navigation }) => {
  // Estados
  const [clientes, setClientes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState(['nomeFantasia', 'cidade', 'cnpj']);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Estado do formulário de cadastro/edição
  const [novoCliente, setNovoCliente] = useState(INITIAL_CLIENTE_STATE);
  const isEditing = novoCliente.id !== null;

  // Opções de campos disponíveis
  const availableFields = [
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

  // Carregar dados do AsyncStorage
  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const clientesData = await AsyncStorage.getItem('clientes');
      if (clientesData) {
        const parsedClientes = JSON.parse(clientesData).map(cliente => ({
          ...cliente,
          dataNascimento: cliente.dataNascimento ? new Date(cliente.dataNascimento) : new Date(),
          endereco: cliente.endereco || INITIAL_CLIENTE_STATE.endereco
        }));
        setClientes(parsedClientes);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      Alert.alert('Erro', 'Erro ao carregar dados dos clientes');
    }
  };

  const saveClientes = async (clientesData) => {
    try {
      const dataToSave = clientesData.map(cliente => ({
        ...cliente,
        dataNascimento: cliente.dataNascimento.toISOString().split('T')[0],
      }));
      await AsyncStorage.setItem('clientes', JSON.stringify(dataToSave));
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao salvar clientes:', error);
      Alert.alert('Erro', 'Erro ao salvar dados dos clientes');
    }
  };

  // --- Funções de formatação e validação ---
  const isCNPJ = (text) => {
    const cleanText = text.replace(/\D/g, '');
    return cleanText.length >= 11 && /^\d+$/.test(cleanText);
  };

  const formatCNPJ = (cnpj) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  const formatCEP = (cep) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length <= 8) {
      return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  };

  const formatTelefone = (telefone) => {
    const cleaned = telefone.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 7) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}`;
    } else if (cleaned.length > 7 && cleaned.length <= 11) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
    } else if (cleaned.length > 11) {
      formatted = cleaned.substring(0, 11);
      formatted = `(${formatted.substring(0, 2)}) ${formatted.substring(2, 7)}-${formatted.substring(7, 11)}`;
    }
    return formatted;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getEnderecoCompleto = (cliente) => {
    const end = cliente.endereco;
    if (!end || !end.logradouro) return '-';
    
    const partes = [
      end.logradouro,
      end.numero,
      end.bairro,
      end.cidade,
      end.estado
    ].filter(Boolean);
    
    return partes.join(', ');
  };

  // Função para obter o valor do campo, tratando casos especiais
  const getFieldValue = (item, fieldKey) => {
    switch (fieldKey) {
      case 'cidade':
        return item.endereco?.cidade || '-';
      case 'estado':
        return item.endereco?.estado || '-';
      case 'dataNascimento':
        return item.dataNascimento instanceof Date 
          ? item.dataNascimento.toLocaleDateString('pt-BR')
          : '-';
      case 'enderecoCompleto':
        return getEnderecoCompleto(item);
      default:
        return item[fieldKey] || '-';
    }
  };
  // --- Fim das Funções de formatação e validação ---

  // Filtrar clientes baseado na busca
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

  // Função para alternar seleção de campo (filtro de colunas)
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

  // Função para lidar com o fechamento dos modais
  const fecharModalCadastro = () => {
    setNovoCliente(INITIAL_CLIENTE_STATE);
    setShowCadastroModal(false);
  };

  // Atualizar campo de endereço
  const updateEndereco = (field, value) => {
    setNovoCliente({
      ...novoCliente,
      endereco: {
        ...novoCliente.endereco,
        [field]: value
      }
    });
  };

  // Função para salvar novo cliente ou editar cliente existente
  const handleSalvarCliente = async () => {
    // Validações
    if (!novoCliente.cnpj || !novoCliente.nomeFantasia || !novoCliente.razaoSocial) {
      Alert.alert('Erro', 'CNPJ, Nome Fantasia e Razão Social são obrigatórios!');
      return;
    }

    if (novoCliente.email && !isValidEmail(novoCliente.email)) {
      Alert.alert('Erro', 'Email inválido!');
      return;
    }

    const cnpjLimpo = novoCliente.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      Alert.alert('Erro', 'CNPJ deve ter 14 dígitos!');
      return;
    }

    const clienteExistente = clientes.find(cliente =>
      (cliente.cnpj || '').replace(/\D/g, '') === cnpjLimpo && cliente.id !== novoCliente.id
    );

    if (clienteExistente) {
      Alert.alert('Erro', 'CNPJ já cadastrado!');
      return;
    }

    try {
      const clienteFormatado = {
        ...novoCliente,
        id: novoCliente.id || Date.now(),
        cnpj: formatCNPJ(novoCliente.cnpj),
        telefone: formatTelefone(novoCliente.telefone),
        dataNascimento: novoCliente.dataNascimento,
        endereco: {
          ...novoCliente.endereco,
          cep: formatCEP(novoCliente.endereco.cep)
        }
      };

      let novosClientes;

      if (isEditing) {
        novosClientes = clientes.map(c =>
          c.id === clienteFormatado.id ? clienteFormatado : c
        );
      } else {
        clienteFormatado.dataCadastro = new Date().toISOString();
        novosClientes = [clienteFormatado, ...clientes];
      }

      await saveClientes(novosClientes);
      fecharModalCadastro();
      Alert.alert('Sucesso', `Cliente ${isEditing ? 'editado' : 'cadastrado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      Alert.alert('Erro', `Erro ao ${isEditing ? 'editar' : 'cadastrar'} cliente`);
    }
  };

  // Função para iniciar a edição
  const iniciarEdicao = (cliente) => {
    const dataNascimento = cliente.dataNascimento
      ? new Date(cliente.dataNascimento)
      : new Date();

    setNovoCliente({
      ...cliente,
      dataNascimento: dataNascimento,
      endereco: cliente.endereco || INITIAL_CLIENTE_STATE.endereco
    });
    setShowCadastroModal(true);
  };

  // Função para deletar cliente
  const deletarCliente = (id) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja deletar este cliente?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Deletar",
          onPress: async () => {
            const novosClientes = clientes.filter(c => c.id !== id);
            await saveClientes(novosClientes);
            Alert.alert("Sucesso", "Cliente deletado com sucesso!");
          },
          style: "destructive"
        }
      ]
    );
  };

  // Componente para renderizar cada linha da tabela
  const renderClienteItem = ({ item }) => (
    <View style={styles.tableRow}>
      {selectedFields.map(fieldKey => (
        <View key={fieldKey} style={styles.tableCell}>
          <Text style={styles.cellText} numberOfLines={2}>
            {getFieldValue(item, fieldKey)}
          </Text>
        </View>
      ))}
      <View style={styles.actionCell}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => iniciarEdicao(item)}
        >
          <Edit size={18} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => deletarCliente(item.id)}
        >
          <X size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar cabeçalho da tabela
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      {selectedFields.map(fieldKey => {
        const field = availableFields.find(f => f.key === fieldKey);
        const cellStyle = { flex: 1 };
        return (
          <View key={fieldKey} style={[styles.tableCell, cellStyle]}>
            <Text style={styles.headerText}>{field?.label}</Text>
          </View>
        );
      })}
      <View style={styles.actionHeader}>
        <Text style={styles.headerText}>Ações</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setNovoCliente(INITIAL_CLIENTE_STATE);
            setShowCadastroModal(true);
          }}
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
            placeholder="Buscar por nome, razão social ou CNPJ..."
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
              <Text style={styles.modalTitleSmall}>Selecionar Colunas</Text>
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

      {/* Modal de Cadastro/Edição */}
      <Modal
        visible={showCadastroModal}
        animationType="slide"
        transparent={true}
        onRequestClose={fecharModalCadastro}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cadastroModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Cliente' : 'Cadastrar Cliente'}
              </Text>

              {/* Seção de Dados Principais */}
              <Text style={styles.sectionTitle}>Dados Principais</Text>

              <Text style={styles.inputLabel}>CNPJ *</Text>
              <TextInput
                style={styles.input}
                placeholder="00.000.000/0000-00"
                value={novoCliente.cnpj}
                onChangeText={(text) => setNovoCliente({...novoCliente, cnpj: formatCNPJ(text)})}
                keyboardType="numeric"
                maxLength={18}
              />

              <Text style={styles.inputLabel}>Nome Fantasia *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome fantasia da empresa"
                value={novoCliente.nomeFantasia}
                onChangeText={(text) => setNovoCliente({...novoCliente, nomeFantasia: text})}
              />

              <Text style={styles.inputLabel}>Razão Social *</Text>
              <TextInput
                style={styles.input}
                placeholder="Razão social da empresa"
                value={novoCliente.razaoSocial}
                onChangeText={(text) => setNovoCliente({...novoCliente, razaoSocial: text})}
              />

              <Text style={styles.inputLabel}>Inscrição Estadual</Text>
              <TextInput
                style={styles.input}
                placeholder="Inscrição estadual"
                value={novoCliente.inscricaoEstadual}
                onChangeText={(text) => setNovoCliente({...novoCliente, inscricaoEstadual: text})}
              />

              {/* Seção de Endereço */}
              <Text style={styles.sectionTitle}>Endereço</Text>

              <Text style={styles.inputLabel}>CEP</Text>
              <TextInput
                style={styles.input}
                placeholder="00000-000"
                value={novoCliente.endereco.cep}
                onChangeText={(text) => updateEndereco('cep', formatCEP(text))}
                keyboardType="numeric"
                maxLength={9}
              />

              <Text style={styles.inputLabel}>Logradouro</Text>
              <TextInput
                style={styles.input}
                placeholder="Rua, Avenida, etc."
                value={novoCliente.endereco.logradouro}
                onChangeText={(text) => updateEndereco('logradouro', text)}
              />

              <View style={styles.rowInputs}>
                <View style={styles.smallInputContainer}>
                  <Text style={styles.inputLabel}>Número</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    value={novoCliente.endereco.numero}
                    onChangeText={(text) => updateEndereco('numero', text)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.largeInputContainer}>
                  <Text style={styles.inputLabel}>Complemento</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Apto, Sala, etc."
                    value={novoCliente.endereco.complemento}
                    onChangeText={(text) => updateEndereco('complemento', text)}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Bairro</Text>
              <TextInput
                style={styles.input}
                placeholder="Bairro"
                value={novoCliente.endereco.bairro}
                onChangeText={(text) => updateEndereco('bairro', text)}
              />

              <View style={styles.rowInputs}>
                <View style={styles.largeInputContainer}>
                  <Text style={styles.inputLabel}>Cidade</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Cidade"
                    value={novoCliente.endereco.cidade}
                    onChangeText={(text) => updateEndereco('cidade', text)}
                  />
                </View>

                <View style={styles.smallInputContainer}>
                  <Text style={styles.inputLabel}>UF</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="SP"
                    value={novoCliente.endereco.estado}
                    onChangeText={(text) => updateEndereco('estado', text.toUpperCase())}
                    maxLength={2}
                  />
                </View>
              </View>

              {/* Seção de Contato */}
              <Text style={styles.sectionTitle}>Contato</Text>

              <Text style={styles.inputLabel}>Nome do Comprador</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome da pessoa responsável pelas compras"
                value={novoCliente.nomeComprador}
                onChangeText={(text) => setNovoCliente({...novoCliente, nomeComprador: text})}
              />

              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="email@empresa.com"
                value={novoCliente.email}
                onChangeText={(text) => setNovoCliente({...novoCliente, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput
                style={styles.input}
                placeholder="(11) 99999-9999"
                value={novoCliente.telefone}
                onChangeText={(text) => setNovoCliente({...novoCliente, telefone: formatTelefone(text)})}
                keyboardType="phone-pad"
                maxLength={15}
              />

              <Text style={styles.inputLabel}>Data de Nascimento (Comprador)</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {novoCliente.dataNascimento.toLocaleDateString('pt-BR')}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={novoCliente.dataNascimento}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setNovoCliente({...novoCliente, dataNascimento: selectedDate});
                    }
                  }}
                />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={fecharModalCadastro}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSalvarCliente}
                >
                  <Text style={styles.saveButtonText}>{isEditing ? 'Salvar Edição' : 'Salvar Cliente'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    overflow: 'hidden',
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
    textAlign: 'center',
  },
  cellText: {
    color: '#666',
    fontSize: 13,
  },
  actionCell: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionHeader: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
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
    overflow: 'hidden',
  },
  cadastroModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '95%',
    maxHeight: '95%',
    paddingVertical: 10,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  modalTitleSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
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

export default ClientesScreen;