const UNIDADES_KEY = 'anagesso_unidades';
const UNIDADES_PADRAO = ['Un', 'Kg', 'Caixa', 'Saco', 'Metro', 'Rolo', 'Par'];

const Unidades = {
  get() {
    const raw = localStorage.getItem(UNIDADES_KEY);
    return raw ? JSON.parse(raw) : [...UNIDADES_PADRAO];
  },
  set(lista) { localStorage.setItem(UNIDADES_KEY, JSON.stringify(lista)); },
  add(u) {
    u = u.trim();
    if (!u) return false;
    const lista = this.get();
    if (lista.some(x => x.toLowerCase() === u.toLowerCase())) return false;
    lista.push(u);
    this.set(lista);
    return true;
  },
  remove(u) {
    this.set(this.get().filter(x => x !== u));
  },
};

const BaseItens = {
  dados: [],

  async render() {
    document.getElementById('pageTitle').textContent = 'Base de Itens';
    document.getElementById('content').innerHTML = `
      <div class="d-flex gap-2 mb-4 flex-wrap">
        <input type="text" class="form-control form-control-sm" id="buscaItem" placeholder="Buscar produto..." style="max-width:280px" oninput="BaseItens.filtrar()">
        <button class="btn btn-outline-secondary btn-sm" onclick="BaseItens.abrirModalUnidades()" title="Gerenciar unidades">
          <i class="bi bi-rulers me-1"></i>Unidades
        </button>
        <button class="btn btn-success btn-sm ms-auto" onclick="BaseItens.abrirModal()"><i class="bi bi-plus-lg me-1"></i>Novo Item</button>
      </div>
      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark"><tr><th>Produto</th><th>Unidade</th><th class="text-end">Preço (R$)</th><th class="text-center">Ações</th></tr></thead>
              <tbody id="tbodyItens"><tr><td colspan="4" class="text-center py-4">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Item -->
      <div class="modal fade" id="modalItem" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header"><h5 class="modal-title">Item</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
              <form id="formItem">
                <input type="hidden" id="itemId">
                <div class="mb-3">
                  <label class="form-label">Produto *</label>
                  <input type="text" class="form-control" id="itemProduto" required placeholder="Nome do produto">
                </div>
                <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label">Unidade *</label>
                    <select class="form-select" id="itemUnidade" required></select>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Preço (R$) *</label>
                    <input type="number" class="form-control" id="itemPrecoEdit" step="0.01" min="0" required>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="BaseItens.salvar()"><i class="bi bi-save me-1"></i>Salvar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Unidades -->
      <div class="modal fade" id="modalUnidades" tabindex="-1">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header"><h5 class="modal-title"><i class="bi bi-rulers me-2"></i>Unidades de Medida</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
              <div id="listaUnidades" class="mb-3"></div>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control" id="novaUnidade" placeholder="Nova unidade..." onkeydown="if(event.key==='Enter'){BaseItens.addUnidade();event.preventDefault();}">
                <button class="btn btn-success" onclick="BaseItens.addUnidade()"><i class="bi bi-plus-lg"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    await this.carregar();
  },

  async carregar() {
    try {
      Utils.showLoading(true);
      this.dados = await Api.getItens();
      this.renderTabela(this.dados);
    } catch (e) {
      document.getElementById('tbodyItens').innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Erro ao carregar.</td></tr>`;
    } finally {
      Utils.showLoading(false);
    }
  },

  filtrar() {
    const busca = document.getElementById('buscaItem')?.value.toLowerCase() || '';
    this.renderTabela(this.dados.filter(i => (i.produto || '').toLowerCase().includes(busca)));
  },

  renderTabela(dados) {
    const tbody = document.getElementById('tbodyItens');
    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Nenhum item encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = dados.map(i => `
      <tr>
        <td class="fw-semibold">${i.produto}</td>
        <td><span class="badge bg-secondary">${i.unidade || '—'}</span></td>
        <td class="text-end">${Utils.formatCurrency(i.preco)}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1" onclick="BaseItens.editar('${i.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" onclick="BaseItens.excluir('${i.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  },

  _preencherSelectUnidades(selecionada = '') {
    const sel = document.getElementById('itemUnidade');
    if (!sel) return;
    const lista = Unidades.get();
    sel.innerHTML = lista.map(u => `<option value="${u}" ${u === selecionada ? 'selected' : ''}>${u}</option>`).join('');
  },

  abrirModal(dados = null) {
    document.getElementById('itemId').value = dados?.id || '';
    document.getElementById('itemProduto').value = dados?.produto || '';
    document.getElementById('itemPrecoEdit').value = dados?.preco || '';
    this._preencherSelectUnidades(dados?.unidade || '');
    new bootstrap.Modal(document.getElementById('modalItem')).show();
  },

  editar(id) {
    const i = this.dados.find(x => x.id === id);
    if (i) this.abrirModal(i);
  },

  async salvar() {
    const form = document.getElementById('formItem');
    if (!form.reportValidity()) return;
    const payload = {
      id:       document.getElementById('itemId').value,
      produto:  document.getElementById('itemProduto').value,
      preco:    document.getElementById('itemPrecoEdit').value,
      unidade:  document.getElementById('itemUnidade').value,
    };
    try {
      Utils.showLoading(true);
      await Api.saveItem(payload);
      bootstrap.Modal.getInstance(document.getElementById('modalItem')).hide();
      Utils.showToast('Item salvo!');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  async excluir(id) {
    if (!Utils.confirm('Deseja excluir este item?')) return;
    try {
      Utils.showLoading(true);
      await Api.deleteItem(id);
      Utils.showToast('Item excluído.');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  abrirModalUnidades() {
    this._renderListaUnidades();
    new bootstrap.Modal(document.getElementById('modalUnidades')).show();
  },

  _renderListaUnidades() {
    const el = document.getElementById('listaUnidades');
    if (!el) return;
    const lista = Unidades.get();
    el.innerHTML = lista.map(u => `
      <div class="d-flex align-items-center justify-content-between py-1 border-bottom">
        <span class="small fw-semibold">${u}</span>
        <button class="btn btn-link text-danger p-0 btn-sm" onclick="BaseItens.removerUnidade('${u}')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>`).join('') || '<p class="text-muted small">Nenhuma unidade cadastrada.</p>';
  },

  addUnidade() {
    const inp = document.getElementById('novaUnidade');
    if (Unidades.add(inp.value)) {
      inp.value = '';
      this._renderListaUnidades();
      Utils.showToast('Unidade adicionada!');
    } else {
      Utils.showToast('Unidade já existe ou inválida.', 'warning');
    }
  },

  removerUnidade(u) {
    Unidades.remove(u);
    this._renderListaUnidades();
  },
};
