// database/migrationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import database from './database';

class MigrationService {
  constructor() {
    this.migrationKey = 'migration_v2_completed';
    this.migrationVersion = '2.0.0';
  }

  /**
   * Verifica se a migração já foi concluída
   */
  async checkMigrationStatus() {
    try {
      const migrated = await database.getConfiguracao(this.migrationKey);
      const version = await database.getConfiguracao('migration_version');
      
      // Se já migrou na versão atual, retorna true
      if (migrated === 'true' && version === this.migrationVersion) {
        console.log('✅ Migration already completed for version', this.migrationVersion);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Valida e formata dados de cliente
   */
  validateCliente(cliente) {
    if (!cliente) return null;
    
    // Garantir estrutura mínima
    const validated = {
      id: cliente.id || Date.now() + Math.random(),
      cnpj: cliente.cnpj || '',
      nomeFantasia: cliente.nomeFantasia || '',
      razaoSocial: cliente.razaoSocial || '',
      inscricaoEstadual: cliente.inscricaoEstadual || '',
      nomeComprador: cliente.nomeComprador || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      dataCadastro: cliente.dataCadastro || new Date().toISOString()
    };

    // Validar e formatar data de nascimento
    if (cliente.dataNascimento) {
      try {
        const date = new Date(cliente.dataNascimento);
        validated.dataNascimento = isNaN(date.getTime()) ? new Date() : date;
      } catch {
        validated.dataNascimento = new Date();
      }
    } else {
      validated.dataNascimento = new Date();
    }

    // Validar e formatar endereço
    validated.endereco = {
      cep: cliente.endereco?.cep || '',
      logradouro: cliente.endereco?.logradouro || '',
      numero: cliente.endereco?.numero || '',
      complemento: cliente.endereco?.complemento || '',
      bairro: cliente.endereco?.bairro || '',
      cidade: cliente.endereco?.cidade || '',
      estado: cliente.endereco?.estado || ''
    };

    return validated;
  }

  /**
   * Valida e formata dados de produto
   */
  validateProduto(produto) {
    if (!produto) return null;

    const validated = {
      id: produto.id || Date.now() + Math.random(),
      nome: produto.nome || 'Produto sem nome',
      preco: parseFloat(produto.preco) || 0,
      industria: produto.industria || 'Sem indústria',
      descricao: produto.descricao || '',
      dataCadastro: produto.dataCadastro || new Date().toISOString()
    };

    // Garantir que imagens seja sempre um array
    if (Array.isArray(produto.imagens)) {
      validated.imagens = produto.imagens.filter(img => img && typeof img === 'string');
    } else if (produto.imagem && typeof produto.imagem === 'string') {
      validated.imagens = [produto.imagem];
    } else {
      validated.imagens = [];
    }

    // Garantir que variações seja sempre um array válido
    if (Array.isArray(produto.variacoes)) {
      validated.variacoes = produto.variacoes.filter(v => 
        v && v.tipo && v.valor
      );
    } else {
      validated.variacoes = [];
    }

    return validated;
  }

  /**
   * Valida e formata dados de indústria
   */
  validateIndustria(industria) {
    if (!industria) return null;

    return {
      id: industria.id || Date.now() + Math.random(),
      cnpj: industria.cnpj || '',
      nome: industria.nome || 'Indústria sem nome',
      telefoneComercial: industria.telefoneComercial || '',
      telefoneAssistencia: industria.telefoneAssistencia || '',
      email: industria.email || '',
      dataCadastro: industria.dataCadastro || new Date().toISOString(),
      dataEdicao: industria.dataEdicao || null
    };
  }

  /**
   * Valida e formata dados de pedido
   */
  validatePedido(pedido) {
    if (!pedido) return null;

    const validated = {
      id: pedido.id || Date.now() + Math.random(),
      cliente: pedido.cliente || 'Cliente não especificado',
      metodoPagamento: pedido.metodoPagamento || 'dinheiro',
      total: parseFloat(pedido.total) || 0,
      observacoes: pedido.observacoes || '',
      status: pedido.status || 'pendente',
      data: pedido.data || new Date().toISOString()
    };

    // Validar desconto
    if (pedido.desconto && typeof pedido.desconto === 'object') {
      validated.desconto = {
        tipo: pedido.desconto.tipo || 'percentual',
        valor: pedido.desconto.valor || ''
      };
    } else {
      validated.desconto = { tipo: 'percentual', valor: '' };
    }

    // Validar produtos
    if (Array.isArray(pedido.produtos)) {
      validated.produtos = pedido.produtos.map(produto => {
        const validatedProduct = {
          id: produto.id || null,
          nome: produto.nome || 'Produto',
          preco: parseFloat(produto.preco) || 0,
          quantidade: parseInt(produto.quantidade) || 1
        };

        // Validar desconto do produto
        if (produto.desconto && typeof produto.desconto === 'object') {
          validatedProduct.desconto = {
            tipo: produto.desconto.tipo || 'percentual',
            valor: produto.desconto.valor || ''
          };
        } else {
          validatedProduct.desconto = { tipo: 'percentual', valor: '' };
        }

        // Validar variação selecionada
        if (produto.variacaoSelecionada && typeof produto.variacaoSelecionada === 'object') {
          validatedProduct.variacaoSelecionada = {
            tipo: produto.variacaoSelecionada.tipo,
            valor: produto.variacaoSelecionada.valor
          };
        } else {
          validatedProduct.variacaoSelecionada = null;
        }

        return validatedProduct;
      });
    } else {
      validated.produtos = [];
    }

    // Validar prazos
    if (Array.isArray(pedido.prazos)) {
      validated.prazos = pedido.prazos
        .filter(p => p && p.dias)
        .map(p => ({ dias: String(p.dias) }));
    } else {
      validated.prazos = [];
    }

    return validated;
  }

  /**
   * Migra dados do AsyncStorage para SQLite
   */
  async migrateFromAsyncStorage() {
    const stats = {
      clientes: 0,
      produtos: 0,
      industrias: 0,
      pedidos: 0,
      configuracoes: 0,
      errors: [],
      warnings: []
    };

    try {
      console.log('🔄 Starting migration from AsyncStorage to SQLite...');

      // Verificar se já foi migrado
      const alreadyMigrated = await this.checkMigrationStatus();
      if (alreadyMigrated) {
        console.log('✅ Data already migrated for version', this.migrationVersion);
        return { success: true, alreadyMigrated: true, stats };
      }

      // ==================== MIGRAR CLIENTES ====================
      try {
        console.log('📦 Migrating clientes...');
        const clientesData = await AsyncStorage.getItem('clientes');
        
        if (clientesData) {
          const clientes = JSON.parse(clientesData);
          console.log(`Found ${clientes.length} clientes in AsyncStorage`);
          
          for (const cliente of clientes) {
            try {
              const validated = this.validateCliente(cliente);
              if (!validated) {
                stats.warnings.push({
                  type: 'cliente',
                  id: cliente.id,
                  message: 'Cliente inválido, pulado'
                });
                continue;
              }

              // Verificar se já existe
              const existing = await database.getAllClientes();
              const exists = existing.some(c => c.id === validated.id);

              if (!exists) {
                const success = await database.insertCliente(validated);
                if (success) {
                  stats.clientes++;
                  console.log(`✅ Cliente migrado: ${validated.nomeFantasia}`);
                } else {
                  throw new Error('Failed to insert cliente');
                }
              } else {
                stats.warnings.push({
                  type: 'cliente',
                  id: validated.id,
                  message: 'Cliente já existe no banco'
                });
              }
            } catch (error) {
              console.error(`❌ Error migrating cliente ${cliente.id}:`, error);
              stats.errors.push({ 
                type: 'cliente', 
                id: cliente.id, 
                error: error.message,
                nome: cliente.nomeFantasia 
              });
            }
          }
        } else {
          console.log('No clientes found in AsyncStorage');
        }
      } catch (error) {
        console.error('❌ Error in clientes migration:', error);
        stats.errors.push({ type: 'clientes_general', error: error.message });
      }

      // ==================== MIGRAR PRODUTOS ====================
      try {
        console.log('📦 Migrating produtos...');
        const produtosData = await AsyncStorage.getItem('produtos');
        
        if (produtosData) {
          const produtos = JSON.parse(produtosData);
          console.log(`Found ${produtos.length} produtos in AsyncStorage`);
          
          for (const produto of produtos) {
            try {
              const validated = this.validateProduto(produto);
              if (!validated) {
                stats.warnings.push({
                  type: 'produto',
                  id: produto.id,
                  message: 'Produto inválido, pulado'
                });
                continue;
              }

              // Verificar se já existe
              const existing = await database.getAllProdutos();
              const exists = existing.some(p => p.id === validated.id);

              if (!exists) {
                const success = await database.insertProduto(validated);
                if (success) {
                  stats.produtos++;
                  console.log(`✅ Produto migrado: ${validated.nome}`);
                } else {
                  throw new Error('Failed to insert produto');
                }
              } else {
                stats.warnings.push({
                  type: 'produto',
                  id: validated.id,
                  message: 'Produto já existe no banco'
                });
              }
            } catch (error) {
              console.error(`❌ Error migrating produto ${produto.id}:`, error);
              stats.errors.push({ 
                type: 'produto', 
                id: produto.id, 
                error: error.message,
                nome: produto.nome 
              });
            }
          }
        } else {
          console.log('No produtos found in AsyncStorage');
        }
      } catch (error) {
        console.error('❌ Error in produtos migration:', error);
        stats.errors.push({ type: 'produtos_general', error: error.message });
      }

      // ==================== MIGRAR INDÚSTRIAS ====================
      try {
        console.log('📦 Migrating industrias...');
        const industriasData = await AsyncStorage.getItem('industrias');
        
        if (industriasData) {
          const industrias = JSON.parse(industriasData);
          console.log(`Found ${industrias.length} industrias in AsyncStorage`);
          
          for (const industria of industrias) {
            try {
              const validated = this.validateIndustria(industria);
              if (!validated) {
                stats.warnings.push({
                  type: 'industria',
                  id: industria.id,
                  message: 'Indústria inválida, pulada'
                });
                continue;
              }

              // Verificar se já existe
              const existing = await database.getAllIndustrias();
              const exists = existing.some(i => i.id === validated.id);

              if (!exists) {
                const success = await database.insertIndustria(validated);
                if (success) {
                  stats.industrias++;
                  console.log(`✅ Indústria migrada: ${validated.nome}`);
                } else {
                  throw new Error('Failed to insert industria');
                }
              } else {
                stats.warnings.push({
                  type: 'industria',
                  id: validated.id,
                  message: 'Indústria já existe no banco'
                });
              }
            } catch (error) {
              console.error(`❌ Error migrating industria ${industria.id}:`, error);
              stats.errors.push({ 
                type: 'industria', 
                id: industria.id, 
                error: error.message,
                nome: industria.nome 
              });
            }
          }
        } else {
          console.log('No industrias found in AsyncStorage');
        }
      } catch (error) {
        console.error('❌ Error in industrias migration:', error);
        stats.errors.push({ type: 'industrias_general', error: error.message });
      }

      // ==================== MIGRAR PEDIDOS ====================
      try {
        console.log('📦 Migrating pedidos...');
        const pedidosData = await AsyncStorage.getItem('pedidos');
        
        if (pedidosData) {
          const pedidos = JSON.parse(pedidosData);
          console.log(`Found ${pedidos.length} pedidos in AsyncStorage`);
          
          for (const pedido of pedidos) {
            try {
              const validated = this.validatePedido(pedido);
              if (!validated) {
                stats.warnings.push({
                  type: 'pedido',
                  id: pedido.id,
                  message: 'Pedido inválido, pulado'
                });
                continue;
              }

              // Verificar se já existe
              const existing = await database.getAllPedidos();
              const exists = existing.some(p => p.id === validated.id);

              if (!exists) {
                const success = await database.insertPedido(validated);
                if (success) {
                  stats.pedidos++;
                  console.log(`✅ Pedido migrado: #${validated.id}`);
                } else {
                  throw new Error('Failed to insert pedido');
                }
              } else {
                stats.warnings.push({
                  type: 'pedido',
                  id: validated.id,
                  message: 'Pedido já existe no banco'
                });
              }
            } catch (error) {
              console.error(`❌ Error migrating pedido ${pedido.id}:`, error);
              stats.errors.push({ 
                type: 'pedido', 
                id: pedido.id, 
                error: error.message 
              });
            }
          }
        } else {
          console.log('No pedidos found in AsyncStorage');
        }
      } catch (error) {
        console.error('❌ Error in pedidos migration:', error);
        stats.errors.push({ type: 'pedidos_general', error: error.message });
      }

      // ==================== MIGRAR CONFIGURAÇÕES ====================
      try {
        console.log('📦 Migrating settings...');
        const settingsData = await AsyncStorage.getItem('settings');
        
        if (settingsData) {
          const settings = JSON.parse(settingsData);
          console.log('Found settings in AsyncStorage');
          
          for (const [key, value] of Object.entries(settings)) {
            try {
              // Verificar se já existe
              const existing = await database.getConfiguracao(key);
              
              if (existing === null) {
                const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
                await database.setConfiguracao(key, valueStr);
                stats.configuracoes++;
                console.log(`✅ Configuração migrada: ${key}`);
              } else {
                stats.warnings.push({
                  type: 'configuracao',
                  key: key,
                  message: 'Configuração já existe no banco'
                });
              }
            } catch (error) {
              console.error(`❌ Error migrating setting ${key}:`, error);
              stats.errors.push({ 
                type: 'configuracao', 
                key, 
                error: error.message 
              });
            }
          }
        } else {
          console.log('No settings found in AsyncStorage');
        }
      } catch (error) {
        console.error('❌ Error in settings migration:', error);
        stats.errors.push({ type: 'settings_general', error: error.message });
      }

      // Marcar como migrado
      await database.setConfiguracao(this.migrationKey, 'true');
      await database.setConfiguracao('migration_version', this.migrationVersion);
      await database.setConfiguracao('migration_date', new Date().toISOString());
      await database.setConfiguracao('migration_stats', JSON.stringify(stats));

      console.log('✅ Migration completed successfully!');
      console.log('📊 Migration stats:', stats);

      return { success: true, stats, alreadyMigrated: false };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, error: error.message, stats };
    }
  }

  /**
   * Verifica dados no AsyncStorage (debug)
   */
  async checkAsyncStorageData() {
    try {
      const keys = ['clientes', 'produtos', 'industrias', 'pedidos', 'settings'];
      const results = {};
      
      for (const key of keys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            results[key] = Array.isArray(parsed) ? parsed.length : 'exists';
          } else {
            results[key] = 'not found';
          }
        } catch (error) {
          results[key] = `error: ${error.message}`;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error checking AsyncStorage:', error);
      return null;
    }
  }

  /**
   * Limpa dados do AsyncStorage (após migração bem-sucedida)
   */
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

  /**
   * Obtém tamanho dos dados no banco
   */
  async getDataSize() {
    try {
      const [clientes, produtos, industrias, pedidos] = await Promise.all([
        database.getAllClientes(),
        database.getAllProdutos(),
        database.getAllIndustrias(),
        database.getAllPedidos()
      ]);

      return {
        clientes: clientes.length,
        produtos: produtos.length,
        industrias: industrias.length,
        pedidos: pedidos.length,
        total: clientes.length + produtos.length + industrias.length + pedidos.length
      };
    } catch (error) {
      console.error('Error getting data size:', error);
      return null;
    }
  }

  /**
   * Reseta status de migração (apenas para testes/debug)
   */
  async resetMigration() {
    try {
      await database.setConfiguracao(this.migrationKey, 'false');
      await database.setConfiguracao('migration_version', '');
      console.log('✅ Migration status reset');
      return true;
    } catch (error) {
      console.error('Error resetting migration:', error);
      return false;
    }
  }

  /**
   * Exporta backup dos dados do AsyncStorage antes da migração
   */
  async createBackup() {
    try {
      console.log('💾 Creating backup...');
      const backup = {};
      const keys = ['clientes', 'produtos', 'industrias', 'pedidos', 'settings'];
      
      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          backup[key] = data;
        }
      }

      const backupStr = JSON.stringify(backup);
      await AsyncStorage.setItem('migration_backup', backupStr);
      await AsyncStorage.setItem('migration_backup_date', new Date().toISOString());
      
      console.log('✅ Backup created successfully');
      return { success: true, size: backupStr.length };
    } catch (error) {
      console.error('Error creating backup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restaura backup (em caso de falha na migração)
   */
  async restoreBackup() {
    try {
      console.log('♻️ Restoring backup...');
      const backupStr = await AsyncStorage.getItem('migration_backup');
      
      if (!backupStr) {
        throw new Error('No backup found');
      }

      const backup = JSON.parse(backupStr);
      
      for (const [key, value] of Object.entries(backup)) {
        await AsyncStorage.setItem(key, value);
      }
      
      console.log('✅ Backup restored successfully');
      return { success: true };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new MigrationService();