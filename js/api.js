const Api = {
  _timeout: 25000, // 25s — evita loading eterno se o GAS não responder

  async _fetch(input, init) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this._timeout);
    try {
      return await fetch(input, { ...init, signal: ctrl.signal });
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Tempo limite atingido. Verifique a conexão ou reimplante o Apps Script.');
      throw e;
    } finally {
      clearTimeout(timer);
    }
  },

  async call(action, params = {}) {
    const url = new URL(CONFIG.apiUrl);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v));
    const res = await this._fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  },

  async post(action, body = {}) {
    const res = await this._fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...body }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  },

  // Clientes
  getClientes: () => Api.call('getClientes'),
  saveCliente: (data) => Api.post('saveCliente', data),
  deleteCliente: (id) => Api.post('deleteCliente', { id }),

  // Base de Itens
  getItens: () => Api.call('getItens'),
  saveItem: (data) => Api.post('saveItem', data),
  deleteItem: (id) => Api.post('deleteItem', { id }),

  // Obras
  getObras: () => Api.call('getObras'),
  saveObra: (data) => Api.post('saveObra', data),
  deleteObra: (id) => Api.post('deleteObra', { id }),

  // Mão de Obra
  getMaoDeObra: (filtros = {}) => Api.call('getMaoDeObra', filtros),
  saveMaoDeObra: (data) => Api.post('saveMaoDeObra', data),
  deleteMaoDeObra: (id) => Api.post('deleteMaoDeObra', { id }),

  // Orçamentos
  getOrcamentos: () => Api.call('getOrcamentos'),
  saveOrcamento: (data) => Api.post('saveOrcamento', data),
  deleteOrcamento: (id) => Api.post('deleteOrcamento', { id }),

  // Financeiro
  getFinanceiro:    (filtros = {}) => Api.call('getFinanceiro', filtros),
  saveFinanceiro:   (data)        => Api.post('saveFinanceiro', data),
  deleteFinanceiro: (id)          => Api.post('deleteFinanceiro', { id }),

  // Veículos
  getVeiculos:    ()     => Api.call('getVeiculos'),
  saveVeiculo:    (data) => Api.post('saveVeiculo', data),
  deleteVeiculo:  (id)   => Api.post('deleteVeiculo', { id }),

  // Cobranças
  getCobranca:    ()     => Api.call('getCobranca'),
  saveCobranca:   (data) => Api.post('saveCobranca', data),
  deleteCobranca: (id)   => Api.post('deleteCobranca', { id }),

  // Compras de Material
  getCompras:    (filtros = {}) => Api.call('getCompras', filtros),
  saveCompra:    (data)         => Api.post('saveCompra', data),
  deleteCompra:  (id)           => Api.post('deleteCompra', { id }),

  // Dashboard
  getDashboard: () => Api.call('getDashboard'),
};
