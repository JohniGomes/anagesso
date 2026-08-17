// ── Supabase client ───────────────────────────────────────────
const _sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

const Api = {
  _db: _sb,

  async _q(promise) {
    const { data, error } = await promise;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async _q1(promise) {
    const { data, error } = await promise;
    if (error) throw new Error(error.message);
    return data;
  },

  // ── Clientes ────────────────────────────────────────────────
  getClientes: () => Api._q(Api._db.from('clientes').select('*').order('nome')),

  saveCliente: async (d) => {
    if (!d.id) {
      d.id = crypto.randomUUID();
      if (!d.dataCadastro) d.dataCadastro = new Date().toISOString().split('T')[0];
      return Api._q(Api._db.from('clientes').insert(d));
    }
    return Api._q(Api._db.from('clientes').update(d).eq('id', d.id));
  },

  deleteCliente: (id) => Api._q(Api._db.from('clientes').delete().eq('id', id)),

  // ── Base de Itens ───────────────────────────────────────────
  getItens: () => Api._q(Api._db.from('base_itens').select('*').order('produto')),

  saveItem: async (d) => {
    if (!d.id) {
      d.id = crypto.randomUUID();
      return Api._q(Api._db.from('base_itens').insert(d));
    }
    return Api._q(Api._db.from('base_itens').update(d).eq('id', d.id));
  },

  deleteItem: (id) => Api._q(Api._db.from('base_itens').delete().eq('id', id)),

  // ── Obras ───────────────────────────────────────────────────
  getObras: () => Api._q(Api._db.from('obras').select('*').order('dtInicio', { ascending: false })),

  saveObra: async (d) => {
    if (!d.id) {
      d.id = crypto.randomUUID();
      return Api._q(Api._db.from('obras').insert(d));
    }
    return Api._q(Api._db.from('obras').update(d).eq('id', d.id));
  },

  deleteObra: (id) => Api._q(Api._db.from('obras').delete().eq('id', id)),

  // ── Mão de Obra ─────────────────────────────────────────────
  getMaoDeObra: async (filtros = {}) => {
    let q = Api._db.from('mao_de_obra').select('*');
    if (filtros.mes) {
      const [y, m] = filtros.mes.split('-');
      const lastDay = new Date(+y, +m, 0).getDate();
      q = q.gte('data', `${filtros.mes}-01`).lte('data', `${filtros.mes}-${lastDay}`);
    }
    if (filtros.dtIni) q = q.gte('data', filtros.dtIni);
    if (filtros.dtFim) q = q.lte('data', filtros.dtFim);
    if (filtros.funcionario) q = q.eq('funcionario', filtros.funcionario);
    return Api._q(q.order('data'));
  },

  saveMaoDeObra: async (d) => {
    if (!d.id) {
      d.id = crypto.randomUUID();
      return Api._q(Api._db.from('mao_de_obra').insert(d));
    }
    return Api._q(Api._db.from('mao_de_obra').update(d).eq('id', d.id));
  },

  deleteMaoDeObra: (id) => Api._q(Api._db.from('mao_de_obra').delete().eq('id', id)),

  // ── Orçamentos ──────────────────────────────────────────────
  getOrcamentos: () => Api._q(Api._db.from('orcamentos').select('*').order('data', { ascending: false })),

  saveOrcamento: async (d) => {
    if (!d.id) {
      d.id = crypto.randomUUID();
      return Api._q(Api._db.from('orcamentos').insert(d));
    }
    return Api._q(Api._db.from('orcamentos').update(d).eq('id', d.id));
  },

  deleteOrcamento: (id) => Api._q(Api._db.from('orcamentos').delete().eq('id', id)),

  // ── Financeiro ──────────────────────────────────────────────
  getFinanceiro: async (filtros = {}) => {
    let q = Api._db.from('financeiro').select('*');
    if (filtros.tipo)   q = q.eq('tipo',   filtros.tipo);
    if (filtros.cat)    q = q.eq('cat',    filtros.cat);
    if (filtros.status) q = q.eq('status', filtros.status);
    return Api._q(q.order('emissao', { ascending: false }));
  },

  saveFinanceiro: async (d) => {
    if (!d.id) {
      d.id = crypto.randomUUID();
      return Api._q(Api._db.from('financeiro').insert(d));
    }
    return Api._q(Api._db.from('financeiro').update(d).eq('id', d.id));
  },

  deleteFinanceiro: (id) => Api._q(Api._db.from('financeiro').delete().eq('id', id)),

  // ── Veículos ────────────────────────────────────────────────
  getVeiculos: () => Api._q(Api._db.from('veiculos').select('*').order('data', { ascending: false })),

  saveVeiculo: async (d) => {
    if (!d.id) {
      d.id = crypto.randomUUID();
      return Api._q(Api._db.from('veiculos').insert(d));
    }
    return Api._q(Api._db.from('veiculos').update(d).eq('id', d.id));
  },

  deleteVeiculo: (id) => Api._q(Api._db.from('veiculos').delete().eq('id', id)),

  // ── Cobranças ───────────────────────────────────────────────
  getCobranca: () => Api._q(Api._db.from('cobranca').select('*').order('dataCadastro', { ascending: false })),

  saveCobranca: async (d) => {
    if (!d.id) {
      d.id = crypto.randomUUID();
      if (!d.dataCadastro) d.dataCadastro = new Date().toISOString().split('T')[0];
      return Api._q(Api._db.from('cobranca').insert(d));
    }
    return Api._q(Api._db.from('cobranca').update(d).eq('id', d.id));
  },

  deleteCobranca: (id) => Api._q(Api._db.from('cobranca').delete().eq('id', id)),

  // ── Compras de Material ─────────────────────────────────────
  getCompras: async (filtros = {}) => {
    let q = Api._db.from('compras').select('*');
    if (filtros.obraId) q = q.eq('obraId', filtros.obraId);
    return Api._q(q.order('data', { ascending: false }));
  },

  saveCompra: async (d) => {
    let result;
    if (!d.id) {
      d.id = crypto.randomUUID();
      if (!d.dataCadastro) d.dataCadastro = new Date().toISOString().split('T')[0];
      result = await Api._q(Api._db.from('compras').insert(d));
    } else {
      result = await Api._q(Api._db.from('compras').update(d).eq('id', d.id));
    }
    // Atualiza custo de material da obra vinculada
    if (d.obraId && d.valorTotal) {
      const obra = await Api._q1(Api._db.from('obras').select('*').eq('id', d.obraId).single());
      if (obra) {
        const newMat = (parseFloat(obra.material) || 0) + parseFloat(d.valorTotal);
        const custo  = newMat + (parseFloat(obra.maoDeObra) || 0) + (parseFloat(obra.variaveis) || 0);
        const lucro  = (parseFloat(obra.valorOrcamento) || 0) - custo;
        await Api._db.from('obras').update({ material: newMat, custoObra: custo, lucro }).eq('id', d.obraId);
      }
    }
    return result;
  },

  deleteCompra: (id) => Api._q(Api._db.from('compras').delete().eq('id', id)),

  // ── Dashboard (calculado client-side) ───────────────────────
  getDashboard: async () => {
    const mesAtual = new Date().toISOString().slice(0, 7);
    const [y, m]   = mesAtual.split('-');
    const lastDay  = new Date(+y, +m, 0).getDate();

    const [obras, moMes, orcamentos] = await Promise.all([
      Api._q(Api._db.from('obras').select('*')),
      Api._q(Api._db.from('mao_de_obra').select('*')
        .gte('data', `${mesAtual}-01`)
        .lte('data', `${mesAtual}-${lastDay}`)),
      Api._q(Api._db.from('orcamentos').select('*')),
    ]);

    const obrasAndamento = obras.filter(o => o.fase === 'ANDAMENTO').length;
    const totalPago      = obras.reduce((s, o) => s + (parseFloat(o.valorPago)    || 0), 0);
    const totalReceber   = obras.reduce((s, o) => s + (parseFloat(o.valorReceber) || 0), 0);
    const lucroTotal     = obras.reduce((s, o) => s + (parseFloat(o.lucro)        || 0), 0);
    const obrasPorFase   = obras.reduce((acc, o) => {
      const f = o.fase || 'Sem fase';
      acc[f] = (acc[f] || 0) + 1;
      return acc;
    }, {});

    const moTotalValor = moMes.reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);
    const moTotalVale  = moMes.reduce((s, r) => s + (parseFloat(r.vale)  || 0), 0);
    const moPorFunc    = {};
    moMes.forEach(r => {
      if (!moPorFunc[r.funcionario]) moPorFunc[r.funcionario] = { valor: 0, vale: 0 };
      moPorFunc[r.funcionario].valor += parseFloat(r.valor) || 0;
      moPorFunc[r.funcionario].vale  += parseFloat(r.vale)  || 0;
    });

    const orcTotal      = orcamentos.length;
    const orcAprovados  = orcamentos.filter(o => o.status === 'APROVADO').length;
    const orcAguardando = orcamentos.filter(o => o.status === 'AGUARDANDO').length;
    const orcValorTotal = orcamentos.reduce((s, o) => s + (parseFloat(o.valorTotal) || 0), 0);

    return {
      totalObras: obras.length,
      obrasAndamento,
      totalPago,
      totalReceber,
      lucroTotal,
      obras: [...obras].sort((a, b) => (b.dtInicio || '').localeCompare(a.dtInicio || '')).slice(0, 10),
      obrasPorFase,
      mo:  { mesAtual, totalValor: moTotalValor, totalVale: moTotalVale, saldo: moTotalValor - moTotalVale, porFunc: moPorFunc },
      orc: { total: orcTotal, aprovados: orcAprovados, aguardando: orcAguardando, valorTotal: orcValorTotal },
    };
  },
};
