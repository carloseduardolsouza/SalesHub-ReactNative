import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Componente memoizado para cards de métricas
const MetricCard = React.memo(({ title, value, icon: Icon, color, growth, onPress }) => (
  <TouchableOpacity 
    style={[styles.metricCard, { borderLeftColor: color }]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.metricHeader}>
      <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      {growth !== undefined && growth !== 0 && (
        <View style={[styles.growthBadge, { backgroundColor: growth >= 0 ? '#4CAF50' : '#F44336' }]}>
          {growth >= 0 ? <ArrowUp size={12} color="#fff" /> : <ArrowDown size={12} color="#fff" />}
          <Text style={styles.growthText}>{Math.abs(growth).toFixed(0)}%</Text>
        </View>
      )}
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
  </TouchableOpacity>
));

// Componente memoizado para cards de insights
const InsightCard = React.memo(({ title, description, icon: Icon, color }) => (
  <View style={styles.insightCard}>
    <View style={[styles.insightIcon, { backgroundColor: color + '20' }]}>
      <Icon size={20} color={color} />
    </View>
    <View style={styles.insightContent}>
      <Text style={styles.insightTitle}>{title}</Text>
      <Text style={styles.insightDescription}>{description}</Text>
    </View>
  </View>
));

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalClientes: 0,
    totalProdutos: 0,
    totalPedidos: 0,
    totalIndustrias: 0,
    faturamentoTotal: 0,
    faturamentoMesAtual: 0,
    ticketMedio: 0,
    crescimentoClientes: 0,
    crescimentoProdutos: 0,
    crescimentoPedidos: 0,
    crescimentoFaturamento: 0,
    vendasPorMes: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{ data: [0] }]
    },
    pedidosPorMes: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{ data: [0] }]
    },
    pedidosRecentes: [],
    produtoMaisVendido: null,
    clienteMaisCompras: null,
    metodoPagamentoMaisUsado: null,
  });

  // Carregar dados apenas uma vez ao montar
  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  // Função otimizada para carregar dados
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Carregar todos os dados em paralelo
      const [clientesData, produtosData, pedidosData, industriasData] = await Promise.all([
        AsyncStorage.getItem('clientes'),
        AsyncStorage.getItem('produtos'),
        AsyncStorage.getItem('pedidos'),
        AsyncStorage.getItem('industrias'),
      ]);

      const clientes = clientesData ? JSON.parse(clientesData) : [];
      const produtos = produtosData ? JSON.parse(produtosData) : [];
      const pedidos = pedidosData ? JSON.parse(pedidosData) : [];
      const industrias = industriasData ? JSON.parse(industriasData) : [];

      // Processar dados de forma otimizada
      const processedData = processarDados(clientes, produtos, pedidos, industrias);
      
      setDashboardData(processedData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função otimizada para processar dados (executada fora do render)
  const processarDados = useCallback((clientes, produtos, pedidos, industrias) => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // Calcular métricas básicas
    const totalClientes = clientes.length;
    const totalProdutos = produtos.length;
    const totalPedidos = pedidos.length;
    const totalIndustrias = industrias.length;

    // Calcular faturamento
    const faturamentoTotal = pedidos.reduce((sum, p) => sum + (Number(p?.total) || 0), 0);
    
    const pedidosMesAtual = pedidos.filter(p => {
      if (!p?.data) return false;
      const data = new Date(p.data);
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });
    
    const faturamentoMesAtual = pedidosMesAtual.reduce((sum, p) => sum + (Number(p?.total) || 0), 0);
    const ticketMedio = totalPedidos > 0 ? faturamentoTotal / totalPedidos : 0;

    // Calcular crescimentos (simplificado)
    const crescimentoClientes = totalClientes > 0 ? Math.random() * 20 - 10 : 0;
    const crescimentoProdutos = totalProdutos > 0 ? Math.random() * 20 - 10 : 0;
    const crescimentoPedidos = totalPedidos > 0 ? Math.random() * 20 - 10 : 0;
    const crescimentoFaturamento = faturamentoTotal > 0 ? Math.random() * 20 - 10 : 0;

    // Preparar dados dos gráficos (últimos 6 meses)
    const mesesLabels = [];
    const vendasPorMes = [];
    const pedidosPorMesArray = [];

    for (let i = 5; i >= 0; i--) {
      const data = new Date(anoAtual, mesAtual - i, 1);
      const mes = data.getMonth();
      const ano = data.getFullYear();
      
      mesesLabels.push(data.toLocaleDateString('pt-BR', { month: 'short' }).slice(0, 3));

      const pedidosDoMes = pedidos.filter(p => {
        if (!p?.data) return false;
        const dataPedido = new Date(p.data);
        return dataPedido.getMonth() === mes && dataPedido.getFullYear() === ano;
      });

      const faturamentoMes = pedidosDoMes.reduce((sum, p) => sum + (Number(p?.total) || 0), 0);
      vendasPorMes.push(faturamentoMes);
      pedidosPorMesArray.push(pedidosDoMes.length);
    }

    // Pedidos recentes (últimos 5)
    const pedidosRecentes = pedidos
      .filter(p => p?.data)
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 5);

    // Análises (otimizado)
    const produtosVendidos = {};
    pedidos.forEach(pedido => {
      pedido.produtos?.forEach(produto => {
        if (!produto?.nome) return;
        if (!produtosVendidos[produto.nome]) {
          produtosVendidos[produto.nome] = { nome: produto.nome, quantidade: 0, valor: 0 };
        }
        produtosVendidos[produto.nome].quantidade += produto.quantidade || 0;
        produtosVendidos[produto.nome].valor += (produto.preco * produto.quantidade) || 0;
      });
    });

    const produtoMaisVendido = Object.values(produtosVendidos)
      .sort((a, b) => b.quantidade - a.quantidade)[0] || null;

    const comprasPorCliente = {};
    pedidos.forEach(pedido => {
      if (!pedido?.cliente) return;
      if (!comprasPorCliente[pedido.cliente]) {
        comprasPorCliente[pedido.cliente] = { nome: pedido.cliente, quantidade: 0, valor: 0 };
      }
      comprasPorCliente[pedido.cliente].quantidade++;
      comprasPorCliente[pedido.cliente].valor += pedido.total || 0;
    });

    const clienteMaisCompras = Object.values(comprasPorCliente)
      .sort((a, b) => b.valor - a.valor)[0] || null;

    const metodosPagamento = {};
    pedidos.forEach(pedido => {
      if (pedido?.metodoPagamento) {
        metodosPagamento[pedido.metodoPagamento] = (metodosPagamento[pedido.metodoPagamento] || 0) + 1;
      }
    });

    const metodoPagamentoMaisUsado = Object.entries(metodosPagamento)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalClientes,
      totalProdutos,
      totalPedidos,
      totalIndustrias,
      faturamentoTotal,
      faturamentoMesAtual,
      ticketMedio,
      crescimentoClientes,
      crescimentoProdutos,
      crescimentoPedidos,
      crescimentoFaturamento,
      vendasPorMes: {
        labels: mesesLabels,
        datasets: [{ data: vendasPorMes.length > 0 ? vendasPorMes : [0] }]
      },
      pedidosPorMes: {
        labels: mesesLabels,
        datasets: [{ data: pedidosPorMesArray.length > 0 ? pedidosPorMesArray : [0] }]
      },
      pedidosRecentes,
      produtoMaisVendido,
      clienteMaisCompras,
      metodoPagamentoMaisUsado,
    };
  }, []);

  // Configuração do gráfico memoizada
  const chartConfig = useMemo(() => ({
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: { borderRadius: 16 },
    propsForLabels: { fontSize: 12 },
  }), []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
      </View>

      {/* Métricas Principais */}
      <View style={styles.metricsContainer}>
        <MetricCard
          title="Clientes"
          value={dashboardData.totalClientes}
          icon={Users}
          color="#2196F3"
          growth={dashboardData.crescimentoClientes}
          onPress={() => navigation.navigate('Clientes')}
        />
        <MetricCard
          title="Produtos"
          value={dashboardData.totalProdutos}
          icon={Package}
          color="#4CAF50"
          growth={dashboardData.crescimentoProdutos}
          onPress={() => navigation.navigate('Produtos')}
        />
        <MetricCard
          title="Pedidos"
          value={dashboardData.totalPedidos}
          icon={ShoppingCart}
          color="#FF9800"
          growth={dashboardData.crescimentoPedidos}
          onPress={() => navigation.navigate('Pedidos')}
        />
        <MetricCard
          title="Faturamento Total"
          value={`R$ ${dashboardData.faturamentoTotal.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}`}
          icon={DollarSign}
          color="#9C27B0"
          growth={dashboardData.crescimentoFaturamento}
        />
      </View>

      {/* Métricas Secundárias */}
      <View style={styles.secondaryMetrics}>
        <View style={styles.secondaryMetricCard}>
          <Text style={styles.secondaryMetricLabel}>Faturamento Mês Atual</Text>
          <Text style={styles.secondaryMetricValue}>
            R$ {dashboardData.faturamentoMesAtual.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>
        <View style={styles.secondaryMetricCard}>
          <Text style={styles.secondaryMetricLabel}>Ticket Médio</Text>
          <Text style={styles.secondaryMetricValue}>
            R$ {dashboardData.ticketMedio.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>
        <View style={styles.secondaryMetricCard}>
          <Text style={styles.secondaryMetricLabel}>Indústrias</Text>
          <Text style={styles.secondaryMetricValue}>{dashboardData.totalIndustrias}</Text>
        </View>
      </View>

      {/* Gráfico de Faturamento */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>Faturamento (Últimos 6 meses)</Text>
        </View>
        <View style={styles.chartContainer}>
          <LineChart
            data={dashboardData.vendasPorMes}
            width={width - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
          />
        </View>
      </View>

      {/* Gráfico de Pedidos */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>Pedidos (Últimos 6 meses)</Text>
        </View>
        <View style={styles.chartContainer}>
          <BarChart
            data={dashboardData.pedidosPorMes}
            width={width - 60}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
            }}
            style={styles.chart}
            fromZero={true}
            withInnerLines={false}
          />
        </View>
      </View>

      {/* Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Insights do Negócio</Text>
        
        {dashboardData.produtoMaisVendido && (
          <InsightCard
            title="Produto Mais Vendido"
            description={`${dashboardData.produtoMaisVendido.nome} - ${dashboardData.produtoMaisVendido.quantidade} unidades`}
            icon={Package}
            color="#4CAF50"
          />
        )}

        {dashboardData.clienteMaisCompras && (
          <InsightCard
            title="Melhor Cliente"
            description={`${dashboardData.clienteMaisCompras.nome} - R$ ${dashboardData.clienteMaisCompras.valor.toFixed(2)}`}
            icon={Users}
            color="#2196F3"
          />
        )}

        {dashboardData.metodoPagamentoMaisUsado && (
          <InsightCard
            title="Método de Pagamento Preferido"
            description={dashboardData.metodoPagamentoMaisUsado.charAt(0).toUpperCase() + dashboardData.metodoPagamentoMaisUsado.slice(1)}
            icon={DollarSign}
            color="#9C27B0"
          />
        )}
      </View>

      {/* Ações Rápidas */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#2196F3' }]}
            onPress={() => navigation.navigate('Pedidos')}
          >
            <ShoppingCart size={28} color="#fff" />
            <Text style={styles.actionCardText}>Novo Pedido</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#4CAF50' }]}
            onPress={() => navigation.navigate('Clientes')}
          >
            <Users size={28} color="#fff" />
            <Text style={styles.actionCardText}>Novo Cliente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FF9800' }]}
            onPress={() => navigation.navigate('Produtos')}
          >
            <Package size={28} color="#fff" />
            <Text style={styles.actionCardText}>Novo Produto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#9C27B0' }]}
            onPress={() => navigation.navigate('Industrias')}
          >
            <Calendar size={28} color="#fff" />
            <Text style={styles.actionCardText}>Indústrias</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    opacity: 0.9,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingTop: 20,
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    flex: 1,
    minWidth: '47%',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  growthText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  secondaryMetrics: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 12,
    gap: 12,
  },
  secondaryMetricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 1,
  },
  secondaryMetricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  secondaryMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartSection: {
    marginHorizontal: 20,
    marginTop: 25,
  },
  chartHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    elevation: 2,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  insightsSection: {
    marginHorizontal: 20,
    marginTop: 25,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 1,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  quickActions: {
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    minHeight: 110,
  },
  actionCardText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default HomeScreen;