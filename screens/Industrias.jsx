import React, { useState, useEffect, useMemo } from 'react';
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
import { Search, Filter, Plus, Check, Building, Phone, Mail, Edit2 } from 'lucide-react-native'; // Importei Edit2

const IndustriasScreen = ({ navigation }) => {
  // Estados
  const [industrias, setIndustrias] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Novo estado para o modal de edição
  const [selectedIndustria, setSelectedIndustria] = useState(null);
  const [selectedFields, setSelectedFields] = useState(['nome', 'cnpj', 'telefoneComercial']);

  // Estado do formulário de cadastro
  const [novaIndustria, setNovaIndustria] = useState({
    cnpj: '',
    nome: '',
    telefoneAssistencia: '',
    telefoneComercial: '',
    email: ''
  });

  // Estado do formulário de edição (inicializado vazio, será preenchido ao clicar em editar)
  const [industriaEmEdicao, setIndustriaEmEdicao] = useState({
    id: null,
    cnpj: '',
    nome: '',
    telefoneAssistencia: '',
    telefoneComercial: '',
    email: ''
  });

  // Opções de campos disponíveis
  const availableFields = [
    { key: 'nome', label: 'Nome da Indústria' },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'telefoneComercial', label: 'Telefone Comercial' },
    { key: 'telefoneAssistencia', label: 'Telefone Assistência' },
    { key: 'email', label: 'Email' }
  ];

  // Carregar dados do AsyncStorage
  useEffect(() => {
    loadIndustrias();
  }, []);

  const loadIndustrias = async () => {
    try {
      const industriasData = await AsyncStorage.getItem('industrias');
      if (industriasData) {
        setIndustrias(JSON.parse(industriasData));
      }
    } catch (error) {
      console.error('Erro ao carregar indústrias:', error);
      Alert.alert('Erro', 'Erro ao carregar dados das indústrias');
    }
  };

  const saveIndustrias = async (industriasData) => {
    try {
      await AsyncStorage.setItem('industrias', JSON.stringify(industriasData));
      setIndustrias(industriasData);
    } catch (error) {
      console.error('Erro ao salvar indústrias:', error);
      Alert.alert('Erro', 'Erro ao salvar dados das indústrias');
    }
  };

  // Função para detectar se é CNPJ (apenas números e formatação)
  const isCNPJ = (text) => {
    const cleanText = text.replace(/\D/g, '');
    return cleanText.length >= 11 && /^\d+$/.test(cleanText);
  };

  // Filtrar indústrias baseado na busca
  const filteredIndustrias = useMemo(() => {
    if (!searchText.trim()) return industrias;

    return industrias.filter(industria => {
      const searchLower = searchText.toLowerCase().trim();
      
      if (isCNPJ(searchText)) {
        // Se parece com CNPJ, busca apenas no CNPJ
        const cnpjNumbers = industria.cnpj.replace(/\D/g, '');
        const searchNumbers = searchText.replace(/\D/g, '');
        // Usar includes para ser mais flexível (parte do CNPJ)
        return cnpjNumbers.includes(searchNumbers); 
      } else {
        // Se não parece com CNPJ, busca no nome
        return industria.nome.toLowerCase().includes(searchLower);
      }
    });
  }, [industrias, searchText]);

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

  // Função para formatar CNPJ
  const formatCNPJ = (cnpj) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5').substring(0, 18);
    }
    return cnpj;
  };

  // Função para formatar telefone
  const formatTelefone = (telefone) => {
    const cleaned = telefone.replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.length > 2 && cleaned.length <= 6) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
    } else if (cleaned.length === 10) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`;
    } else if (cleaned.length === 11) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
    } else if (cleaned.length > 11) {
      formatted = cleaned.substring(0, 11);
      formatted = `(${formatted.substring(0, 2)}) ${formatted.substring(2, 7)}-${formatted.substring(7, 11)}`;
    } else if (cleaned.length <= 2) {
      formatted = cleaned;
    }
    
    return formatted.substring(0, 15);
  };

  // Função para validar email
  const isValidEmail = (email) => {
    if (!email) return true; // Email não é obrigatório
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Funções de Cadastro

  // Função para salvar nova indústria
  const salvarIndustria = async () => {
    // Validações obrigatórias
    if (!novaIndustria.cnpj || !novaIndustria.nome) {
      Alert.alert('Erro', 'CNPJ e Nome são obrigatórios!');
      return;
    }

    // Validar email se preenchido
    if (novaIndustria.email && !isValidEmail(novaIndustria.email)) {
      Alert.alert('Erro', 'Email inválido!');
      return;
    }

    const cnpjLimpo = novaIndustria.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      Alert.alert('Erro', 'CNPJ deve ter 14 dígitos!');
      return;
    }

    // Verificar se CNPJ já existe
    const industriaExistente = industrias.find(industria => 
      industria.cnpj.replace(/\D/g, '') === cnpjLimpo
    );

    if (industriaExistente) {
      Alert.alert('Erro', 'CNPJ já cadastrado!');
      return;
    }

    try {
      const industriaFormatada = {
        id: Date.now(),
        nome: novaIndustria.nome.trim(),
        cnpj: formatCNPJ(novaIndustria.cnpj),
        telefoneComercial: novaIndustria.telefoneComercial ? formatTelefone(novaIndustria.telefoneComercial) : '',
        telefoneAssistencia: novaIndustria.telefoneAssistencia ? formatTelefone(novaIndustria.telefoneAssistencia) : '',
        email: novaIndustria.email.trim().toLowerCase(),
        dataCadastro: new Date().toISOString()
      };

      const novasIndustrias = [industriaFormatada, ...industrias];
      await saveIndustrias(novasIndustrias);

      // Limpar formulário
      setNovaIndustria({
        cnpj: '',
        nome: '',
        telefoneAssistencia: '',
        telefoneComercial: '',
        email: ''
      });

      setShowCadastroModal(false);
      Alert.alert('Sucesso', 'Indústria cadastrada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar indústria:', error);
      Alert.alert('Erro', 'Erro ao cadastrar indústria');
    }
  };

  // Funções de Edição

  // 1. Iniciar Edição (chamada do Modal de Detalhes)
  const iniciarEdicao = () => {
    if (selectedIndustria) {
      // Pré-preencher o estado de edição com os dados atuais
      setIndustriaEmEdicao({
        id: selectedIndustria.id,
        cnpj: selectedIndustria.cnpj,
        nome: selectedIndustria.nome,
        telefoneComercial: selectedIndustria.telefoneComercial,
        telefoneAssistencia: selectedIndustria.telefoneAssistencia,
        email: selectedIndustria.email,
      });
      setShowDetailsModal(false); // Fecha o modal de detalhes
      setShowEditModal(true);     // Abre o modal de edição
    }
  };

  // 2. Salvar Edição
  const salvarEdicao = async () => {
    // Validações obrigatórias
    if (!industriaEmEdicao.cnpj || !industriaEmEdicao.nome) {
      Alert.alert('Erro', 'CNPJ e Nome são obrigatórios!');
      return;
    }

    // Validar email se preenchido
    if (industriaEmEdicao.email && !isValidEmail(industriaEmEdicao.email)) {
      Alert.alert('Erro', 'Email inválido!');
      return;
    }

    const cnpjLimpo = industriaEmEdicao.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      Alert.alert('Erro', 'CNPJ deve ter 14 dígitos!');
      return;
    }
    
    // Verificar se CNPJ já existe em OUTRA indústria
    const industriaExistente = industrias.find(industria => 
      industria.id !== industriaEmEdicao.id && industria.cnpj.replace(/\D/g, '') === cnpjLimpo
    );

    if (industriaExistente) {
      Alert.alert('Erro', 'CNPJ já cadastrado em outra indústria!');
      return;
    }

    try {
      const industriaAtualizada = {
        ...selectedIndustria, // Mantém dados como dataCadastro
        id: industriaEmEdicao.id,
        nome: industriaEmEdicao.nome.trim(),
        cnpj: formatCNPJ(industriaEmEdicao.cnpj),
        telefoneComercial: industriaEmEdicao.telefoneComercial ? formatTelefone(industriaEmEdicao.telefoneComercial) : '',
        telefoneAssistencia: industriaEmEdicao.telefoneAssistencia ? formatTelefone(industriaEmEdicao.telefoneAssistencia) : '',
        email: industriaEmEdicao.email.trim().toLowerCase(),
        dataEdicao: new Date().toISOString() // Adiciona data de edição
      };

      // Mapeia e substitui a indústria editada
      const industriasAtualizadas = industrias.map(i => 
        i.id === industriaAtualizada.id ? industriaAtualizada : i
      );

      await saveIndustrias(industriasAtualizadas);

      // Atualiza a indústria selecionada para o modal de detalhes (se o usuário for reabri-lo)
      setSelectedIndustria(industriaAtualizada); 

      setShowEditModal(false);
      Alert.alert('Sucesso', 'Indústria atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      Alert.alert('Erro', 'Erro ao atualizar indústria');
    }
  };
  
  // Função para excluir indústria
  const excluirIndustria = (industriaId) => {
    Alert.alert(
      'Excluir Indústria',
      'Tem certeza que deseja excluir esta indústria? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const industriasAtualizadas = industrias.filter(i => i.id !== industriaId);
              await saveIndustrias(industriasAtualizadas);
              setShowDetailsModal(false);
              setSelectedIndustria(null); // Limpa a seleção
              Alert.alert('Sucesso', 'Indústria excluída com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir indústria');
            }
          }
        }
      ]
    );
  };

  // Componente para renderizar cada linha da tabela
  const renderIndustriaItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tableRow}
      onPress={() => {
        setSelectedIndustria(item);
        setShowDetailsModal(true);
      }}
    >
      {selectedFields.map(fieldKey => (
        <View key={fieldKey} style={styles.tableCell}>
          <Text style={styles.cellText} numberOfLines={2}>
            {item[fieldKey] || '-'}
          </Text>
        </View>
      ))}
    </TouchableOpacity>
  );

  // Renderizar cabeçalho da tabela
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      {selectedFields.map(fieldKey => {
        const field = availableFields.find(f => f.key === fieldKey);
        // Calcula a flexibilidade da coluna (ex: CNPJ um pouco maior)
        const cellStyle = fieldKey === 'cnpj' 
          ? {...styles.tableCell, flex: 1.2} 
          : styles.tableCell; 

        return (
          <View key={fieldKey} style={cellStyle}>
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
        <Text style={styles.title}>Indústrias</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCadastroModal(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Nova Indústria</Text>
        </TouchableOpacity>
      </View>

      {/* Controles de busca e filtro */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou CNPJ..."
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

      {/* Contador de indústrias */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {filteredIndustrias.length} indústria(s) encontrada(s)
        </Text>
      </View>

      {/* Tabela */}
      <View style={styles.tableContainer}>
        {renderTableHeader()}
        <FlatList
          data={filteredIndustrias}
          renderItem={renderIndustriaItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Building size={60} color="#ccc" />
              <Text style={styles.emptyText}>Nenhuma indústria encontrada</Text>
              <Text style={styles.emptySubtext}>
                Toque em "Nova Indústria" para cadastrar
              </Text>
            </View>
          }
        />
      </View>

      {/* Modal de Filtros (Sem alterações) */}
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

      {/* Modal de Cadastro (Sem alterações de lógica, apenas de estilo) */}
      <Modal
        visible={showCadastroModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCadastroModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cadastroModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Cadastrar Nova Indústria</Text>

              <Text style={styles.inputLabel}>CNPJ *</Text>
              <TextInput
                style={styles.input}
                placeholder="00.000.000/0000-00"
                value={novaIndustria.cnpj}
                onChangeText={(text) => setNovaIndustria({...novaIndustria, cnpj: formatCNPJ(text)})}
                keyboardType="numeric"
                maxLength={18}
              />

              <Text style={styles.inputLabel}>Nome da Indústria *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Apple Inc., Samsung Electronics..."
                value={novaIndustria.nome}
                onChangeText={(text) => setNovaIndustria({...novaIndustria, nome: text})}
              />

              <Text style={styles.inputLabel}>Telefone Comercial</Text>
              <TextInput
                style={styles.input}
                placeholder="(11) 99999-9999"
                value={novaIndustria.telefoneComercial}
                onChangeText={(text) => setNovaIndustria({...novaIndustria, telefoneComercial: formatTelefone(text)})}
                keyboardType="phone-pad"
                maxLength={15}
              />

              <Text style={styles.inputLabel}>Telefone Assistência Técnica</Text>
              <TextInput
                style={styles.input}
                placeholder="(11) 88888-8888"
                value={novaIndustria.telefoneAssistencia}
                onChangeText={(text) => setNovaIndustria({...novaIndustria, telefoneAssistencia: formatTelefone(text)})}
                keyboardType="phone-pad"
                maxLength={15}
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="contato@industria.com"
                value={novaIndustria.email}
                onChangeText={(text) => setNovaIndustria({...novaIndustria, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.requiredFieldsNote}>
                * Campos obrigatórios
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCadastroModal(false);
                    setNovaIndustria({ // Limpa o formulário ao cancelar
                      cnpj: '',
                      nome: '',
                      telefoneAssistencia: '',
                      telefoneComercial: '',
                      email: ''
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={salvarIndustria}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Detalhes (Adicionado botão Editar) */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedIndustria && (
                <>
                  <Text style={styles.modalTitle}>Detalhes da Indústria</Text>

                  <View style={styles.detailCard}>
                    <Building size={40} color="#007AFF" style={styles.detailIcon} />
                    <Text style={styles.detailName}>{selectedIndustria.nome}</Text>
                    <Text style={styles.detailCnpj}>{selectedIndustria.cnpj}</Text>
                  </View>

                  {selectedIndustria.telefoneComercial ? (
                    <View style={styles.contactItem}>
                      <Phone size={20} color="#4CAF50" />
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>Telefone Comercial</Text>
                        <Text style={styles.contactValue}>{selectedIndustria.telefoneComercial}</Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedIndustria.telefoneAssistencia ? (
                    <View style={styles.contactItem}>
                      <Phone size={20} color="#FF9800" />
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>Telefone Assistência</Text>
                        <Text style={styles.contactValue}>{selectedIndustria.telefoneAssistencia}</Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedIndustria.email ? (
                    <View style={styles.contactItem}>
                      <Mail size={20} color="#9C27B0" />
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>Email</Text>
                        <Text style={styles.contactValue}>{selectedIndustria.email}</Text>
                      </View>
                    </View>
                  ) : null}

                  <Text style={styles.cadastroDate}>
                    Cadastrado em: {new Date(selectedIndustria.dataCadastro).toLocaleDateString('pt-BR')}
                    {selectedIndustria.dataEdicao && ` (Editado em: ${new Date(selectedIndustria.dataEdicao).toLocaleDateString('pt-BR')})`}
                  </Text>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => excluirIndustria(selectedIndustria.id)}
                    >
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.editButton} // Novo botão de edição
                      onPress={iniciarEdicao}
                    >
                      <Edit2 size={18} color="#fff" />
                      <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.closeDetailsButton}
                      onPress={() => setShowDetailsModal(false)}
                    >
                      <Text style={styles.closeButtonText}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* NOVO: Modal de Edição */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cadastroModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Editar Indústria</Text>

              <Text style={styles.inputLabel}>CNPJ *</Text>
              <TextInput
                style={styles.input}
                placeholder="00.000.000/0000-00"
                value={industriaEmEdicao.cnpj}
                onChangeText={(text) => setIndustriaEmEdicao({...industriaEmEdicao, cnpj: formatCNPJ(text)})}
                keyboardType="numeric"
                maxLength={18}
              />

              <Text style={styles.inputLabel}>Nome da Indústria *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Apple Inc., Samsung Electronics..."
                value={industriaEmEdicao.nome}
                onChangeText={(text) => setIndustriaEmEdicao({...industriaEmEdicao, nome: text})}
              />

              <Text style={styles.inputLabel}>Telefone Comercial</Text>
              <TextInput
                style={styles.input}
                placeholder="(11) 99999-9999"
                value={industriaEmEdicao.telefoneComercial}
                onChangeText={(text) => setIndustriaEmEdicao({...industriaEmEdicao, telefoneComercial: formatTelefone(text)})}
                keyboardType="phone-pad"
                maxLength={15}
              />

              <Text style={styles.inputLabel}>Telefone Assistência Técnica</Text>
              <TextInput
                style={styles.input}
                placeholder="(11) 88888-8888"
                value={industriaEmEdicao.telefoneAssistencia}
                onChangeText={(text) => setIndustriaEmEdicao({...industriaEmEdicao, telefoneAssistencia: formatTelefone(text)})}
                keyboardType="phone-pad"
                maxLength={15}
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="contato@industria.com"
                value={industriaEmEdicao.email}
                onChangeText={(text) => setIndustriaEmEdicao({...industriaEmEdicao, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.requiredFieldsNote}>
                * Campos obrigatórios
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={salvarEdicao}
                >
                  <Text style={styles.saveButtonText}>Salvar Edição</Text>
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
  counterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  counterText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
    flex: 1, // Padrão
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
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
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
    overflow: 'hidden', // Garante que o conteúdo fique dentro do border radius
  },
  cadastroModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '95%',
    maxHeight: '90%',
    overflow: 'hidden',
    paddingBottom: 10, // Para evitar que o botão fique grudado
  },
  detailsModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '85%',
    paddingBottom: 10,
    overflow: 'hidden',
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
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
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
  requiredFieldsNote: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  detailCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  detailIcon: {
    marginBottom: 10,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  detailCnpj: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'monospace',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactInfo: {
    marginLeft: 15,
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  cadastroDate: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
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
  deleteButton: {
    flex: 1,
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 15,
  },
  deleteButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FFC107',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  closeDetailsButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
  },
});

export default IndustriasScreen;