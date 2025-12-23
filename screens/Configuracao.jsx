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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import database from '../database/database';
import migrationService from '../database/migrationService';

const ConfiguracaoScreen = () => {
  const [settings, setSettings] = useState({
    notificacoesPedidos: true,
    notificacoesClientes: true,
    temaEscuro: false,
    moedaPadrao: 'BRL',
    empresaNome: '',
    empresaCNPJ: '', 
    empresaEmail: '',
    empresaTelefone: '',
    empresaEndereco: '',
    empresaLogoUri: null,
  });

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [tempCompanyData, setTempCompanyData] = useState({});

  useEffect(() => {
    loadSettings();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Precisamos de permissão para acessar suas fotos para você poder selecionar a logo da empresa.'
      );
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await database.getAllConfiguracoes();
      
      if (savedSettings && Object.keys(savedSettings).length > 0) {
        const parsedSettings = {};
        
        // Parse cada configuração
        for (const [key, value] of Object.entries(savedSettings)) {
          try {
            // Tenta fazer parse do JSON
            parsedSettings[key] = JSON.parse(value);
          } catch {
            // Se não for JSON, usa o valor direto
            parsedSettings[key] = value;
          }
        }
        
        setSettings((prevSettings) => ({ ...prevSettings, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      Alert.alert('Erro', 'Erro ao carregar configurações');
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      // Salva cada configuração individualmente
      for (const [key, value] of Object.entries(newSettings)) {
        await database.setConfiguracao(key, JSON.stringify(value));
      }
      
      setSettings(newSettings);
      console.log('✅ Configurações salvas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      Alert.alert('Erro', 'Erro ao salvar configurações');
    }
  };

  const handleToggleSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permissão Negada',
            'Não foi possível acessar a galeria. Por favor, habilite as permissões nas configurações do dispositivo.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        if (selectedImage.base64) {
          const imageDataUri = `data:image/jpeg;base64,${selectedImage.base64}`;
          
          setTempCompanyData(prev => ({ 
            ...prev, 
            logoUri: imageDataUri 
          }));
          
          Alert.alert('Sucesso', 'Logo selecionada com sucesso!');
        } else {
          setTempCompanyData(prev => ({ 
            ...prev, 
            logoUri: selectedImage.uri 
          }));
          
          Alert.alert('Sucesso', 'Logo selecionada com sucesso!');
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível abrir a galeria. Tente novamente.');
    }
  };

  const exportData = async () => {
    try {
      const clientes = await database.getAllClientes();
      const produtos = await database.getAllProdutos();
      const pedidos = await database.getAllPedidos();
      const industrias = await database.getAllIndustrias();

      const data = {
        clientes: clientes || [],
        produtos: produtos || [],
        pedidos: pedidos || [],
        industrias: industrias || [],
        dataExportacao: new Date().toISOString(),
      };

      Alert.alert(
        'Dados Exportados',
        `Dados exportados com sucesso!\n\n` +
        `Clientes: ${data.clientes.length}\n` +
        `Produtos: ${data.produtos.length}\n` +
        `Pedidos: ${data.pedidos.length}\n` +
        `Indústrias: ${data.industrias.length}`,
        [{ text: 'OK' }]
      );
      setShowExportModal(false);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
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
              // Deletar todos os dados do SQLite
              const clientes = await database.getAllClientes();
              const produtos = await database.getAllProdutos();
              const pedidos = await database.getAllPedidos();
              const industrias = await database.getAllIndustrias();

              // Deletar clientes
              for (const cliente of clientes) {
                await database.deleteCliente(cliente.id);
              }

              // Deletar produtos
              for (const produto of produtos) {
                await database.deleteProduto(produto.id);
              }

              // Deletar pedidos
              for (const pedido of pedidos) {
                await database.deletePedido(pedido.id);
              }

              // Deletar indústrias
              for (const industria of industrias) {
                await database.deleteIndustria(industria.id);
              }

              // Resetar configurações para valores padrão
              const defaultSettings = {
                notificacoesPedidos: true, 
                notificacoesClientes: true, 
                temaEscuro: false, 
                moedaPadrao: 'BRL',
                empresaNome: '', 
                empresaCNPJ: '', 
                empresaEmail: '', 
                empresaTelefone: '', 
                empresaEndereco: '', 
                empresaLogoUri: null,
              };

              await saveSettings(defaultSettings);

              // Resetar flag de migração
              await database.setConfiguracao('migrated_from_async_storage', 'false');

              Alert.alert('Sucesso', 'Todos os dados foram limpos');
            } catch (error) {
              console.error('Erro ao limpar dados:', error);
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
      empresaNome: tempCompanyData.nome !== undefined ? tempCompanyData.nome : settings.empresaNome,
      empresaCNPJ: tempCompanyData.cnpj !== undefined ? tempCompanyData.cnpj : settings.empresaCNPJ,
      empresaEmail: tempCompanyData.email !== undefined ? tempCompanyData.email : settings.empresaEmail,
      empresaTelefone: tempCompanyData.telefone !== undefined ? tempCompanyData.telefone : settings.empresaTelefone,
      empresaEndereco: tempCompanyData.endereco !== undefined ? tempCompanyData.endereco : settings.empresaEndereco,
      empresaLogoUri: tempCompanyData.logoUri !== undefined ? tempCompanyData.logoUri : settings.empresaLogoUri,
    };
    saveSettings(newSettings);
    setShowCompanyModal(false);
    setTempCompanyData({});
    Alert.alert('Sucesso', 'Dados da empresa salvos com sucesso!');
  };

  const removeLogo = () => {
    Alert.alert(
      'Remover Logo',
      'Deseja remover a logo da empresa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setTempCompanyData(prev => ({ ...prev, logoUri: null }));
          }
        }
      ]
    );
  };

  const showDataStats = async () => {
    try {
      const stats = await migrationService.getDataSize();
      
      if (stats) {
        Alert.alert(
          'Estatísticas do Banco de Dados',
          `Dados armazenados:\n\n` +
          `📊 Clientes: ${stats.clientes}\n` +
          `📦 Produtos: ${stats.produtos}\n` +
          `🏭 Indústrias: ${stats.industrias}\n` +
          `🛒 Pedidos: ${stats.pedidos}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      Alert.alert('Erro', 'Erro ao obter estatísticas do banco de dados');
    }
  };

  const SettingItem = ({ title, subtitle, rightComponent, onPress }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress} 
      disabled={!onPress} 
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.settingRight}>{rightComponent}</View>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configurações</Text>
      </View>

      {/* Notificações */}
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

      {/* Aparência */}
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

      {/* Dados da Empresa */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados da Empresa</Text>
        
        <SettingItem
          title="Informações da Empresa"
          subtitle={settings.empresaNome || "Configure os dados da sua empresa"}
          onPress={() => {
            setTempCompanyData({
              nome: settings.empresaNome,
              cnpj: settings.empresaCNPJ,
              email: settings.empresaEmail,
              telefone: settings.empresaTelefone,
              endereco: settings.empresaEndereco,
              logoUri: settings.empresaLogoUri,
            });
            setShowCompanyModal(true);
          }}
          rightComponent={<Text style={styles.arrow}>›</Text>}
        />
      </View>

      {/* Gerenciamento de Dados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerenciamento de Dados</Text>
        
        <SettingItem
          title="Estatísticas do Banco"
          subtitle="Ver quantidade de dados armazenados"
          onPress={showDataStats}
          rightComponent={<Text style={styles.arrow}>›</Text>}
        />
        
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

      {/* Sobre */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        
        <SettingItem
          title="Versão do Aplicativo"
          subtitle="2.0.0 (SQLite)"
        />
        
        <SettingItem
          title="Banco de Dados"
          subtitle="SQLite (Migrado)"
        />
        
        <SettingItem
          title="Desenvolvido por"
          subtitle="SalesHub Team"
        />
      </View>

      {/* Modal de Dados da Empresa */}
      <Modal visible={showCompanyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Dados da Empresa</Text>
              
              <Text style={styles.inputLabel}>Logo da Empresa</Text>
              <TouchableOpacity style={styles.logoPicker} onPress={handleImagePicker}>
                {tempCompanyData.logoUri ? (
                  <View style={styles.logoPreviewContainer}>
                    <Image 
                      source={{ uri: tempCompanyData.logoUri }} 
                      style={styles.logoPreview} 
                      resizeMode="contain" 
                    />
                    <TouchableOpacity 
                      style={styles.removeLogoButton}
                      onPress={removeLogo}
                    >
                      <Text style={styles.removeLogoText}>✕ Remover</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.logoPlaceholderContainer}>
                    <Text style={styles.logoPlaceholderIcon}>📷</Text>
                    <Text style={styles.logoPlaceholder}>Clique para selecionar a Logo</Text>
                    <Text style={styles.logoPlaceholderHint}>Formatos: JPG, PNG</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>Nome da Empresa</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome da sua empresa"
                value={tempCompanyData.nome}
                onChangeText={(text) => setTempCompanyData({...tempCompanyData, nome: text})}
              />
              
              <Text style={styles.inputLabel}>CNPJ (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="00.000.000/0000-00"
                value={tempCompanyData.cnpj}
                onChangeText={(text) => setTempCompanyData({...tempCompanyData, cnpj: text})}
                keyboardType="numeric"
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
              
              <Text style={styles.inputLabel}>Telefone/Whatsapp</Text>
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

      {/* Modal de Exportação */}
      <Modal visible={showExportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.exportModalContainer}>
            <Text style={styles.modalTitle}>Exportar Dados</Text>
            <Text style={styles.exportDescription}>
              Esta função irá criar um backup de todos os seus dados (clientes, produtos, pedidos e indústrias).
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

      <View style={{ height: 100 }} />
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
  logoPicker: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  logoPlaceholderContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoPlaceholderIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  logoPlaceholder: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  logoPlaceholderHint: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  logoPreviewContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoPreview: {
    width: '90%',
    height: 100,
  },
  removeLogoButton: {
    marginTop: 10,
    backgroundColor: '#F44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeLogoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ConfiguracaoScreen;