import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, StatusBar, View, Text, ActivityIndicator, Alert } from 'react-native';
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

      // Verificar se precisa migrar
      const alreadyMigrated = await migrationService.checkMigrationStatus();
      
      if (!alreadyMigrated) {
        setMigrationStatus('Migrando dados do AsyncStorage...');
        console.log('🔄 Starting data migration...');
        
        const migrationResult = await migrationService.migrateFromAsyncStorage();
        
        if (migrationResult.success) {
          if (migrationResult.alreadyMigrated) {
            console.log('✅ Data already migrated');
          } else {
            console.log('✅ Migration completed successfully');
            console.log('📊 Stats:', migrationResult.stats);
            
            // Mostrar resumo da migração
            Alert.alert(
              '✅ Migração Concluída',
              `Dados migrados com sucesso:\n\n` +
              `• ${migrationResult.stats.clientes} clientes\n` +
              `• ${migrationResult.stats.produtos} produtos\n` +
              `• ${migrationResult.stats.industrias} indústrias\n` +
              `• ${migrationResult.stats.pedidos} pedidos\n` +
              `• ${migrationResult.stats.configuracoes} configurações\n\n` +
              `${migrationResult.stats.errors.length > 0 
                ? `⚠️ ${migrationResult.stats.errors.length} erro(s) encontrado(s)` 
                : 'Sem erros!'}`
            );
          }
        } else {
          console.error('❌ Migration failed:', migrationResult.error);
          Alert.alert(
            'Erro na Migração',
            'Houve um erro ao migrar os dados. Por favor, contate o suporte.'
          );
        }
      } else {
        console.log('✅ Using existing SQLite database');
      }

      setMigrationStatus('Pronto!');
      setTimeout(() => {
        setIsInitializing(false);
      }, 500);

    } catch (error) {
      console.error('❌ Error initializing app:', error);
      Alert.alert(
        'Erro',
        'Erro ao inicializar o aplicativo. Por favor, reinicie o app.'
      );
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{migrationStatus}</Text>
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
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
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