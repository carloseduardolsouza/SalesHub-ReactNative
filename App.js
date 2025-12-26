import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  StyleSheet, 
  StatusBar, 
  View, 
  Text, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Importar banco de dados e migração
import database from './database/database';
import migrationService from './database/migrationService';

// Importar todas as telas
import HomeScreen from './screens/Home';
import ClientesScreen from './screens/Clientes/index';
import PedidosScreen from './screens/PedidosScreen/index';
import ProdutosScreen from './screens/Produtos/index';
import ConfiguracaoScreen from './screens/Configuracao';
import IndustriasScreen from './screens/Industrias';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabRoutes() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Clientes') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Pedidos') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Produtos') {
            iconName = focused ? 'bag' : 'bag-outline';
          } else if (route.name === 'Configuração') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Clientes" component={ClientesScreen} />
      <Tab.Screen name="Pedidos" component={PedidosScreen} />
      <Tab.Screen name="Produtos" component={ProdutosScreen} />
      <Tab.Screen name="Configuração" component={ConfiguracaoScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [migrationError, setMigrationError] = useState(null);
  const [migrationDetails, setMigrationDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setMigrationStatus('Inicializando banco de dados...');
      setMigrationError(null);
      setMigrationDetails(null);
      
      // Inicializar banco de dados
      const dbInitialized = await database.init();
      if (!dbInitialized) {
        throw new Error('Falha ao inicializar banco de dados');
      }

      // Verificar dados do AsyncStorage (debug)
      setMigrationStatus('Verificando AsyncStorage...');
      const asyncStorageData = await migrationService.checkAsyncStorageData();
      console.log('📊 AsyncStorage Data Check:', asyncStorageData);

      // Verificar se precisa migrar
      const alreadyMigrated = await migrationService.checkMigrationStatus();
      
      if (!alreadyMigrated) {
        // Criar backup antes de migrar
        setMigrationStatus('Criando backup dos dados...');
        const backupResult = await migrationService.createBackup();
        console.log('💾 Backup result:', backupResult);

        setMigrationStatus('Migrando dados do AsyncStorage para SQLite...');
        console.log('🔄 Starting data migration...');
        
        const migrationResult = await migrationService.migrateFromAsyncStorage();
        setMigrationDetails(migrationResult);
        
        if (migrationResult.success) {
          if (migrationResult.alreadyMigrated) {
            console.log('✅ Data already migrated');
            setMigrationStatus('Dados já migrados anteriormente');
          } else {
            console.log('✅ Migration completed successfully');
            console.log('📊 Stats:', migrationResult.stats);
            
            const stats = migrationResult.stats;
            const hasErrors = stats.errors.length > 0;
            const hasWarnings = stats.warnings.length > 0;
            
            // Mostrar resumo da migração
            const totalMigrated = stats.clientes + stats.produtos + 
                                 stats.industrias + stats.pedidos + stats.configuracoes;

            if (totalMigrated > 0) {
              const alertTitle = hasErrors ? '⚠️ Migração Concluída com Avisos' : '✅ Migração Concluída';
              const alertMessage = 
                `Dados migrados com sucesso:\n\n` +
                `✓ ${stats.clientes} cliente${stats.clientes !== 1 ? 's' : ''}\n` +
                `✓ ${stats.produtos} produto${stats.produtos !== 1 ? 's' : ''}\n` +
                `✓ ${stats.industrias} indústria${stats.industrias !== 1 ? 's' : ''}\n` +
                `✓ ${stats.pedidos} pedido${stats.pedidos !== 1 ? 's' : ''}\n` +
                `✓ ${stats.configuracoes} configuração${stats.configuracoes !== 1 ? 'ões' : ''}\n\n` +
                `${hasWarnings ? `⚠️ ${stats.warnings.length} aviso(s)\n` : ''}` +
                `${hasErrors ? `❌ ${stats.errors.length} erro(s)\n\n` : ''}` +
                `${hasErrors ? 'Toque em "Ver Detalhes" para mais informações.' : ''}`;

              Alert.alert(
                alertTitle,
                alertMessage,
                hasErrors ? [
                  { text: 'Ver Detalhes', onPress: () => setShowDetails(true) },
                  { text: 'OK', style: 'default' }
                ] : [
                  { text: 'OK', style: 'default' }
                ]
              );
            }
          }
        } else {
          console.error('❌ Migration failed:', migrationResult.error);
          setMigrationError(migrationResult);
          
          Alert.alert(
            '❌ Erro na Migração',
            `Houve um erro ao migrar os dados:\n\n${migrationResult.error}\n\nDeseja tentar restaurar o backup?`,
            [
              { 
                text: 'Restaurar Backup', 
                onPress: async () => {
                  setMigrationStatus('Restaurando backup...');
                  const restoreResult = await migrationService.restoreBackup();
                  if (restoreResult.success) {
                    Alert.alert('✅ Sucesso', 'Backup restaurado com sucesso!');
                  } else {
                    Alert.alert('❌ Erro', 'Não foi possível restaurar o backup.');
                  }
                  setMigrationError(null);
                }
              },
              { 
                text: 'Continuar Mesmo Assim', 
                onPress: () => setMigrationError(null),
                style: 'destructive'
              }
            ]
          );
        }
      } else {
        console.log('✅ Using existing SQLite database');
        setMigrationStatus('Usando banco de dados existente');
      }

      // Verificar dados migrados
      const dataSize = await migrationService.getDataSize();
      console.log('📊 SQLite Data:', dataSize);

      setMigrationStatus('Pronto!');
      setTimeout(() => {
        setIsInitializing(false);
      }, 500);

    } catch (error) {
      console.error('❌ Error initializing app:', error);
      setMigrationError({ error: error.message });
      
      Alert.alert(
        '❌ Erro',
        `Erro ao inicializar o aplicativo:\n\n${error.message}\n\nTente reiniciar o app.`,
        [
          { 
            text: 'Reiniciar', 
            onPress: () => {
              setIsInitializing(true);
              setMigrationError(null);
              setTimeout(() => initializeApp(), 500);
            }
          },
          {
            text: 'Continuar Mesmo Assim',
            onPress: () => {
              setIsInitializing(false);
              setMigrationError(null);
            },
            style: 'destructive'
          }
        ]
      );
    }
  };

  const retryMigration = async () => {
    setIsInitializing(true);
    setMigrationError(null);
    await migrationService.resetMigration();
    setTimeout(() => initializeApp(), 500);
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{migrationStatus}</Text>
        
        {migrationError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ Ocorreu um erro</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={retryMigration}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {showDetails && migrationDetails && (
          <ScrollView style={styles.detailsContainer}>
            <View style={styles.detailsContent}>
              <Text style={styles.detailsTitle}>Detalhes da Migração</Text>
              
              {migrationDetails.stats?.errors?.length > 0 && (
                <View style={styles.errorSection}>
                  <Text style={styles.sectionTitle}>❌ Erros:</Text>
                  {migrationDetails.stats.errors.map((error, index) => (
                    <Text key={index} style={styles.errorItem}>
                      • {error.type}: {error.error}
                      {error.nome && ` (${error.nome})`}
                    </Text>
                  ))}
                </View>
              )}

              {migrationDetails.stats?.warnings?.length > 0 && (
                <View style={styles.warningSection}>
                  <Text style={styles.sectionTitle}>⚠️ Avisos:</Text>
                  {migrationDetails.stats.warnings.slice(0, 10).map((warning, index) => (
                    <Text key={index} style={styles.warningItem}>
                      • {warning.type}: {warning.message}
                    </Text>
                  ))}
                  {migrationDetails.stats.warnings.length > 10 && (
                    <Text style={styles.moreText}>
                      ... e mais {migrationDetails.stats.warnings.length - 10} avisos
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity 
                style={styles.closeDetailsButton}
                onPress={() => setShowDetails(false)}
              >
                <Text style={styles.closeDetailsButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={TabRoutes} />
          <Stack.Screen name="Industrias" component={IndustriasScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  detailsContent: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 60,
    padding: 20,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  warningSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorItem: {
    fontSize: 14,
    color: '#c62828',
    marginBottom: 5,
  },
  warningItem: {
    fontSize: 14,
    color: '#f57c00',
    marginBottom: 5,
  },
  moreText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 5,
  },
  closeDetailsButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  closeDetailsButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    elevation: 8,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderTopWidth: 0,
  },
  tabBarItem: {
    marginTop: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
});