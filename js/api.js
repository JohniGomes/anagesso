const Api = {
  async call(action, params = {}) {
    const url = new URL(CONFIG.apiUrl);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  },

  async post(action, body = {}) {
    const res = await fetch(CONFIG.apiUrl, {
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

  // Dashboard
  getDashboard: () => Api.call('getDashboard'),
};
