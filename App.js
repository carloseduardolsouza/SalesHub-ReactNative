import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

//telas
import ClientesScreen from "./screens/Clientes"
import ProdutosScreen from './screens/Produtos';

const Tab = createBottomTabNavigator();

// Telas do aplicativo
function HomeScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Home</Text>
      <Text style={styles.screenText}>Bem-vindo ao seu aplicativo!</Text>
    </View>
  );
}

function PedidosScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Pedidos</Text>
      <Text style={styles.screenText}>Visualize e gerencie pedidos</Text>
    </View>
  );
}

function ConfiguracaoScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Configuração</Text>
      <Text style={styles.screenText}>Configurações do aplicativo</Text>
    </View>
  );
}

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
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
          <Tab.Screen name="Clientes" component={ClientesScreen} />
          <Tab.Screen name="Pedidos" component={PedidosScreen} />
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Produtos" component={ProdutosScreen} />
          <Tab.Screen name="Configuração" component={ConfiguracaoScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  screenText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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