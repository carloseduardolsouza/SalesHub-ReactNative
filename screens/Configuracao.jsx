import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ConfiguracaoScreen = () => {
  const [settings, setSettings] = useState({
    notificacoesPedidos: true,
    notificacoesClientes: true,
    temaEscuro: false,
    moedaPadrao: 'BRL',
    empresaNome: '',
    empresaEmail: '',
    empresaTelefone: '',
    empresaEndereco: '',
  });

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [tempCompanyData, setTempCompanyData] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Erro ao salvar configurações');
    }
  };

  const handleToggleSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const exportData = async () => {
    try {
      const clientes = await AsyncStorage.getItem('clientes');
      const produtos = await AsyncStorage.getItem('produtos');
      const pedidos = await AsyncStorage.getItem('pedidos');

      const data = {
        clientes: clientes ? JSON.parse(clientes) : [],
        produtos: produtos ? JSON.parse(produtos) : [],
        pedidos: pedidos ? JSON.parse(pedidos) : [],
        dataExportacao: new Date().toISOString(),
      };

      // Em um app real, você implementaria a exportação para arquivo
      Alert.alert(
        'Dados Exportados',
        `Dados exportados com sucesso!\n\nClientes: ${data.clientes.length}\nProdutos: ${data.produtos.length}\nPedidos: ${data.pedidos.length}`,
        [{ text: 'OK' }]
      );
      setShowExportModal(false);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao exportar dados');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Limpar Todos os Dados',
      'Esta ação irá apagar todos os dados do aplicativo. Esta ação não pode ser desfeita. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['clientes', 'produtos', 'pedidos']);
              Alert.alert('Sucesso', 'Todos os dados foram limpos');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao limpar dados');
            }
          },
        },
      ]
    );
  };

  const saveCompanyData = () => {
    const newSettings = {
      ...settings,
      empresaNome: tempCompanyData.nome || settings.empresaNome,
      empresaEmail: tempCompanyData.email || settings.empresaEmail,
      empresaTelefone: tempCompanyData.telefone || settings.empresaTelefone,
      empresaEndereco: tempCompanyData.endereco || settings.empresaEndereco,
    };
    saveSettings(newSettings);
    setShowCompanyModal(false);
    setTempCompanyData({});
    Alert.alert('Sucesso', 'Dados da empresa salvos com sucesso!');
  };

  const SettingItem = ({ title, subtitle, rightComponent, onPress }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.settingRight}>{rightComponent}</View>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configurações</Text>
      </View>

      {/* Notificações Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>
        
        <SettingItem
          title="Notificações de Pedidos"
          subtitle="Receber notificações sobre novos pedidos"
          rightComponent={
            <Switch
              value={settings.notificacoesPedidos}
              onValueChange={(value) => handleToggleSetting('notificacoesPedidos', value)}
              trackColor={{ false: '#767577', true: '#2196F3' }}
              thumbColor={settings.notificacoesPedidos ? '#fff' : '#f4f3f4'}
            />
          }
        />
        
        <SettingItem
          title="Notificações de Clientes"
          subtitle="Receber notificações sobre novos clientes"
          rightComponent={
            <Switch
              value={settings.notificacoesClientes}
              onValueChange={(value) => handleToggleSetting('notificacoesClientes', value)}
              trackColor={{ false: '#767577', true: '#2196F3' }}
              thumbColor={settings.notificacoesClientes ? '#fff' : '#f4f3f4'}
            />
          }
        />
      </View>

      {/* Aparência Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aparência</Text>
        
        <SettingItem
          title="Tema Escuro"
          subtitle="Ativar modo escuro do aplicativo"
          rightComponent={
            <Switch
              value={settings.temaEscuro}
              onValueChange={(value) => handleToggleSetting('temaEscuro', value)}
              trackColor={{ false: '#767577', true: '#2196F3' }}
              thumbColor={settings.temaEscuro ? '#fff' : '#f4f3f4'}
            />
          }
        />
      </View>

      {/* Empresa Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados da Empresa</Text>
        
        <SettingItem
          title="Informações da Empresa"
          subtitle={settings.empresaNome || "Configure os dados da sua empresa"}
          onPress={() => {
            setTempCompanyData({
              nome: settings.empresaNome,
              email: settings.empresaEmail,
              telefone: settings.empresaTelefone,
              endereco: settings.empresaEndereco,
            });
            setShowCompanyModal(true);
          }}
          rightComponent={<Text style={styles.arrow}>›</Text>}
        />
      </View>

      {/* Dados Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerenciamento de Dados</Text>
        
        <SettingItem
          title="Exportar Dados"
          subtitle="Fazer backup dos seus dados"
          onPress={() => setShowExportModal(true)}
          rightComponent={<Text style={styles.arrow}>›</Text>}
        />
        
        <SettingItem
          title="Limpar Todos os Dados"
          subtitle="Apagar todos os dados do aplicativo"
          onPress={clearAllData}
          rightComponent={<Text style={[styles.arrow, { color: '#F44336' }]}>›</Text>}
        />
      </View>

      {/* Sobre Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        
        <SettingItem
          title="Versão do Aplicativo"
          subtitle="1.0.0"
        />
        
        <SettingItem
          title="Desenvolvido por"
          subtitle="SalesHub Team"
        />
      </View>

      {/* Company Data Modal */}
      <Modal visible={showCompanyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={styles.modalTitle}>Dados da Empresa</Text>
              
              <Text style={styles.inputLabel}>Nome da Empresa</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome da sua empresa"
                value={tempCompanyData.nome}
                onChangeText={(text) => setTempCompanyData({...tempCompanyData, nome: text})}
              />
              
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@empresa.com"
                value={tempCompanyData.email}
                onChangeText={(text) => setTempCompanyData({...tempCompanyData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput
                style={styles.input}
                placeholder="(11) 99999-9999"
                value={tempCompanyData.telefone}
                onChangeText={(text) => setTempCompanyData({...tempCompanyData, telefone: text})}
                keyboardType="phone-pad"
              />
              
              <Text style={styles.inputLabel}>Endereço</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Endereço completo da empresa"
                value={tempCompanyData.endereco}
                onChangeText={(text) => setTempCompanyData({...tempCompanyData, endereco: text})}
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCompanyModal(false);
                    setTempCompanyData({});
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveCompanyData}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Export Data Modal */}
      <Modal visible={showExportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.exportModalContainer}>
            <Text style={styles.modalTitle}>Exportar Dados</Text>
            <Text style={styles.exportDescription}>
              Esta função irá criar um backup de todos os seus dados (clientes, produtos e pedidos).
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportButton}
                onPress={exportData}
              >
                <Text style={styles.exportButtonText}>Exportar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingRight: {
    marginLeft: 15,
  },
  arrow: {
    fontSize: 20,
    color: '#ccc',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  exportModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  exportDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
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
  exportButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
  },
  exportButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ConfiguracaoScreen;