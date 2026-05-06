const BaseItens = {
  dados: [],

  async render() {
    document.getElementById('pageTitle').textContent = 'Base de Itens';
    document.getElementById('content').innerHTML = `
      <div class="d-flex gap-2 mb-4">
        <input type="text" class="form-control form-control-sm" id="buscaItem" placeholder="Buscar produto..." style="max-width:280px" oninput="BaseItens.filtrar()">
        <button class="btn btn-success btn-sm ms-auto" onclick="BaseItens.abrirModal()"><i class="bi bi-plus-lg me-1"></i>Novo Item</button>
      </div>
      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark"><tr><th>Produto</th><th class="text-end">Preço (R$)</th><th class="text-center">Ações</th></tr></thead>
              <tbody id="tbodyItens"><tr><td colspan="3" class="text-center py-4">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

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
                <div class="mb-3">
                  <label class="form-label">Preço (R$) *</label>
                  <input type="number" class="form-control" id="itemPrecoEdit" step="0.01" min="0" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="BaseItens.salvar()"><i class="bi bi-save me-1"></i>Salvar</button>
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
      document.getElementById('tbodyItens').innerHTML = `<tr><td colspan="3" class="text-center text-danger py-3">Erro ao carregar.</td></tr>`;
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
      tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted">Nenhum item encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = dados.map(i => `
      <tr>
        <td class="fw-semibold">${i.produto}</td>
        <td class="text-end">${Utils.formatCurrency(i.preco)}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1" onclick="BaseItens.editar('${i.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" onclick="BaseItens.excluir('${i.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  },

  abrirModal(dados = null) {
    document.getElementById('itemId').value = dados?.id || '';
    document.getElementById('itemProduto').value = dados?.produto || '';
    document.getElementById('itemPrecoEdit').value = dados?.preco || '';
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
      id: document.getElementById('itemId').value,
      produto: document.getElementById('itemProduto').value,
      preco: document.getElementById('itemPrecoEdit').value,
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
};
