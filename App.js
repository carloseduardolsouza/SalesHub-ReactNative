import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, StatusBar, View, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
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
  const [migrationError, setMigrationError] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setMigrationStatus('Inicializando banco de dados...');
      
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
        setMigrationStatus('Migrando dados do AsyncStorage para SQLite...');
        console.log('🔄 Starting data migration...');
        
        const migrationResult = await migrationService.migrateFromAsyncStorage();
        
        if (migrationResult.success) {
          if (migrationResult.alreadyMigrated) {
            console.log('✅ Data already migrated');
            setMigrationStatus('Dados já migrados anteriormente');
          } else {
            console.log('✅ Migration completed successfully');
            console.log('📊 Stats:', migrationResult.stats);
            
            // Verificar se houve erros
            const hasErrors = migrationResult.stats.errors.length > 0;
            
            // Mostrar resumo da migração
            Alert.alert(
              hasErrors ? '⚠️ Migração Concluída com Avisos' : '✅ Migração Concluída',
              `Dados migrados:\n\n` +
              `• ${migrationResult.stats.clientes} clientes\n` +
              `• ${migrationResult.stats.produtos} produtos\n` +
              `• ${migrationResult.stats.industrias} indústrias\n` +
              `• ${migrationResult.stats.pedidos} pedidos\n` +
              `• ${migrationResult.stats.configuracoes} configurações\n\n` +
              `${hasErrors 
                ? `⚠️ ${migrationResult.stats.errors.length} erro(s):\n${migrationResult.stats.errors.slice(0, 3).map(e => `• ${e.type}: ${e.error}`).join('\n')}` 
                : '✅ Migração completa sem erros!'}`
            );
          }
        } else {
          console.error('❌ Migration failed:', migrationResult.error);
          setMigrationError(true);
          Alert.alert(
            '❌ Erro na Migração',
            `Houve um erro ao migrar os dados:\n\n${migrationResult.error}\n\nO app continuará funcionando, mas alguns dados podem não ter sido migrados.`,
            [
              { text: 'Continuar', onPress: () => setMigrationError(false) }
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
      setMigrationError(true);
      Alert.alert(
        '❌ Erro',
        `Erro ao inicializar o aplicativo:\n\n${error.message}\n\nTente reiniciar o app.`,
        [
          { 
            text: 'Reiniciar', 
            onPress: () => {
              setIsInitializing(true);
              setMigrationError(false);
              setTimeout(() => initializeApp(), 500);
            }
          },
          {
            text: 'Continuar',
            onPress: () => setIsInitializing(false)
          }
        ]
      );
    }
  };

  const retryMigration = async () => {
    setIsInitializing(true);
    setMigrationError(false);
    await migrationService.resetMigration();
    setTimeout(() => initializeApp(), 500);
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{migrationStatus}</Text>
        {migrationError && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={retryMigration}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
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
  retryButton: {
    marginTop: 20,
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