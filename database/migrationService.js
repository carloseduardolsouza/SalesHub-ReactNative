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

      // Migrar Clientes
      try {
        const clientesData = await AsyncStorage.getItem('clientes');
        if (clientesData) {
          const clientes = JSON.parse(clientesData);
          console.log(`📦 Migrating ${clientes.length} clientes...`);
          
          for (const cliente of clientes) {
            try {
              await database.insertCliente(cliente);
              stats.clientes++;
            } catch (error) {
              console.error('Error migrating cliente:', cliente.id, error);
              stats.errors.push({ type: 'cliente', id: cliente.id, error: error.message });
            }
          }
        }
      } catch (error) {
        console.error('Error migrating clientes:', error);
        stats.errors.push({ type: 'clientes', error: error.message });
      }

      // Migrar Produtos
      try {
        const produtosData = await AsyncStorage.getItem('produtos');
        if (produtosData) {
          const produtos = JSON.parse(produtosData);
          console.log(`📦 Migrating ${produtos.length} produtos...`);
          
          for (const produto of produtos) {
            try {
              // Garantir que imagens seja um array
              const produtoMigrado = {
                ...produto,
                imagens: produto.imagens || (produto.imagem ? [produto.imagem] : [])
              };
              await database.insertProduto(produtoMigrado);
              stats.produtos++;
            } catch (error) {
              console.error('Error migrating produto:', produto.id, error);
              stats.errors.push({ type: 'produto', id: produto.id, error: error.message });
            }
          }
        }
      } catch (error) {
        console.error('Error migrating produtos:', error);
        stats.errors.push({ type: 'produtos', error: error.message });
      }

      // Migrar Indústrias
      try {
        const industriasData = await AsyncStorage.getItem('industrias');
        if (industriasData) {
          const industrias = JSON.parse(industriasData);
          console.log(`📦 Migrating ${industrias.length} industrias...`);
          
          for (const industria of industrias) {
            try {
              await database.insertIndustria(industria);
              stats.industrias++;
            } catch (error) {
              console.error('Error migrating industria:', industria.id, error);
              stats.errors.push({ type: 'industria', id: industria.id, error: error.message });
            }
          }
        }
      } catch (error) {
        console.error('Error migrating industrias:', error);
        stats.errors.push({ type: 'industrias', error: error.message });
      }

      // Migrar Pedidos
      try {
        const pedidosData = await AsyncStorage.getItem('pedidos');
        if (pedidosData) {
          const pedidos = JSON.parse(pedidosData);
          console.log(`📦 Migrating ${pedidos.length} pedidos...`);
          
          for (const pedido of pedidos) {
            try {
              await database.insertPedido(pedido);
              stats.pedidos++;
            } catch (error) {
              console.error('Error migrating pedido:', pedido.id, error);
              stats.errors.push({ type: 'pedido', id: pedido.id, error: error.message });
            }
          }
        }
      } catch (error) {
        console.error('Error migrating pedidos:', error);
        stats.errors.push({ type: 'pedidos', error: error.message });
      }

      // Migrar Configurações
      try {
        const settingsData = await AsyncStorage.getItem('settings');
        if (settingsData) {
          const settings = JSON.parse(settingsData);
          console.log(`📦 Migrating settings...`);
          
          for (const [key, value] of Object.entries(settings)) {
            try {
              await database.setConfiguracao(key, JSON.stringify(value));
              stats.configuracoes++;
            } catch (error) {
              console.error('Error migrating setting:', key, error);
              stats.errors.push({ type: 'configuracao', key, error: error.message });
            }
          }
        }
      } catch (error) {
        console.error('Error migrating settings:', error);
        stats.errors.push({ type: 'settings', error: error.message });
      }

      // Marcar como migrado
      await database.setConfiguracao('migrated_from_async_storage', 'true');
      await database.setConfiguracao('migration_date', new Date().toISOString());

      console.log('✅ Migration completed!');
      console.log('📊 Migration stats:', stats);

      return { success: true, stats, alreadyMigrated: false };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, error: error.message };
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
}

export default new MigrationService();