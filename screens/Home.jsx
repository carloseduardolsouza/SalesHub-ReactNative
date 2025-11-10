import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    // Dados atuais
    totalClientes: 0,
    totalProdutos: 0,
    totalPedidos: 0,
    totalIndustrias: 0,
    faturamentoTotal: 0,
    faturamentoMesAtual: 0,
    ticketMedio: 0,
    
    // Comparações
    crescimentoClientes: 0,
    crescimentoProdutos: 0,
    crescimentoPedidos: 0,
    crescimentoFaturamento: 0,
    
    // Dados para gráficos
    vendasPorMes: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{ data: [0] }]
    },
    pedidosPorMes: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{ data: [0] }]
    },
    topProdutos: [],
    topClientes: [],
    pedidosRecentes: [],
    
    // Análises
    produtoMaisVendido: null,
    clienteMaisCompras: null,
    metodoPagamentoMaisUsado: null,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const loadDashboardData = async () => {
    try {
      const clientes = await AsyncStorage.getItem('clientes');
      const produtos = await AsyncStorage.getItem('produtos');
      const pedidos = await AsyncStorage.getItem('pedidos');
      const industrias = await AsyncStorage.getItem('industrias');

      const clientesData = clientes ? JSON.parse(clientes) : [];
      const produtosData = produtos ? JSON.parse(produtos) : [];
      const pedidosData = pedidos ? JSON.parse(pedidos) : [];
      const industriasData = industrias ? JSON.parse(industrias) : [];

      // Garantir que são arrays
      const clientesArray = Array.isArray(clientesData) ? clientesData : [];
      const produtosArray = Array.isArray(produtosData) ? produtosData : [];
      const pedidosArray = Array.isArray(pedidosData) ? pedidosData : [];
      const industriasArray = Array.isArray(industriasData) ? industriasData : [];

      // Calcular métricas
      const metricas = calcularMetricas(clientesArray, produtosArray, pedidosArray);
      const comparacoes = calcularComparacoes(clientesArray, produtosArray, pedidosArray);
      const graficos = prepararDadosGraficos(pedidosArray);
      const analises = calcularAnalises(pedidosArray, produtosArray, clientesArray);

      setDashboardData({
        totalClientes: clientesArray.length,
        totalProdutos: produtosArray.length,
        totalPedidos: pedidosArray.length,
        totalIndustrias: industriasArray.length,
        ...metricas,
        ...comparacoes,
        ...graficos,
        ...analises,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  const calcularMetricas = (clientes, produtos, pedidos) => {
    // Garantir que pedidos é um array
    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];
    
    if (pedidosArray.length === 0) {
      return {
        faturamentoTotal: 0,
        faturamentoMesAtual: 0,
        ticketMedio: 0,
      };
    }

    const faturamentoTotal = pedidosArray.reduce((total, p) => {
      return total + (Number(p?.total) || 0);
    }, 0);
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    const pedidosMesAtual = pedidosArray.filter(p => {
      if (!p?.data) return false;
      try {
        const dataPedido = new Date(p.data);
        return dataPedido.getMonth() === mesAtual && dataPedido.getFullYear() === anoAtual;
      } catch (e) {
        return false;
      }
    });
    
    const faturamentoMesAtual = pedidosMesAtual.reduce((total, p) => {
      return total + (Number(p?.total) || 0);
    }, 0);
    
    const ticketMedio = pedidosArray.length > 0 ? faturamentoTotal / pedidosArray.length : 0;

    return {
      faturamentoTotal,
      faturamentoMesAtual,
      ticketMedio,
    };
  };

  const calcularComparacoes = (clientes, produtos, pedidos) => {
    const clientesArray = Array.isArray(clientes) ? clientes : [];
    const produtosArray = Array.isArray(produtos) ? produtos : [];
    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Mês anterior
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

    // Clientes novos este mês vs mês anterior
    const clientesMesAtual = clientesArray.filter(c => {
      if (!c?.dataCadastro) return false;
      try {
        const data = new Date(c.dataCadastro);
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
      } catch (e) {
        return false;
      }
    }).length;

    const clientesMesAnterior = clientesArray.filter(c => {
      if (!c?.dataCadastro) return false;
      try {
        const data = new Date(c.dataCadastro);
        return data.getMonth() === mesAnterior && data.getFullYear() === anoMesAnterior;
      } catch (e) {
        return false;
      }
    }).length;

    // Produtos cadastrados
    const produtosMesAtual = produtosArray.filter(p => {
      if (!p?.dataCadastro) return false;
      try {
        const data = new Date(p.dataCadastro);
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
      } catch (e) {
        return false;
      }
    }).length;

    const produtosMesAnterior = produtosArray.filter(p => {
      if (!p?.dataCadastro) return false;
      try {
        const data = new Date(p.dataCadastro);
        return data.getMonth() === mesAnterior && data.getFullYear() === anoMesAnterior;
      } catch (e) {
        return false;
      }
    }).length;

    // Pedidos
    const pedidosMesAtual = pedidosArray.filter(p => {
      if (!p?.data) return false;
      try {
        const data = new Date(p.data);
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
      } catch (e) {
        return false;
      }
    }).length;

    const pedidosMesAnterior = pedidosArray.filter(p => {
      if (!p?.data) return false;
      try {
        const data = new Date(p.data);
        return data.getMonth() === mesAnterior && data.getFullYear() === anoMesAnterior;
      } catch (e) {
        return false;
      }
    }).length;

    // Faturamento
    const pedidosMesAtualArray = pedidosArray.filter(p => {
      if (!p?.data) return false;
      try {
        const data = new Date(p.data);
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
      } catch (e) {
        return false;
      }
    });

    const faturamentoMesAtual = pedidosMesAtualArray.reduce((total, p) => {
      return total + (Number(p?.total) || 0);
    }, 0);

    const pedidosMesAnteriorArray = pedidosArray.filter(p => {
      if (!p?.data) return false;
      try {
        const data = new Date(p.data);
        return data.getMonth() === mesAnterior && data.getFullYear() === anoMesAnterior;
      } catch (e) {
        return false;
      }
    });

    const faturamentoMesAnterior = pedidosMesAnteriorArray.reduce((total, p) => {
      return total + (Number(p?.total) || 0);
    }, 0);

    return {
      crescimentoClientes: calcularPercentual(clientesMesAtual, clientesMesAnterior),
      crescimentoProdutos: calcularPercentual(produtosMesAtual, produtosMesAnterior),
      crescimentoPedidos: calcularPercentual(pedidosMesAtual, pedidosMesAnterior),
      crescimentoFaturamento: calcularPercentual(faturamentoMesAtual, faturamentoMesAnterior),
    };
  };

  const calcularPercentual = (atual, anterior) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  };

  const prepararDadosGraficos = (pedidos) => {
    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];

    const hoje = new Date();
    const mesesLabels = [];
    const vendasPorMes = [];
    const pedidosPorMes = [];

    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = data.getMonth();
      const ano = data.getFullYear();
      
      const nomeMes = data.toLocaleDateString('pt-BR', { month: 'short' });
      mesesLabels.push(nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1, 3));

      const pedidosDoMes = pedidosArray.filter(p => {
        if (!p?.data) return false;
        try {
          const dataPedido = new Date(p.data);
          return dataPedido.getMonth() === mes && dataPedido.getFullYear() === ano;
        } catch (e) {
          return false;
        }
      });

      const faturamentoMes = pedidosDoMes.reduce((total, p) => {
        return total + (Number(p?.total) || 0);
      }, 0);
      
      vendasPorMes.push(faturamentoMes);
      pedidosPorMes.push(pedidosDoMes.length);
    }

    // Pedidos recentes
    const pedidosRecentes = pedidosArray
      .filter(p => p?.data)
      .sort((a, b) => {
        try {
          return new Date(b.data) - new Date(a.data);
        } catch (e) {
          return 0;
        }
      })
      .slice(0, 5);

    return {
      vendasPorMes: {
        labels: mesesLabels,
        datasets: [{ data: vendasPorMes.length > 0 ? vendasPorMes : [0] }]
      },
      pedidosPorMes: {
        labels: mesesLabels,
        datasets: [{ data: pedidosPorMes.length > 0 ? pedidosPorMes : [0] }]
      },
      pedidosRecentes,
    };
  };

  const calcularAnalises = (pedidos, produtos, clientes) => {
    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];
    const produtosArray = Array.isArray(produtos) ? produtos : [];
    const clientesArray = Array.isArray(clientes) ? clientes : [];

    // Produto mais vendido
    const produtosVendidos = {};
    pedidosArray.forEach(pedido => {
      if (!pedido?.produtos || !Array.isArray(pedido.produtos)) return;
      
      pedido.produtos.forEach(produto => {
        if (!produto?.nome) return;
        
        const key = produto.nome;
        if (!produtosVendidos[key]) {
          produtosVendidos[key] = { nome: produto.nome, quantidade: 0, valor: 0 };
        }
        produtosVendidos[key].quantidade += Number(produto?.quantidade) || 0;
        produtosVendidos[key].valor += (Number(produto?.preco) * Number(produto?.quantidade)) || 0;
      });
    });

    const produtoMaisVendido = Object.values(produtosVendidos)
      .sort((a, b) => b.quantidade - a.quantidade)[0] || null;

    // Cliente com mais compras
    const comprasPorCliente = {};
    pedidosArray.forEach(pedido => {
      if (!pedido?.cliente) return;
      
      if (!comprasPorCliente[pedido.cliente]) {
        comprasPorCliente[pedido.cliente] = { nome: pedido.cliente, quantidade: 0, valor: 0 };
      }
      comprasPorCliente[pedido.cliente].quantidade++;
      comprasPorCliente[pedido.cliente].valor += Number(pedido?.total) || 0;
    });

    const clienteMaisCompras = Object.values(comprasPorCliente)
      .sort((a, b) => b.valor - a.valor)[0] || null;

    // Método de pagamento mais usado
    const metodosPagamento = {};
    pedidosArray.forEach(pedido => {
      if (!pedido?.metodoPagamento) return;
      
      const metodo = pedido.metodoPagamento;
      metodosPagamento[metodo] = (metodosPagamento[metodo] || 0) + 1;
    });

    const metodoPagamentoMaisUsado = Object.entries(metodosPagamento)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      produtoMaisVendido,
      clienteMaisCompras,
      metodoPagamentoMaisUsado,
    };
  };

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: { borderRadius: 16 },
    propsForLabels: { fontSize: 12 },
  };

  const MetricCard = ({ title, value, icon: Icon, color, growth, onPress }) => (
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
  );

  const InsightCard = ({ title, description, icon: Icon, color }) => (
    <View style={styles.insightCard}>
      <View style={[styles.insightIcon, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
      </View>
    </View>
  );

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
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Vendas</Text>
            </View>
          </View>
        </View>
        <View style={styles.chartContainer}>
          <LineChart
            data={dashboardData.vendasPorMes}
            width={width - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={true}
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
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Quantidade</Text>
            </View>
          </View>
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
          />
        </View>
      </View>

      {/* Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>Insights do Negócio</Text>
        
        {dashboardData.produtoMaisVendido && (
          <InsightCard
            title="Produto Mais Vendido"
            description={`${dashboardData.produtoMaisVendido.nome} - ${dashboardData.produtoMaisVendido.quantidade} unidades vendidas`}
            icon={Package}
            color="#4CAF50"
          />
        )}

        {dashboardData.clienteMaisCompras && (
          <InsightCard
            title="Melhor Cliente"
            description={`${dashboardData.clienteMaisCompras.nome} - R$ ${dashboardData.clienteMaisCompras.valor.toFixed(2)} em compras`}
            icon={Users}
            color="#2196F3"
          />
        )}

        {dashboardData.metodoPagamentoMaisUsado && (
          <InsightCard
            title="Método de Pagamento Preferido"
            description={`${dashboardData.metodoPagamentoMaisUsado.charAt(0).toUpperCase() + dashboardData.metodoPagamentoMaisUsado.slice(1)}`}
            icon={DollarSign}
            color="#9C27B0"
          />
        )}
      </View>

      {/* Pedidos Recentes */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Pedidos')}>
            <Text style={styles.viewAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        
        {dashboardData.pedidosRecentes.length > 0 ? (
          dashboardData.pedidosRecentes.map((pedido, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.recentItem}
              onPress={() => navigation.navigate('Pedidos')}
            >
              <View style={styles.recentItemLeft}>
                <View style={styles.recentItemIcon}>
                  <ShoppingCart size={20} color="#2196F3" />
                </View>
                <View>
                  <Text style={styles.recentItemTitle}>Pedido #{pedido.id}</Text>
                  <Text style={styles.recentItemClient}>{pedido.cliente}</Text>
                  <Text style={styles.recentItemDate}>
                    {new Date(pedido.data).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </View>
              <View style={styles.recentItemRight}>
                <Text style={styles.recentItemTotal}>
                  R$ {(Number(pedido?.total) || 0).toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <ShoppingCart size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>Nenhum pedido encontrado</Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('Pedidos')}
            >
              <Text style={styles.emptyStateButtonText}>Criar Primeiro Pedido</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  recentSection: {
    marginHorizontal: 20,
    marginTop: 25,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  recentItemClient: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  recentItemDate: {
    fontSize: 12,
    color: '#999',
  },
  recentItemRight: {
    alignItems: 'flex-end',
  },
  recentItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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