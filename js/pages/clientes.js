const Clientes = {
  dados: [],

  async render() {
    document.getElementById('pageTitle').textContent = 'Clientes';
    document.getElementById('content').innerHTML = `
      <div class="d-flex gap-2 mb-4">
        <input type="text" class="form-control form-control-sm" id="buscaCliente" placeholder="Buscar cliente..." style="max-width:280px" oninput="Clientes.filtrar()">
        <button class="btn btn-success btn-sm ms-auto" onclick="Clientes.abrirModal()"><i class="bi bi-person-plus-fill me-1"></i>Novo Cliente</button>
      </div>
      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark"><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Cadastro</th><th class="text-center">Ações</th></tr></thead>
              <tbody id="tbodyClientes"><tr><td colspan="5" class="text-center py-4">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="modal fade" id="modalCliente" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header"><h5 class="modal-title">Cliente</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
              <form id="formCliente">
                <input type="hidden" id="clienteId">
                <div class="mb-3">
                  <label class="form-label">Nome *</label>
                  <input type="text" class="form-control" id="clienteNome" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Telefone</label>
                  <input type="tel" class="form-control" id="clienteTelefone" placeholder="(62) 99999-9999">
                </div>
                <div class="mb-3">
                  <label class="form-label">E-mail</label>
                  <input type="email" class="form-control" id="clienteEmail">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="Clientes.salvar()"><i class="bi bi-save me-1"></i>Salvar</button>
            </div>
          </div>
        </div>
      </div>`;

    await this.carregar();
  },

  async carregar() {
    try {
      Utils.showLoading(true);
      this.dados = await Api.getClientes();
      this.renderTabela(this.dados);
    } catch (e) {
      document.getElementById('tbodyClientes').innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Erro ao carregar.</td></tr>`;
    } finally {
      Utils.showLoading(false);
    }
  },

  filtrar() {
    const busca = document.getElementById('buscaCliente')?.value.toLowerCase() || '';
    this.renderTabela(this.dados.filter(c =>
      (c.nome || '').toLowerCase().includes(busca) ||
      (c.email || '').toLowerCase().includes(busca) ||
      (c.telefone || '').includes(busca)
    ));
  },

  renderTabela(dados) {
    const tbody = document.getElementById('tbodyClientes');
    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum cliente encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = dados.map(c => `
      <tr>
        <td class="fw-semibold">${c.nome}</td>
        <td>${c.telefone || '—'}</td>
        <td>${c.email || '—'}</td>
        <td>${Utils.formatDate(c.dataCadastro)}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1" onclick="Clientes.editar('${c.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" onclick="Clientes.excluir('${c.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  },

  abrirModal(dados = null) {
    document.getElementById('clienteId').value = dados?.id || '';
    document.getElementById('clienteNome').value = dados?.nome || '';
    document.getElementById('clienteTelefone').value = dados?.telefone || '';
    document.getElementById('clienteEmail').value = dados?.email || '';
    new bootstrap.Modal(document.getElementById('modalCliente')).show();
  },

  editar(id) {
    const c = this.dados.find(x => x.id === id);
    if (c) this.abrirModal(c);
  },

  async salvar() {
    const form = document.getElementById('formCliente');
    if (!form.reportValidity()) return;
    const payload = {
      id: document.getElementById('clienteId').value,
      nome: document.getElementById('clienteNome').value,
      telefone: document.getElementById('clienteTelefone').value,
      email: document.getElementById('clienteEmail').value,
    };
    try {
      Utils.showLoading(true);
      await Api.saveCliente(payload);
      bootstrap.Modal.getInstance(document.getElementById('modalCliente')).hide();
      Utils.showToast('Cliente salvo!');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  async excluir(id) {
    if (!Utils.confirm('Deseja excluir este cliente?')) return;
    try {
      Utils.showLoading(true);
      await Api.deleteCliente(id);
      Utils.showToast('Cliente excluído.');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },
};
