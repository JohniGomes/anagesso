const Orcamentos = {
  dados: [],
  itensBase: [],
  itensSelecionados: [],

  async render() {
    document.getElementById('pageTitle').textContent = 'Orçamentos';
    document.getElementById('content').innerHTML = `
      <div class="d-flex gap-2 mb-4">
        <input type="text" class="form-control form-control-sm" id="buscaOrc" placeholder="Buscar cliente ou orçamento..." style="max-width:300px" oninput="Orcamentos.filtrar()">
        <button class="btn btn-success btn-sm ms-auto" onclick="Orcamentos.abrirModal()"><i class="bi bi-plus-lg me-1"></i>Novo Orçamento</button>
      </div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr><th>#</th><th>Cliente</th><th>Data</th><th>Status</th><th class="text-end">Valor Total</th><th class="text-center">Ações</th></tr>
              </thead>
              <tbody id="tbodyOrc"><tr><td colspan="6" class="text-center py-4">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Orçamento -->
      <div class="modal fade" id="modalOrc" tabindex="-1">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white"><h5 class="modal-title">Orçamento</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
              <form id="formOrc">
                <input type="hidden" id="orcId">
                <div class="row g-3 mb-3">
                  <div class="col-md-5">
                    <label class="form-label">Nome do Cliente *</label>
                    <input type="text" class="form-control" id="orcCliente" required placeholder="Nome completo">
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Telefone</label>
                    <input type="tel" class="form-control" id="orcTelefone" placeholder="(62) 99999-9999">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">E-mail</label>
                    <input type="email" class="form-control" id="orcEmail" placeholder="cliente@email.com">
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Data</label>
                    <input type="date" class="form-control" id="orcData" value="${Utils.today()}">
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Status</label>
                    <select class="form-select" id="orcStatus">
                      <option>AGUARDANDO</option><option>APROVADO</option><option>RECUSADO</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Observações</label>
                    <textarea class="form-control" id="orcObs" rows="2" placeholder="Observações sobre o orçamento..."></textarea>
                  </div>
                </div>

                <hr>
                <h6 class="fw-semibold mb-3">Itens do Orçamento</h6>
                <div class="row g-2 mb-3 align-items-end">
                  <div class="col-md-5">
                    <label class="form-label small">Produto</label>
                    <select class="form-select form-select-sm" id="selectItem">
                      <option value="">Selecione um item...</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label small">Qtd</label>
                    <input type="number" class="form-control form-control-sm" id="itemQtd" value="1" min="0.01" step="0.01">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label small">Preço Unit.</label>
                    <input type="number" class="form-control form-control-sm" id="itemPreco" step="0.01" min="0">
                  </div>
                  <div class="col-md-3">
                    <button type="button" class="btn btn-primary btn-sm w-100" onclick="Orcamentos.adicionarItem()"><i class="bi bi-plus-circle me-1"></i>Adicionar</button>
                  </div>
                </div>

                <table class="table table-sm align-middle" id="tabelaItensOrc">
                  <thead class="table-light"><tr><th>Produto</th><th class="text-end">Qtd</th><th class="text-end">Preço Unit.</th><th class="text-end">Total</th><th></th></tr></thead>
                  <tbody id="tbodyItensOrc"><tr><td colspan="5" class="text-muted text-center">Nenhum item adicionado.</td></tr></tbody>
                  <tfoot><tr class="fw-bold"><td colspan="3" class="text-end">Total Geral:</td><td class="text-end text-success" id="totalOrc">R$ 0,00</td><td></td></tr></tfoot>
                </table>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" onclick="Orcamentos.imprimir()"><i class="bi bi-printer me-1"></i>Imprimir</button>
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="Orcamentos.salvar()"><i class="bi bi-save me-1"></i>Salvar</button>
            </div>
          </div>
        </div>
      </div>`;

    await this.carregar();
  },

  async carregar() {
    try {
      Utils.showLoading(true);
      [this.dados, this.itensBase] = await Promise.all([Api.getOrcamentos(), Api.getItens()]);
      this.renderTabela(this.dados);
    } catch (e) {
      document.getElementById('tbodyOrc').innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">Erro ao carregar. Configure o backend.</td></tr>`;
    } finally {
      Utils.showLoading(false);
    }
  },

  filtrar() {
    const busca = document.getElementById('buscaOrc')?.value.toLowerCase() || '';
    this.renderTabela(this.dados.filter(o => (o.cliente || '').toLowerCase().includes(busca)));
  },

  renderTabela(dados) {
    const tbody = document.getElementById('tbodyOrc');
    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum orçamento encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = dados.map((o, i) => `
      <tr>
        <td><span class="badge bg-secondary">#${String(i + 1).padStart(3, '0')}</span></td>
        <td>
          <div class="fw-semibold">${o.cliente}</div>
          <div class="text-muted small">${o.telefone || ''} ${o.email ? '· ' + o.email : ''}</div>
        </td>
        <td>${Utils.formatDate(o.data)}</td>
        <td><span class="badge ${o.status === 'APROVADO' ? 'bg-success' : o.status === 'RECUSADO' ? 'bg-danger' : 'bg-warning text-dark'}">${o.status || 'AGUARDANDO'}</span></td>
        <td class="text-end fw-bold">${Utils.formatCurrency(o.valorTotal)}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1" onclick="Orcamentos.editar('${o.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" onclick="Orcamentos.excluir('${o.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  },

  preencherSelectItens() {
    const sel = document.getElementById('selectItem');
    sel.innerHTML = '<option value="">Selecione um item...</option>' +
      this.itensBase.map(i => `<option value="${i.id}" data-preco="${i.preco}">${i.produto} — ${Utils.formatCurrency(i.preco)}</option>`).join('');
    sel.onchange = () => {
      const opt = sel.selectedOptions[0];
      if (opt?.dataset.preco) document.getElementById('itemPreco').value = opt.dataset.preco;
    };
  },

  adicionarItem() {
    const sel = document.getElementById('selectItem');
    const opt = sel.selectedOptions[0];
    if (!opt?.value) { Utils.showToast('Selecione um item.', 'warning'); return; }
    const qtd = parseFloat(document.getElementById('itemQtd').value) || 1;
    const preco = parseFloat(document.getElementById('itemPreco').value) || 0;
    this.itensSelecionados.push({
      id: opt.value, produto: opt.text.split(' — ')[0], qtd, precoUnit: preco, total: qtd * preco
    });
    sel.value = '';
    document.getElementById('itemQtd').value = 1;
    document.getElementById('itemPreco').value = '';
    this.renderItensModal();
  },

  renderItensModal() {
    const tbody = document.getElementById('tbodyItensOrc');
    if (!this.itensSelecionados.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">Nenhum item adicionado.</td></tr>';
      document.getElementById('totalOrc').textContent = Utils.formatCurrency(0);
      return;
    }
    tbody.innerHTML = this.itensSelecionados.map((item, idx) => `
      <tr>
        <td>${item.produto}</td>
        <td class="text-end">${item.qtd}</td>
        <td class="text-end">${Utils.formatCurrency(item.precoUnit)}</td>
        <td class="text-end fw-semibold">${Utils.formatCurrency(item.total)}</td>
        <td><button class="btn btn-link text-danger btn-sm p-0" onclick="Orcamentos.removerItem(${idx})"><i class="bi bi-x-circle"></i></button></td>
      </tr>`).join('');
    const total = this.itensSelecionados.reduce((s, i) => s + i.total, 0);
    document.getElementById('totalOrc').textContent = Utils.formatCurrency(total);
  },

  removerItem(idx) {
    this.itensSelecionados.splice(idx, 1);
    this.renderItensModal();
  },

  abrirModal(dados = null) {
    this.itensSelecionados = dados?.itens ? JSON.parse(dados.itens) : [];
    document.getElementById('orcId').value = dados?.id || '';
    document.getElementById('orcCliente').value = dados?.cliente || '';
    document.getElementById('orcTelefone').value = dados?.telefone || '';
    document.getElementById('orcEmail').value = dados?.email || '';
    document.getElementById('orcData').value = dados?.data || Utils.today();
    document.getElementById('orcStatus').value = dados?.status || 'AGUARDANDO';
    document.getElementById('orcObs').value = dados?.obs || '';
    this.preencherSelectItens();
    this.renderItensModal();
    new bootstrap.Modal(document.getElementById('modalOrc')).show();
  },

  editar(id) {
    const o = this.dados.find(x => x.id === id);
    if (o) this.abrirModal(o);
  },

  async salvar() {
    const form = document.getElementById('formOrc');
    if (!form.reportValidity()) return;
    const valorTotal = this.itensSelecionados.reduce((s, i) => s + i.total, 0);
    const payload = {
      id: document.getElementById('orcId').value,
      cliente: document.getElementById('orcCliente').value,
      telefone: document.getElementById('orcTelefone').value,
      email: document.getElementById('orcEmail').value,
      data: document.getElementById('orcData').value,
      status: document.getElementById('orcStatus').value,
      obs: document.getElementById('orcObs').value,
      itens: JSON.stringify(this.itensSelecionados),
      valorTotal,
    };
    try {
      Utils.showLoading(true);
      await Api.saveOrcamento(payload);
      bootstrap.Modal.getInstance(document.getElementById('modalOrc')).hide();
      Utils.showToast('Orçamento salvo com sucesso!');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  async excluir(id) {
    if (!Utils.confirm('Deseja excluir este orçamento?')) return;
    try {
      Utils.showLoading(true);
      await Api.deleteOrcamento(id);
      Utils.showToast('Orçamento excluído.');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  imprimir() {
    const cliente = document.getElementById('orcCliente').value;
    const tel = document.getElementById('orcTelefone').value;
    const email = document.getElementById('orcEmail').value;
    const data = document.getElementById('orcData').value;
    const obs = document.getElementById('orcObs').value;
    const total = this.itensSelecionados.reduce((s, i) => s + i.total, 0);
    const linhas = this.itensSelecionados.map(i =>
      `<tr><td>${i.produto}</td><td>${i.qtd}</td><td>${Utils.formatCurrency(i.precoUnit)}</td><td>${Utils.formatCurrency(i.total)}</td></tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><title>Orçamento Anagesso</title>
    <style>body{font-family:Arial;padding:20px;} table{width:100%;border-collapse:collapse;} td,th{border:1px solid #ccc;padding:8px;} th{background:#1a1a2e;color:#fff;} .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:3px solid #f59e0b;padding-bottom:10px;} h1{color:#1a1a2e;margin:0;font-size:22px;} .total{font-size:18px;font-weight:bold;text-align:right;margin-top:10px;}</style></head>
    <body>
      <div class="header"><div><h1>ANAGESSO</h1><div>Serviços em Drywall</div></div><div style="text-align:right"><div><b>Data:</b> ${Utils.formatDate(data)}</div></div></div>
      <h3>ORÇAMENTO</h3>
      <p><b>Cliente:</b> ${cliente} | <b>Telefone:</b> ${tel} | <b>E-mail:</b> ${email}</p>
      <table><thead><tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Total</th></tr></thead>
      <tbody>${linhas}</tbody></table>
      <div class="total">Total: ${Utils.formatCurrency(total)}</div>
      ${obs ? `<p style="margin-top:15px"><b>Observações:</b> ${obs}</p>` : ''}
      <p style="margin-top:30px;font-size:12px;color:#666">Anagesso Serviços de Drywall — Orçamento gerado em ${Utils.formatDate(Utils.today())}</p>
    </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  },
};
