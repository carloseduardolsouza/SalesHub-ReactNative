import * as SQLite from 'expo-sqlite';

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('saleshub.db');
      await this.createTables();
      console.log('✅ Database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      return false;
    }
  }

  async createTables() {
    // Tabela de Clientes
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY,
        cnpj TEXT NOT NULL UNIQUE,
        nomeFantasia TEXT NOT NULL,
        razaoSocial TEXT NOT NULL,
        inscricaoEstadual TEXT,
        nomeComprador TEXT,
        email TEXT,
        telefone TEXT,
        dataNascimento TEXT,
        endereco_cep TEXT,
        endereco_logradouro TEXT,
        endereco_numero TEXT,
        endereco_complemento TEXT,
        endereco_bairro TEXT,
        endereco_cidade TEXT,
        endereco_estado TEXT,
        dataCadastro TEXT NOT NULL,
        dataAtualizacao TEXT
      );
    `);

    // Tabela de Produtos
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        industria TEXT NOT NULL,
        descricao TEXT,
        dataCadastro TEXT NOT NULL,
        dataAtualizacao TEXT
      );
    `);

    // Tabela de Imagens de Produtos
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS produto_imagens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        imagem TEXT NOT NULL,
        ordem INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
      );
    `);

    // Tabela de Variações de Produtos
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS produto_variacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        valor TEXT NOT NULL,
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
      );
    `);

    // Tabela de Indústrias
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS industrias (
        id INTEGER PRIMARY KEY,
        cnpj TEXT NOT NULL UNIQUE,
        nome TEXT NOT NULL,
        telefoneComercial TEXT,
        telefoneAssistencia TEXT,
        email TEXT,
        dataCadastro TEXT NOT NULL,
        dataEdicao TEXT
      );
    `);

    // Tabela de Pedidos
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY,
        cliente TEXT NOT NULL,
        total REAL NOT NULL,
        desconto_tipo TEXT,
        desconto_valor TEXT,
        metodoPagamento TEXT NOT NULL,
        observacoes TEXT,
        status TEXT DEFAULT 'pendente',
        data TEXT NOT NULL
      );
    `);

    // Tabela de Produtos do Pedido
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS pedido_produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        produto_id INTEGER,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        quantidade INTEGER NOT NULL,
        desconto_tipo TEXT,
        desconto_valor TEXT,
        variacao_tipo TEXT,
        variacao_valor TEXT,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
      );
    `);

    // Tabela de Prazos do Pedido
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS pedido_prazos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        dias TEXT NOT NULL,
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
      );
    `);

    // Tabela de Configurações
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
      );
    `);

    console.log('✅ Tables created successfully');
  }

  // ==================== CLIENTES ====================
  
  async getAllClientes() {
    try {
      const result = await this.db.getAllAsync('SELECT * FROM clientes ORDER BY nomeFantasia');
      
      return result.map(row => ({
        id: row.id,
        cnpj: row.cnpj,
        nomeFantasia: row.nomeFantasia,
        razaoSocial: row.razaoSocial,
        inscricaoEstadual: row.inscricaoEstadual,
        nomeComprador: row.nomeComprador,
        email: row.email,
        telefone: row.telefone,
        dataNascimento: row.dataNascimento ? new Date(row.dataNascimento) : new Date(),
        endereco: {
          cep: row.endereco_cep || '',
          logradouro: row.endereco_logradouro || '',
          numero: row.endereco_numero || '',
          complemento: row.endereco_complemento || '',
          bairro: row.endereco_bairro || '',
          cidade: row.endereco_cidade || '',
          estado: row.endereco_estado || ''
        },
        dataCadastro: row.dataCadastro
      }));
    } catch (error) {
      console.error('Error getting clientes:', error);
      return [];
    }
  }

  async insertCliente(cliente) {
    try {
      const result = await this.db.runAsync(
        `INSERT INTO clientes (
          id, cnpj, nomeFantasia, razaoSocial, inscricaoEstadual,
          nomeComprador, email, telefone, dataNascimento,
          endereco_cep, endereco_logradouro, endereco_numero,
          endereco_complemento, endereco_bairro, endereco_cidade,
          endereco_estado, dataCadastro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cliente.id,
          cliente.cnpj,
          cliente.nomeFantasia,
          cliente.razaoSocial,
          cliente.inscricaoEstadual || null,
          cliente.nomeComprador || null,
          cliente.email || null,
          cliente.telefone || null,
          cliente.dataNascimento?.toISOString?.() || new Date().toISOString(),
          cliente.endereco?.cep || null,
          cliente.endereco?.logradouro || null,
          cliente.endereco?.numero || null,
          cliente.endereco?.complemento || null,
          cliente.endereco?.bairro || null,
          cliente.endereco?.cidade || null,
          cliente.endereco?.estado || null,
          cliente.dataCadastro || new Date().toISOString()
        ]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error inserting cliente:', error);
      return false;
    }
  }

  async updateCliente(cliente) {
    try {
      const result = await this.db.runAsync(
        `UPDATE clientes SET
          cnpj = ?, nomeFantasia = ?, razaoSocial = ?, inscricaoEstadual = ?,
          nomeComprador = ?, email = ?, telefone = ?, dataNascimento = ?,
          endereco_cep = ?, endereco_logradouro = ?, endereco_numero = ?,
          endereco_complemento = ?, endereco_bairro = ?, endereco_cidade = ?,
          endereco_estado = ?, dataAtualizacao = ?
        WHERE id = ?`,
        [
          cliente.cnpj,
          cliente.nomeFantasia,
          cliente.razaoSocial,
          cliente.inscricaoEstadual || null,
          cliente.nomeComprador || null,
          cliente.email || null,
          cliente.telefone || null,
          cliente.dataNascimento?.toISOString?.() || new Date().toISOString(),
          cliente.endereco?.cep || null,
          cliente.endereco?.logradouro || null,
          cliente.endereco?.numero || null,
          cliente.endereco?.complemento || null,
          cliente.endereco?.bairro || null,
          cliente.endereco?.cidade || null,
          cliente.endereco?.estado || null,
          new Date().toISOString(),
          cliente.id
        ]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating cliente:', error);
      return false;
    }
  }

  async deleteCliente(id) {
    try {
      const result = await this.db.runAsync('DELETE FROM clientes WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting cliente:', error);
      return false;
    }
  }

  // ==================== PRODUTOS ====================

  async getAllProdutos() {
    try {
      const produtos = await this.db.getAllAsync('SELECT * FROM produtos ORDER BY nome');
      
      const produtosCompletos = await Promise.all(
        produtos.map(async (produto) => {
          const imagens = await this.db.getAllAsync(
            'SELECT imagem FROM produto_imagens WHERE produto_id = ? ORDER BY ordem',
            [produto.id]
          );
          
          const variacoes = await this.db.getAllAsync(
            'SELECT tipo, valor FROM produto_variacoes WHERE produto_id = ?',
            [produto.id]
          );

          return {
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            industria: produto.industria,
            descricao: produto.descricao,
            imagens: imagens.map(img => img.imagem),
            variacoes: variacoes,
            dataCadastro: produto.dataCadastro,
            dataAtualizacao: produto.dataAtualizacao
          };
        })
      );

      return produtosCompletos;
    } catch (error) {
      console.error('Error getting produtos:', error);
      return [];
    }
  }

  async insertProduto(produto) {
    try {
      await this.db.runAsync(
        `INSERT INTO produtos (id, nome, preco, industria, descricao, dataCadastro)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          produto.id,
          produto.nome,
          produto.preco,
          produto.industria,
          produto.descricao || null,
          produto.dataCadastro || new Date().toISOString()
        ]
      );

      if (produto.imagens && produto.imagens.length > 0) {
        for (let i = 0; i < produto.imagens.length; i++) {
          await this.db.runAsync(
            'INSERT INTO produto_imagens (produto_id, imagem, ordem) VALUES (?, ?, ?)',
            [produto.id, produto.imagens[i], i]
          );
        }
      }

      if (produto.variacoes && produto.variacoes.length > 0) {
        for (const variacao of produto.variacoes) {
          await this.db.runAsync(
            'INSERT INTO produto_variacoes (produto_id, tipo, valor) VALUES (?, ?, ?)',
            [produto.id, variacao.tipo, variacao.valor]
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error inserting produto:', error);
      return false;
    }
  }

  async updateProduto(produto) {
    try {
      await this.db.runAsync(
        `UPDATE produtos SET nome = ?, preco = ?, industria = ?, 
         descricao = ?, dataAtualizacao = ? WHERE id = ?`,
        [
          produto.nome,
          produto.preco,
          produto.industria,
          produto.descricao || null,
          new Date().toISOString(),
          produto.id
        ]
      );

      await this.db.runAsync('DELETE FROM produto_imagens WHERE produto_id = ?', [produto.id]);
      if (produto.imagens && produto.imagens.length > 0) {
        for (let i = 0; i < produto.imagens.length; i++) {
          await this.db.runAsync(
            'INSERT INTO produto_imagens (produto_id, imagem, ordem) VALUES (?, ?, ?)',
            [produto.id, produto.imagens[i], i]
          );
        }
      }

      await this.db.runAsync('DELETE FROM produto_variacoes WHERE produto_id = ?', [produto.id]);
      if (produto.variacoes && produto.variacoes.length > 0) {
        for (const variacao of produto.variacoes) {
          await this.db.runAsync(
            'INSERT INTO produto_variacoes (produto_id, tipo, valor) VALUES (?, ?, ?)',
            [produto.id, variacao.tipo, variacao.valor]
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating produto:', error);
      return false;
    }
  }

  async deleteProduto(id) {
    try {
      await this.db.runAsync('DELETE FROM produto_imagens WHERE produto_id = ?', [id]);
      await this.db.runAsync('DELETE FROM produto_variacoes WHERE produto_id = ?', [id]);
      const result = await this.db.runAsync('DELETE FROM produtos WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting produto:', error);
      return false;
    }
  }

  // ==================== INDÚSTRIAS ====================

  async getAllIndustrias() {
    try {
      const result = await this.db.getAllAsync('SELECT * FROM industrias ORDER BY nome');
      return result.map(row => ({
        id: row.id,
        cnpj: row.cnpj,
        nome: row.nome,
        telefoneComercial: row.telefoneComercial,
        telefoneAssistencia: row.telefoneAssistencia,
        email: row.email,
        dataCadastro: row.dataCadastro,
        dataEdicao: row.dataEdicao
      }));
    } catch (error) {
      console.error('Error getting industrias:', error);
      return [];
    }
  }

  async insertIndustria(industria) {
    try {
      const result = await this.db.runAsync(
        `INSERT INTO industrias (id, cnpj, nome, telefoneComercial, 
         telefoneAssistencia, email, dataCadastro)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          industria.id,
          industria.cnpj,
          industria.nome,
          industria.telefoneComercial || null,
          industria.telefoneAssistencia || null,
          industria.email || null,
          industria.dataCadastro || new Date().toISOString()
        ]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error inserting industria:', error);
      return false;
    }
  }

  async updateIndustria(industria) {
    try {
      const result = await this.db.runAsync(
        `UPDATE industrias SET cnpj = ?, nome = ?, telefoneComercial = ?,
         telefoneAssistencia = ?, email = ?, dataEdicao = ?
         WHERE id = ?`,
        [
          industria.cnpj,
          industria.nome,
          industria.telefoneComercial || null,
          industria.telefoneAssistencia || null,
          industria.email || null,
          new Date().toISOString(),
          industria.id
        ]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating industria:', error);
      return false;
    }
  }

  async deleteIndustria(id) {
    try {
      const result = await this.db.runAsync('DELETE FROM industrias WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting industria:', error);
      return false;
    }
  }

  // ==================== PEDIDOS ====================

  async getAllPedidos() {
    try {
      const pedidos = await this.db.getAllAsync('SELECT * FROM pedidos ORDER BY data DESC');
      
      const pedidosCompletos = await Promise.all(
        pedidos.map(async (pedido) => {
          const produtos = await this.db.getAllAsync(
            `SELECT * FROM pedido_produtos WHERE pedido_id = ?`,
            [pedido.id]
          );

          const prazos = await this.db.getAllAsync(
            `SELECT dias FROM pedido_prazos WHERE pedido_id = ?`,
            [pedido.id]
          );

          return {
            id: pedido.id,
            cliente: pedido.cliente,
            total: pedido.total,
            desconto: {
              tipo: pedido.desconto_tipo || 'percentual',
              valor: pedido.desconto_valor || ''
            },
            metodoPagamento: pedido.metodoPagamento,
            observacoes: pedido.observacoes,
            status: pedido.status,
            data: pedido.data,
            produtos: produtos.map(p => ({
              id: p.produto_id,
              nome: p.nome,
              preco: p.preco,
              quantidade: p.quantidade,
              desconto: {
                tipo: p.desconto_tipo || 'percentual',
                valor: p.desconto_valor || ''
              },
              variacaoSelecionada: p.variacao_tipo ? {
                tipo: p.variacao_tipo,
                valor: p.variacao_valor
              } : null
            })),
            prazos: prazos.map(p => ({ dias: p.dias }))
          };
        })
      );

      return pedidosCompletos;
    } catch (error) {
      console.error('Error getting pedidos:', error);
      return [];
    }
  }

  async insertPedido(pedido) {
    try {
      await this.db.runAsync(
        `INSERT INTO pedidos (id, cliente, total, desconto_tipo, desconto_valor,
         metodoPagamento, observacoes, status, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pedido.id,
          pedido.cliente,
          pedido.total,
          pedido.desconto?.tipo || null,
          pedido.desconto?.valor || null,
          pedido.metodoPagamento,
          pedido.observacoes || null,
          pedido.status || 'pendente',
          pedido.data || new Date().toISOString()
        ]
      );

      if (pedido.produtos && pedido.produtos.length > 0) {
        for (const produto of pedido.produtos) {
          await this.db.runAsync(
            `INSERT INTO pedido_produtos (pedido_id, produto_id, nome, preco, quantidade,
             desconto_tipo, desconto_valor, variacao_tipo, variacao_valor)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pedido.id,
              produto.id || null,
              produto.nome,
              produto.preco,
              produto.quantidade,
              produto.desconto?.tipo || null,
              produto.desconto?.valor || null,
              produto.variacaoSelecionada?.tipo || null,
              produto.variacaoSelecionada?.valor || null
            ]
          );
        }
      }

      if (pedido.prazos && pedido.prazos.length > 0) {
        for (const prazo of pedido.prazos) {
          await this.db.runAsync(
            'INSERT INTO pedido_prazos (pedido_id, dias) VALUES (?, ?)',
            [pedido.id, prazo.dias]
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error inserting pedido:', error);
      return false;
    }
  }

  async updatePedido(pedido) {
    try {
      await this.db.runAsync(
        `UPDATE pedidos SET cliente = ?, total = ?, desconto_tipo = ?,
         desconto_valor = ?, metodoPagamento = ?, observacoes = ?, status = ?
         WHERE id = ?`,
        [
          pedido.cliente,
          pedido.total,
          pedido.desconto?.tipo || null,
          pedido.desconto?.valor || null,
          pedido.metodoPagamento,
          pedido.observacoes || null,
          pedido.status || 'pendente',
          pedido.id
        ]
      );

      await this.db.runAsync('DELETE FROM pedido_produtos WHERE pedido_id = ?', [pedido.id]);
      if (pedido.produtos && pedido.produtos.length > 0) {
        for (const produto of pedido.produtos) {
          await this.db.runAsync(
            `INSERT INTO pedido_produtos (pedido_id, produto_id, nome, preco, quantidade,
             desconto_tipo, desconto_valor, variacao_tipo, variacao_valor)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pedido.id,
              produto.id || null,
              produto.nome,
              produto.preco,
              produto.quantidade,
              produto.desconto?.tipo || null,
              produto.desconto?.valor || null,
              produto.variacaoSelecionada?.tipo || null,
              produto.variacaoSelecionada?.valor || null
            ]
          );
        }
      }

      await this.db.runAsync('DELETE FROM pedido_prazos WHERE pedido_id = ?', [pedido.id]);
      if (pedido.prazos && pedido.prazos.length > 0) {
        for (const prazo of pedido.prazos) {
          await this.db.runAsync(
            'INSERT INTO pedido_prazos (pedido_id, dias) VALUES (?, ?)',
            [pedido.id, prazo.dias]
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating pedido:', error);
      return false;
    }
  }

  async deletePedido(id) {
    try {
      await this.db.runAsync('DELETE FROM pedido_produtos WHERE pedido_id = ?', [id]);
      await this.db.runAsync('DELETE FROM pedido_prazos WHERE pedido_id = ?', [id]);
      const result = await this.db.runAsync('DELETE FROM pedidos WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting pedido:', error);
      return false;
    }
  }

  // ==================== CONFIGURAÇÕES ====================

  async getConfiguracao(chave) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT valor FROM configuracoes WHERE chave = ?',
        [chave]
      );
      return result ? result.valor : null;
    } catch (error) {
      console.error('Error getting configuracao:', error);
      return null;
    }
  }

  async setConfiguracao(chave, valor) {
    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)`,
        [chave, valor]
      );
      return true;
    } catch (error) {
      console.error('Error setting configuracao:', error);
      return false;
    }
  }

  async getAllConfiguracoes() {
    try {
      const result = await this.db.getAllAsync('SELECT * FROM configuracoes');
      const config = {};
      result.forEach(row => {
        config[row.chave] = row.valor;
      });
      return config;
    } catch (error) {
      console.error('Error getting all configuracoes:', error);
      return {};
    }
  }
}

export default new Database();