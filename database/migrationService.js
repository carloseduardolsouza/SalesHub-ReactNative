import AsyncStorage from '@react-native-async-storage/async-storage';
import database from './database';

class MigrationService {
  async checkMigrationStatus() {
    try {
      const migrated = await database.getConfiguracao('migrated_from_async_storage');
      return migrated === 'true';
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  async migrateFromAsyncStorage() {
    try {
      console.log('🔄 Starting migration from AsyncStorage to SQLite...');

      // Verificar se já foi migrado
      const alreadyMigrated = await this.checkMigrationStatus();
      if (alreadyMigrated) {
        console.log('✅ Data already migrated');
        return { success: true, alreadyMigrated: true };
      }

      const stats = {
        clientes: 0,
        produtos: 0,
        industrias: 0,
        pedidos: 0,
        configuracoes: 0,
        errors: []
      };

      // ==================== MIGRAR CLIENTES ====================
      try {
        const clientesData = await AsyncStorage.getItem('clientes');
        console.log('📦 AsyncStorage clientes data:', clientesData ? 'Found' : 'Not found');
        
        if (clientesData) {
          const clientes = JSON.parse(clientesData);
          console.log(`📦 Migrating ${clientes.length} clientes...`);
          
          for (const cliente of clientes) {
            try {
              // Garantir que o objeto cliente tenha a estrutura correta
              const clienteFormatado = {
                id: cliente.id || Date.now() + Math.random(),
                cnpj: cliente.cnpj || '',
                nomeFantasia: cliente.nomeFantasia || '',
                razaoSocial: cliente.razaoSocial || '',
                inscricaoEstadual: cliente.inscricaoEstadual || '',
                nomeComprador: cliente.nomeComprador || '',
                email: cliente.email || '',
                telefone: cliente.telefone || '',
                dataNascimento: cliente.dataNascimento || new Date(),
                endereco: cliente.endereco || {
                  cep: '',
                  logradouro: '',
                  numero: '',
                  complemento: '',
                  bairro: '',
                  cidade: '',
                  estado: ''
                },
                dataCadastro: cliente.dataCadastro || new Date().toISOString()
              };

              const success = await database.insertCliente(clienteFormatado);
              if (success) {
                stats.clientes++;
                console.log(`✅ Cliente migrado: ${clienteFormatado.nomeFantasia}`);
              }
            } catch (error) {
              console.error('❌ Error migrating cliente:', cliente.id, error);
              stats.errors.push({ 
                type: 'cliente', 
                id: cliente.id, 
                error: error.message,
                nome: cliente.nomeFantasia 
              });
            }
          }
          console.log(`✅ Total clientes migrados: ${stats.clientes}`);
        }
      } catch (error) {
        console.error('❌ Error migrating clientes:', error);
        stats.errors.push({ type: 'clientes', error: error.message });
      }

      // ==================== MIGRAR PRODUTOS ====================
      try {
        const produtosData = await AsyncStorage.getItem('produtos');
        console.log('📦 AsyncStorage produtos data:', produtosData ? 'Found' : 'Not found');
        
        if (produtosData) {
          const produtos = JSON.parse(produtosData);
          console.log(`📦 Migrating ${produtos.length} produtos...`);
          
          for (const produto of produtos) {
            try {
              // Garantir que imagens seja sempre um array
              let imagens = [];
              if (produto.imagens && Array.isArray(produto.imagens)) {
                imagens = produto.imagens;
              } else if (produto.imagem) {
                imagens = [produto.imagem];
              }

              const produtoFormatado = {
                id: produto.id || Date.now() + Math.random(),
                nome: produto.nome || '',
                preco: parseFloat(produto.preco) || 0,
                industria: produto.industria || '',
                descricao: produto.descricao || '',
                imagens: imagens,
                variacoes: produto.variacoes || [],
                dataCadastro: produto.dataCadastro || new Date().toISOString()
              };

              const success = await database.insertProduto(produtoFormatado);
              if (success) {
                stats.produtos++;
                console.log(`✅ Produto migrado: ${produtoFormatado.nome}`);
              }
            } catch (error) {
              console.error('❌ Error migrating produto:', produto.id, error);
              stats.errors.push({ 
                type: 'produto', 
                id: produto.id, 
                error: error.message,
                nome: produto.nome 
              });
            }
          }
          console.log(`✅ Total produtos migrados: ${stats.produtos}`);
        }
      } catch (error) {
        console.error('❌ Error migrating produtos:', error);
        stats.errors.push({ type: 'produtos', error: error.message });
      }

      // ==================== MIGRAR INDÚSTRIAS ====================
      try {
        const industriasData = await AsyncStorage.getItem('industrias');
        console.log('📦 AsyncStorage industrias data:', industriasData ? 'Found' : 'Not found');
        
        if (industriasData) {
          const industrias = JSON.parse(industriasData);
          console.log(`📦 Migrating ${industrias.length} industrias...`);
          
          for (const industria of industrias) {
            try {
              const industriaFormatada = {
                id: industria.id || Date.now() + Math.random(),
                cnpj: industria.cnpj || '',
                nome: industria.nome || '',
                telefoneComercial: industria.telefoneComercial || '',
                telefoneAssistencia: industria.telefoneAssistencia || '',
                email: industria.email || '',
                dataCadastro: industria.dataCadastro || new Date().toISOString()
              };

              const success = await database.insertIndustria(industriaFormatada);
              if (success) {
                stats.industrias++;
                console.log(`✅ Indústria migrada: ${industriaFormatada.nome}`);
              }
            } catch (error) {
              console.error('❌ Error migrating industria:', industria.id, error);
              stats.errors.push({ 
                type: 'industria', 
                id: industria.id, 
                error: error.message,
                nome: industria.nome 
              });
            }
          }
          console.log(`✅ Total indústrias migradas: ${stats.industrias}`);
        }
      } catch (error) {
        console.error('❌ Error migrating industrias:', error);
        stats.errors.push({ type: 'industrias', error: error.message });
      }

      // ==================== MIGRAR PEDIDOS ====================
      try {
        const pedidosData = await AsyncStorage.getItem('pedidos');
        console.log('📦 AsyncStorage pedidos data:', pedidosData ? 'Found' : 'Not found');
        
        if (pedidosData) {
          const pedidos = JSON.parse(pedidosData);
          console.log(`📦 Migrating ${pedidos.length} pedidos...`);
          
          for (const pedido of pedidos) {
            try {
              const pedidoFormatado = {
                id: pedido.id || Date.now() + Math.random(),
                cliente: pedido.cliente || '',
                produtos: pedido.produtos || [],
                desconto: pedido.desconto || { tipo: 'percentual', valor: '' },
                metodoPagamento: pedido.metodoPagamento || 'dinheiro',
                prazos: pedido.prazos || [],
                total: parseFloat(pedido.total) || 0,
                observacoes: pedido.observacoes || '',
                status: pedido.status || 'pendente',
                data: pedido.data || new Date().toISOString()
              };

              const success = await database.insertPedido(pedidoFormatado);
              if (success) {
                stats.pedidos++;
                console.log(`✅ Pedido migrado: #${pedidoFormatado.id}`);
              }
            } catch (error) {
              console.error('❌ Error migrating pedido:', pedido.id, error);
              stats.errors.push({ 
                type: 'pedido', 
                id: pedido.id, 
                error: error.message 
              });
            }
          }
          console.log(`✅ Total pedidos migrados: ${stats.pedidos}`);
        }
      } catch (error) {
        console.error('❌ Error migrating pedidos:', error);
        stats.errors.push({ type: 'pedidos', error: error.message });
      }

      // ==================== MIGRAR CONFIGURAÇÕES ====================
      try {
        const settingsData = await AsyncStorage.getItem('settings');
        console.log('📦 AsyncStorage settings data:', settingsData ? 'Found' : 'Not found');
        
        if (settingsData) {
          const settings = JSON.parse(settingsData);
          console.log(`📦 Migrating settings...`);
          
          for (const [key, value] of Object.entries(settings)) {
            try {
              const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
              await database.setConfiguracao(key, valueStr);
              stats.configuracoes++;
              console.log(`✅ Configuração migrada: ${key}`);
            } catch (error) {
              console.error('❌ Error migrating setting:', key, error);
              stats.errors.push({ 
                type: 'configuracao', 
                key, 
                error: error.message 
              });
            }
          }
          console.log(`✅ Total configurações migradas: ${stats.configuracoes}`);
        }
      } catch (error) {
        console.error('❌ Error migrating settings:', error);
        stats.errors.push({ type: 'settings', error: error.message });
      }

      // Marcar como migrado
      await database.setConfiguracao('migrated_from_async_storage', 'true');
      await database.setConfiguracao('migration_date', new Date().toISOString());
      await database.setConfiguracao('migration_stats', JSON.stringify(stats));

      console.log('✅ Migration completed!');
      console.log('📊 Migration stats:', stats);

      return { success: true, stats, alreadyMigrated: false };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Método para verificar dados no AsyncStorage (debug)
  async checkAsyncStorageData() {
    try {
      const keys = ['clientes', 'produtos', 'industrias', 'pedidos', 'settings'];
      const results = {};
      
      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          results[key] = Array.isArray(parsed) ? parsed.length : 'exists';
        } else {
          results[key] = 'not found';
        }
      }
      
      console.log('📊 AsyncStorage contents:', results);
      return results;
    } catch (error) {
      console.error('Error checking AsyncStorage:', error);
      return null;
    }
  }

  async clearAsyncStorage() {
    try {
      console.log('🧹 Clearing AsyncStorage...');
      const keys = ['clientes', 'produtos', 'industrias', 'pedidos', 'settings'];
      await AsyncStorage.multiRemove(keys);
      console.log('✅ AsyncStorage cleared');
      return true;
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      return false;
    }
  }

  async getDataSize() {
    try {
      const clientes = await database.getAllClientes();
      const produtos = await database.getAllProdutos();
      const industrias = await database.getAllIndustrias();
      const pedidos = await database.getAllPedidos();

      return {
        clientes: clientes.length,
        produtos: produtos.length,
        industrias: industrias.length,
        pedidos: pedidos.length
      };
    } catch (error) {
      console.error('Error getting data size:', error);
      return null;
    }
  }

  // Método para forçar re-migração (apenas para testes)
  async resetMigration() {
    try {
      await database.setConfiguracao('migrated_from_async_storage', 'false');
      console.log('✅ Migration status reset');
      return true;
    } catch (error) {
      console.error('Error resetting migration:', error);
      return false;
    }
  }
}

export default new MigrationService();