const Obras = {
  dados: [],

  async render() {
    document.getElementById('pageTitle').textContent = 'Fechamento de Obras';
    document.getElementById('content').innerHTML = `
      <div class="d-flex flex-wrap gap-2 mb-4">
        <input type="text" class="form-control form-control-sm" id="buscaObra" placeholder="Buscar obra..." style="max-width:260px" oninput="Obras.filtrar()">
        <select class="form-select form-select-sm" id="filtroFase" style="max-width:160px" onchange="Obras.filtrar()">
          <option value="">Todas as fases</option>
          <option>ANDAMENTO</option><option>EXECUTADO</option><option>ORÇAMENTO</option>
        </select>
        <button class="btn btn-success btn-sm ms-auto" onclick="Obras.abrirModal()"><i class="bi bi-plus-lg me-1"></i>Nova Obra</button>
      </div>

      <div class="row g-3 mb-4" id="obrasKpis"></div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr>
                  <th>Obra</th><th>Início</th><th>Fase</th>
                  <th class="text-end">Orçamento</th><th class="text-end">Fechado</th>
                  <th class="text-end">Pago</th><th class="text-end">A Receber</th>
                  <th class="text-end">Lucro</th><th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody id="tbodyObras"><tr><td colspan="9" class="text-center py-4">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Obra -->
      <div class="modal fade" id="modalObra" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white"><h5 class="modal-title">Obra</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
              <form id="formObra">
                <input type="hidden" id="obraId">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Nome da Obra *</label>
                    <input type="text" class="form-control" id="obraNome" required placeholder="Ex: OBRA IGREJA PE MAX">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Data de Início</label>
                    <input type="date" class="form-control" id="obraInicio">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Previsão de Entrega</label>
                    <input type="date" class="form-control" id="obraEntrega">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Fase *</label>
                    <select class="form-select" id="obraFase" required>
                      <option value="ORÇAMENTO">ORÇAMENTO</option>
                      <option value="ANDAMENTO">ANDAMENTO</option>
                      <option value="EXECUTADO">EXECUTADO</option>
                    </select>
                  </div>
                  <div class="col-12"><hr class="my-1"><p class="text-muted small mb-2">Financeiro</p></div>
                  <div class="col-md-4">
                    <label class="form-label">Valor Orçamento</label>
                    <input type="number" class="form-control" id="obraOrcamento" step="0.01" min="0" value="0" oninput="Obras.calcLucro()">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Valor Fechado</label>
                    <input type="number" class="form-control" id="obraFechado" step="0.01" min="0" value="0" oninput="Obras.calcLucro()">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Valores Pago</label>
                    <input type="number" class="form-control" id="obraPago" step="0.01" min="0" value="0" oninput="Obras.calcLucro()">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">A Receber</label>
                    <input type="text" class="form-control" id="obraReceber" readonly>
                  </div>
                  <div class="col-12"><hr class="my-1"><p class="text-muted small mb-2">Custos</p></div>
                  <div class="col-md-4">
                    <label class="form-label">Variáveis</label>
                    <input type="number" class="form-control" id="obraVariaveis" step="0.01" min="0" value="0" oninput="Obras.calcLucro()">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Material</label>
                    <input type="number" class="form-control" id="obraMaterial" step="0.01" min="0" value="0" oninput="Obras.calcLucro()">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Mão de Obra</label>
                    <input type="number" class="form-control" id="obraMO" step="0.01" min="0" value="0" oninput="Obras.calcLucro()">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Custo Total da Obra</label>
                    <input type="text" class="form-control fw-bold" id="obraCusto" readonly>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Lucro Anagesso</label>
                    <input type="text" class="form-control fw-bold text-success" id="obraLucro" readonly>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="Obras.salvar()"><i class="bi bi-save me-1"></i>Salvar</button>
            </div>
          </div>
        </div>
      </div>`;

    await this.carregar();
  },

  calcLucro() {
    const fechado = parseFloat(document.getElementById('obraFechado')?.value) || 0;
    const pago = parseFloat(document.getElementById('obraPago')?.value) || 0;
    const variaveis = parseFloat(document.getElementById('obraVariaveis')?.value) || 0;
    const material = parseFloat(document.getElementById('obraMaterial')?.value) || 0;
    const mo = parseFloat(document.getElementById('obraMO')?.value) || 0;
    const custo = variaveis + material + mo;
    const lucro = fechado - custo;
    const receber = fechado - pago;
    document.getElementById('obraCusto').value = Utils.formatCurrency(custo);
    document.getElementById('obraLucro').value = Utils.formatCurrency(lucro);
    document.getElementById('obraReceber').value = Utils.formatCurrency(receber);
  },

  async carregar() {
    try {
      Utils.showLoading(true);
      this.dados = await Api.getObras();
      this.renderTabela(this.dados);
      this.renderKpis();
    } catch (e) {
      document.getElementById('tbodyObras').innerHTML = `<tr><td colspan="9" class="text-center text-danger py-3">Erro ao carregar obras. Configure o backend.</td></tr>`;
    } finally {
      Utils.showLoading(false);
    }
  },

  filtrar() {
    const busca = document.getElementById('buscaObra')?.value.toLowerCase() || '';
    const fase = document.getElementById('filtroFase')?.value || '';
    const filtrado = this.dados.filter(o =>
      (!busca || (o.nome || '').toLowerCase().includes(busca)) &&
      (!fase || o.fase === fase)
    );
    this.renderTabela(filtrado);
  },

  renderTabela(dados) {
    const tbody = document.getElementById('tbodyObras');
    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">Nenhuma obra encontrada.</td></tr>';
      return;
    }
    tbody.innerHTML = dados.map(o => `
      <tr>
        <td class="fw-semibold">${o.nome}</td>
        <td>${Utils.formatDate(o.dtInicio)}</td>
        <td><span class="badge ${o.fase === 'EXECUTADO' ? 'bg-success' : o.fase === 'ANDAMENTO' ? 'bg-warning text-dark' : 'bg-info'}">${o.fase || '—'}</span></td>
        <td class="text-end">${Utils.formatCurrency(o.valorOrcamento)}</td>
        <td class="text-end">${Utils.formatCurrency(o.valorFechado)}</td>
        <td class="text-end text-success">${Utils.formatCurrency(o.valorPago)}</td>
        <td class="text-end text-warning">${Utils.formatCurrency(o.valorReceber)}</td>
        <td class="text-end fw-bold ${parseFloat(o.lucro) >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(o.lucro)}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1" onclick="Obras.editar('${o.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" onclick="Obras.excluir('${o.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  },

  renderKpis() {
    const totalOrcamento = this.dados.reduce((s, o) => s + (parseFloat(o.valorOrcamento) || 0), 0);
    const totalPago = this.dados.reduce((s, o) => s + (parseFloat(o.valorPago) || 0), 0);
    const totalReceber = this.dados.reduce((s, o) => s + (parseFloat(o.valorReceber) || 0), 0);
    const totalLucro = this.dados.reduce((s, o) => s + (parseFloat(o.lucro) || 0), 0);
    document.getElementById('obrasKpis').innerHTML = `
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Total Orçado</div><div class="fw-bold">${Utils.formatCurrency(totalOrcamento)}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Recebido</div><div class="fw-bold text-success">${Utils.formatCurrency(totalPago)}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">A Receber</div><div class="fw-bold text-warning">${Utils.formatCurrency(totalReceber)}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Lucro Total</div><div class="fw-bold text-primary">${Utils.formatCurrency(totalLucro)}</div></div></div></div>`;
  },

  abrirModal(dados = null) {
    const fields = ['obraId', 'obraNome', 'obraInicio', 'obraEntrega', 'obraFase', 'obraOrcamento', 'obraFechado', 'obraPago', 'obraVariaveis', 'obraMaterial', 'obraMO'];
    const vals = ['', '', '', '', 'ANDAMENTO', 0, 0, 0, 0, 0, 0];
    fields.forEach((f, i) => {
      const el = document.getElementById(f);
      if (el) el.value = dados ? (dados[f.replace('obra', '').toLowerCase()] ?? vals[i]) : vals[i];
    });
    if (dados) {
      document.getElementById('obraId').value = dados.id || '';
      document.getElementById('obraNome').value = dados.nome || '';
      document.getElementById('obraInicio').value = dados.dtInicio || '';
      document.getElementById('obraEntrega').value = dados.dtEntrega || '';
      document.getElementById('obraFase').value = dados.fase || 'ANDAMENTO';
      document.getElementById('obraOrcamento').value = dados.valorOrcamento || 0;
      document.getElementById('obraFechado').value = dados.valorFechado || 0;
      document.getElementById('obraPago').value = dados.valorPago || 0;
      document.getElementById('obraVariaveis').value = dados.variaveis || 0;
      document.getElementById('obraMaterial').value = dados.material || 0;
      document.getElementById('obraMO').value = dados.maoDeObra || 0;
    }
    this.calcLucro();
    new bootstrap.Modal(document.getElementById('modalObra')).show();
  },

  editar(id) {
    const o = this.dados.find(x => x.id === id);
    if (o) this.abrirModal(o);
  },

  async salvar() {
    const form = document.getElementById('formObra');
    if (!form.reportValidity()) return;
    const fechado = parseFloat(document.getElementById('obraFechado').value) || 0;
    const pago = parseFloat(document.getElementById('obraPago').value) || 0;
    const variaveis = parseFloat(document.getElementById('obraVariaveis').value) || 0;
    const material = parseFloat(document.getElementById('obraMaterial').value) || 0;
    const mo = parseFloat(document.getElementById('obraMO').value) || 0;
    const payload = {
      id: document.getElementById('obraId').value,
      nome: document.getElementById('obraNome').value,
      dtInicio: document.getElementById('obraInicio').value,
      dtEntrega: document.getElementById('obraEntrega').value,
      fase: document.getElementById('obraFase').value,
      valorOrcamento: document.getElementById('obraOrcamento').value,
      valorFechado: fechado,
      valorPago: pago,
      valorReceber: fechado - pago,
      variaveis, material, maoDeObra: mo,
      custoObra: variaveis + material + mo,
      lucro: fechado - (variaveis + material + mo),
    };
    try {
      Utils.showLoading(true);
      await Api.saveObra(payload);
      bootstrap.Modal.getInstance(document.getElementById('modalObra')).hide();
      Utils.showToast('Obra salva com sucesso!');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  async excluir(id) {
    if (!Utils.confirm('Deseja excluir esta obra?')) return;
    try {
      Utils.showLoading(true);
      await Api.deleteObra(id);
      Utils.showToast('Obra excluída.');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro ao excluir: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },
};
