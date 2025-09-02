import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart, LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState({
    totalClientes: 0,
    totalProdutos: 0,
    totalPedidos: 0,
    faturamentoMensal: 0,
    pedidosRecentes: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const clientes = await AsyncStorage.getItem('clientes');
      const produtos = await AsyncStorage.getItem('produtos');
      const pedidos = await AsyncStorage.getItem('pedidos');

      const clientesData = clientes ? JSON.parse(clientes) : [];
      const produtosData = produtos ? JSON.parse(produtos) : [];
      const pedidosData = pedidos ? JSON.parse(pedidos) : [];

      const faturamento = pedidosData.reduce((total, pedido) => {
        if (pedido.status === 'concluido') {
          return total + pedido.total;
        }
        return total;
      }, 0);

      const pedidosRecentes = pedidosData
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 5);

      setDashboardData({
        totalClientes: clientesData.length,
        totalProdutos: produtosData.length,
        totalPedidos: pedidosData.length,
        faturamentoMensal: faturamento,
        pedidosRecentes,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const salesData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
      },
    ],
  };

  const StatusCard = ({ title, value, color, onPress }) => (
    <TouchableOpacity style={[styles.statusCard, { borderLeftColor: color }]} onPress={onPress}>
      <Text style={styles.statusValue}>{value}</Text>
      <Text style={styles.statusTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Visão geral do seu negócio</Text>
      </View>

      {/* Status Cards */}
      <View style={styles.statusContainer}>
        <StatusCard
          title="Clientes"
          value={dashboardData.totalClientes}
          color="#2196F3"
          onPress={() => navigation.navigate('Clientes')}
        />
        <StatusCard
          title="Produtos"
          value={dashboardData.totalProdutos}
          color="#4CAF50"
          onPress={() => navigation.navigate('Produtos')}
        />
        <StatusCard
          title="Pedidos"
          value={dashboardData.totalPedidos}
          color="#FF9800"
          onPress={() => navigation.navigate('Pedidos')}
        />
        <StatusCard
          title="Faturamento"
          value={`R$ ${dashboardData.faturamentoMensal.toFixed(2)}`}
          color="#9C27B0"
        />
      </View>

      {/* Charts Section */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Vendas dos Últimos 6 Meses</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={salesData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
        {dashboardData.pedidosRecentes.length > 0 ? (
          dashboardData.pedidosRecentes.map((pedido, index) => (
            <View key={index} style={styles.recentItem}>
              <View style={styles.recentItemHeader}>
                <Text style={styles.recentItemTitle}>Pedido #{pedido.id}</Text>
                <Text style={[styles.recentItemStatus, { color: getStatusColor(pedido.status) }]}>
                  {pedido.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.recentItemClient}>{pedido.cliente}</Text>
              <Text style={styles.recentItemTotal}>R$ {pedido.total?.toFixed(2) || '0.00'}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhum pedido encontrado</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Pedidos')}
          >
            <Text style={styles.actionButtonText}>➕ Novo Pedido</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Industrias')}
          >
            <Text style={styles.actionButtonText}>👥 Industrias</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pendente':
      return '#FF9800';
    case 'processando':
      return '#2196F3';
    case 'concluido':
      return '#4CAF50';
    case 'cancelado':
      return '#F44336';
    default:
      return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    marginTop: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 15,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: '45%',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statusTitle: {
    fontSize: 14,
    color: '#666',
  },
  chartSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  chart: {
    borderRadius: 12,
  },
  recentSection: {
    margin: 20,
    marginTop: 0,
  },
  recentItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  recentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  recentItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recentItemStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  recentItemClient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  recentItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  quickActions: {
    margin: 20,
    marginTop: 0,
    marginBottom: 100,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 15,
  },
  actionButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;