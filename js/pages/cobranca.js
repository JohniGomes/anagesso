const Cobranca = {
  dados: [],

  async render() {
    document.getElementById('pageTitle').textContent = 'Controle de Cobranças';
    document.getElementById('content').innerHTML = `
      <div class="d-flex flex-wrap gap-2 mb-4">
        <input type="text" class="form-control form-control-sm" id="buscaCobranca" placeholder="Buscar cliente..." style="max-width:260px" oninput="Cobranca.filtrar()">
        <select class="form-select form-select-sm" id="filtroStatusCob" style="max-width:160px" onchange="Cobranca.filtrar()">
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="QUITADO">Quitado</option>
          <option value="ATRASADO">Atrasado</option>
        </select>
        <button class="btn btn-success btn-sm ms-auto" onclick="Cobranca.abrirModal()">
          <i class="bi bi-plus-lg me-1"></i>Nova Cobrança
        </button>
      </div>

      <div class="row g-3 mb-4" id="cobKpis"></div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr>
                  <th>Cliente</th><th>Telefone</th><th>Valor Total</th>
                  <th>Parcelas</th><th>Dia Venc.</th><th>Status</th>
                  <th>Obs</th><th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody id="tbodyCobranca"><tr><td colspan="8" class="text-center py-4">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Cobrança -->
      <div class="modal fade" id="modalCobranca" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title"><i class="bi bi-receipt me-2"></i>Cobrança</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formCobranca">
                <input type="hidden" id="cobrancaId">
                <div class="row g-3">
                  <div class="col-8">
                    <label class="form-label">Cliente *</label>
                    <input type="text" class="form-control" id="cobCliente" required placeholder="Nome do cliente">
                  </div>
                  <div class="col-4">
                    <label class="form-label">Status</label>
                    <select class="form-select" id="cobStatus">
                      <option value="ATIVO">Ativo</option>
                      <option value="ATRASADO">Atrasado</option>
                      <option value="QUITADO">Quitado</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Telefone (WhatsApp) *</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-whatsapp text-success"></i></span>
                      <input type="text" class="form-control" id="cobTelefone" required placeholder="5511999999999">
                    </div>
                    <div class="form-text">DDI+DDD+número, ex: 5511987654321</div>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Valor Total (R$) *</label>
                    <input type="number" class="form-control" id="cobValor" required step="0.01" min="0" oninput="Cobranca.previewMsg()">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Parcelas *</label>
                    <select class="form-select" id="cobParcelas" onchange="Cobranca.previewMsg()">
                      ${Array.from({length:24},(_,i)=>`<option value="${i+1}">${i+1}x</option>`).join('')}
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Dia de Vencimento *</label>
                    <input type="number" class="form-control" id="cobDiaVenc" required min="1" max="31" placeholder="Ex: 10" oninput="Cobranca.previewMsg()">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Observação</label>
                    <input type="text" class="form-control" id="cobObs" placeholder="Detalhes adicionais...">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Prévia da mensagem WhatsApp</label>
                    <div id="msgPreview" class="p-3 rounded" style="background:#dcf8c6;font-size:13px;white-space:pre-wrap;border:1px solid #ccc;min-height:60px;color:#333;font-family:sans-serif">
                      Preencha os campos acima para ver a mensagem…
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="Cobranca.salvar()"><i class="bi bi-save me-1"></i>Salvar</button>
            </div>
          </div>
        </div>
      </div>`;

    await this.carregar();
  },

  previewMsg(dados = null) {
    const cliente  = dados?.cliente  || document.getElementById('cobCliente')?.value  || '[cliente]';
    const valor    = parseFloat(dados?.valorTotal || document.getElementById('cobValor')?.value) || 0;
    const parcelas = parseInt(dados?.parcelas     || document.getElementById('cobParcelas')?.value) || 1;
    const diaVenc  = dados?.diaVenc  || document.getElementById('cobDiaVenc')?.value  || '[dia]';
    const parc     = valor > 0 ? (valor / parcelas).toFixed(2).replace('.', ',') : '0,00';
    const total    = valor > 0 ? valor.toFixed(2).replace('.', ',') : '0,00';

    const msg = parcelas > 1
      ? `Olá ${cliente}! 👋\n\nPassando para lembrar que seu pagamento com a *Anagesso Drywall* no valor de *R$ ${total}* foi parcelado em *${parcelas}x de R$ ${parc}*, com vencimento todo dia *${diaVenc}* de cada mês.\n\nQualquer dúvida, estamos à disposição! 🏗️`
      : `Olá ${cliente}! 👋\n\nPassando para lembrar que seu pagamento com a *Anagesso Drywall* no valor de *R$ ${total}* vence todo dia *${diaVenc}*.\n\nQualquer dúvida, estamos à disposição! 🏗️`;

    const el = document.getElementById('msgPreview');
    if (el) el.textContent = msg;
    return msg;
  },

  gerarLinkWA(item) {
    const msg = this.previewMsg(item);
    const tel = (item.telefone || '').replace(/\D/g, '');
    return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
  },

  async carregar() {
    try {
      Utils.showLoading(true);
      this.dados = await Api.getCobranca();
      this.renderTabela(this.dados);
      this.renderKpis();
    } catch (e) {
      document.getElementById('tbodyCobranca').innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">Erro ao carregar: ${e.message}</td></tr>`;
    } finally {
      Utils.showLoading(false);
    }
  },

  filtrar() {
    const busca  = document.getElementById('buscaCobranca')?.value.toLowerCase() || '';
    const status = document.getElementById('filtroStatusCob')?.value || '';
    this.renderTabela(this.dados.filter(c =>
      (!busca  || (c.cliente || '').toLowerCase().includes(busca)) &&
      (!status || c.status === status)
    ));
  },

  renderTabela(dados) {
    const tbody = document.getElementById('tbodyCobranca');
    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Nenhuma cobrança encontrada.</td></tr>';
      return;
    }
    const badgeMap = { ATIVO: 'bg-primary', QUITADO: 'bg-success', ATRASADO: 'bg-danger' };
    tbody.innerHTML = dados.map(c => {
      const link = this.gerarLinkWA(c);
      const parc = parseFloat(c.valorTotal) > 0 ? (parseFloat(c.valorTotal) / parseInt(c.parcelas)).toFixed(2) : '0.00';
      return `<tr>
        <td class="fw-semibold">${c.cliente || '—'}</td>
        <td>${c.telefone || '—'}</td>
        <td>${Utils.formatCurrency(c.valorTotal)} <small class="text-muted">(${c.parcelas}x de ${Utils.formatCurrency(parc)})</small></td>
        <td>${c.parcelas || '—'}x</td>
        <td>Dia ${c.diaVenc || '—'}</td>
        <td><span class="badge ${badgeMap[c.status] || 'bg-secondary'}">${c.status || '—'}</span></td>
        <td class="small text-muted">${c.obs || '—'}</td>
        <td class="text-center" style="white-space:nowrap">
          <a class="btn btn-success btn-sm me-1" href="${link}" target="_blank" title="Enviar WhatsApp">
            <i class="bi bi-whatsapp"></i>
          </a>
          <button class="btn btn-outline-primary btn-sm me-1" onclick="Cobranca.editar('${c.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" onclick="Cobranca.excluir('${c.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  },

  renderKpis() {
    const ativos    = this.dados.filter(c => c.status === 'ATIVO');
    const atrasados = this.dados.filter(c => c.status === 'ATRASADO');
    const quitados  = this.dados.filter(c => c.status === 'QUITADO');
    const totalAtivo = ativos.reduce((s, c) => s + (parseFloat(c.valorTotal) || 0), 0);
    document.getElementById('cobKpis').innerHTML = `
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Ativos</div><div class="fw-bold text-primary">${ativos.length} — ${Utils.formatCurrency(totalAtivo)}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Atrasados</div><div class="fw-bold text-danger">${atrasados.length}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Quitados</div><div class="fw-bold text-success">${quitados.length}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Total Cadastros</div><div class="fw-bold">${this.dados.length}</div></div></div></div>`;
  },

  abrirModal(dados = null) {
    document.getElementById('cobrancaId').value  = dados?.id         || '';
    document.getElementById('cobCliente').value  = dados?.cliente    || '';
    document.getElementById('cobTelefone').value = dados?.telefone   || '';
    document.getElementById('cobValor').value    = dados?.valorTotal || '';
    document.getElementById('cobParcelas').value = dados?.parcelas   || '1';
    document.getElementById('cobDiaVenc').value  = dados?.diaVenc    || '';
    document.getElementById('cobObs').value      = dados?.obs        || '';
    document.getElementById('cobStatus').value   = dados?.status     || 'ATIVO';
    this.previewMsg(dados);
    new bootstrap.Modal(document.getElementById('modalCobranca')).show();
  },

  editar(id) {
    const c = this.dados.find(x => x.id === id);
    if (c) this.abrirModal(c);
  },

  async salvar() {
    const form = document.getElementById('formCobranca');
    if (!form.reportValidity()) return;
    const payload = {
      id:         document.getElementById('cobrancaId').value,
      cliente:    document.getElementById('cobCliente').value,
      telefone:   document.getElementById('cobTelefone').value.replace(/\D/g,''),
      valorTotal: document.getElementById('cobValor').value,
      parcelas:   document.getElementById('cobParcelas').value,
      diaVenc:    document.getElementById('cobDiaVenc').value,
      obs:        document.getElementById('cobObs').value,
      status:     document.getElementById('cobStatus').value,
    };
    try {
      Utils.showLoading(true);
      await Api.saveCobranca(payload);
      bootstrap.Modal.getInstance(document.getElementById('modalCobranca')).hide();
      Utils.showToast('Cobrança salva!');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  async excluir(id) {
    if (!Utils.confirm('Excluir esta cobrança?')) return;
    try {
      Utils.showLoading(true);
      await Api.deleteCobranca(id);
      Utils.showToast('Cobrança excluída.');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },
};
