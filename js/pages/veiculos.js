const Veiculos = {
  dados: [],
  FROTA_KEY: 'anagesso_frota',

  // Frota padrão (usada na primeira vez)
  _frotaPadrao: [
    { id: 'V001', nome: 'Hyundai HR HDB',    placa: 'NMQ9J47' },
    { id: 'V002', nome: 'FIAT Strada',        placa: 'RRI6E27' },
    { id: 'V003', nome: 'Volkswagen Saveiro', placa: 'ONU3A40' },
  ],

  getFrota() {
    try {
      const s = localStorage.getItem(this.FROTA_KEY);
      return s ? JSON.parse(s) : [...this._frotaPadrao];
    } catch (_) { return [...this._frotaPadrao]; }
  },

  saveFrota(frota) {
    localStorage.setItem(this.FROTA_KEY, JSON.stringify(frota));
  },

  async render() {
    document.getElementById('pageTitle').textContent = 'Controle de Veículos';
    this._renderPage();
    await this.carregar();
  },

  _renderPage() {
    const frota = this.getFrota();
    const veiculoOptions = frota.map(v =>
      `<option value="${v.id}" data-placa="${v.placa}" data-nome="${v.nome}">${v.nome} — ${v.placa}</option>`
    ).join('');
    const motoristaOptions = CONFIG.funcionarios.map(f =>
      `<option value="${f}">${f}</option>`
    ).join('');

    document.getElementById('content').innerHTML = `
      <div class="d-flex flex-wrap gap-2 mb-4">
        <input type="text" class="form-control form-control-sm" id="buscaVeiculo" placeholder="Buscar placa ou motorista..." style="max-width:280px" oninput="Veiculos.filtrar()">
        <select class="form-select form-select-sm" id="filtroTipoV" style="max-width:150px" onchange="Veiculos.filtrar()">
          <option value="">Entrada e Saída</option>
          <option value="ENTRADA">Entrada</option>
          <option value="SAÍDA">Saída</option>
        </select>
        <input type="date" class="form-control form-control-sm" id="filtroDataV" style="max-width:160px" onchange="Veiculos.filtrar()">
        <button class="btn btn-outline-secondary btn-sm" onclick="Veiculos.abrirGerenciarFrota()" title="Gerenciar frota">
          <i class="bi bi-truck me-1"></i>Gerenciar Frota
        </button>
        <button class="btn btn-success btn-sm ms-auto" onclick="Veiculos.abrirModal()">
          <i class="bi bi-plus-lg me-1"></i>Registrar
        </button>
      </div>

      <div class="row g-3 mb-4" id="veiculoKpis"></div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr>
                  <th>Tipo</th><th>Veículo</th><th>Placa</th>
                  <th>Motorista</th><th>Data</th><th>Horário</th>
                  <th>Obs</th><th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody id="tbodyVeiculos"><tr><td colspan="8" class="text-center py-4">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Registrar -->
      <div class="modal fade" id="modalVeiculo" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title"><i class="bi bi-truck me-2"></i>Registrar Veículo</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formVeiculo">
                <input type="hidden" id="veiculoId">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Tipo *</label>
                    <div class="d-flex gap-2">
                      <button type="button" class="btn btn-outline-success flex-fill" id="btnEntrada" onclick="Veiculos.setTipo('ENTRADA')">
                        <i class="bi bi-box-arrow-in-right me-1"></i>Entrada
                      </button>
                      <button type="button" class="btn btn-outline-danger flex-fill" id="btnSaida" onclick="Veiculos.setTipo('SAÍDA')">
                        <i class="bi bi-box-arrow-right me-1"></i>Saída
                      </button>
                    </div>
                    <input type="hidden" id="veiculoTipo" value="ENTRADA">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Veículo *</label>
                    <select class="form-select" id="veiculoSelect" required onchange="Veiculos.selecionarVeiculo(this)">
                      <option value="">Selecione o veículo...</option>
                      ${veiculoOptions}
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Placa</label>
                    <input type="text" class="form-control bg-light" id="veiculoPlaca" readonly placeholder="Preenchida automaticamente">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Modelo</label>
                    <input type="text" class="form-control bg-light" id="veiculoModelo" readonly placeholder="Preenchido automaticamente">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Motorista *</label>
                    <select class="form-select" id="veiculoMotorista" required>
                      <option value="">Selecione o motorista...</option>
                      ${motoristaOptions}
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Data *</label>
                    <input type="date" class="form-control" id="veiculoData" required>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Horário *</label>
                    <input type="time" class="form-control" id="veiculoHorario" required>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Observação</label>
                    <input type="text" class="form-control" id="veiculoObs" placeholder="Destino, motivo...">
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="Veiculos.salvar()"><i class="bi bi-save me-1"></i>Salvar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Gerenciar Frota -->
      <div class="modal fade" id="modalFrota" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title"><i class="bi bi-truck me-2"></i>Gerenciar Frota</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3 p-3 bg-light rounded">
                <p class="fw-semibold mb-2 small">Adicionar veículo</p>
                <div class="row g-2">
                  <div class="col-12">
                    <input type="text" class="form-control form-control-sm" id="novoVeiculoNome" placeholder="Nome/Modelo (ex: Ford Ranger)">
                  </div>
                  <div class="col-8">
                    <input type="text" class="form-control form-control-sm text-uppercase" id="novoVeiculoPlaca"
                      placeholder="Placa (ex: ABC1D23)" maxlength="8"
                      oninput="this.value=this.value.toUpperCase()">
                  </div>
                  <div class="col-4">
                    <button class="btn btn-success btn-sm w-100" onclick="Veiculos.adicionarVeiculo()">
                      <i class="bi bi-plus-lg"></i> Adicionar
                    </button>
                  </div>
                </div>
              </div>
              <div id="listaFrota"></div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            </div>
          </div>
        </div>
      </div>`;
  },

  abrirGerenciarFrota() {
    this.renderListaFrota();
    new bootstrap.Modal(document.getElementById('modalFrota')).show();
  },

  renderListaFrota() {
    const frota = this.getFrota();
    const el = document.getElementById('listaFrota');
    if (!frota.length) {
      el.innerHTML = '<p class="text-muted small text-center">Nenhum veículo cadastrado.</p>';
      return;
    }
    el.innerHTML = `
      <p class="fw-semibold small mb-2">Veículos cadastrados</p>
      <ul class="list-group">
        ${frota.map(v => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <span class="fw-semibold">${v.nome}</span>
              <span class="badge bg-secondary ms-2">${v.placa}</span>
            </div>
            <button class="btn btn-outline-danger btn-sm" onclick="Veiculos.removerVeiculo('${v.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </li>`).join('')}
      </ul>`;
  },

  adicionarVeiculo() {
    const nome  = document.getElementById('novoVeiculoNome').value.trim();
    const placa = document.getElementById('novoVeiculoPlaca').value.trim().toUpperCase();
    if (!nome || !placa) { Utils.showToast('Informe nome e placa.', 'warning'); return; }

    const frota = this.getFrota();
    if (frota.some(v => v.placa === placa)) { Utils.showToast('Placa já cadastrada.', 'warning'); return; }

    const id = 'V' + String(Date.now()).slice(-4);
    frota.push({ id, nome, placa });
    this.saveFrota(frota);

    document.getElementById('novoVeiculoNome').value  = '';
    document.getElementById('novoVeiculoPlaca').value = '';
    this.renderListaFrota();
    Utils.showToast('Veículo adicionado!');
  },

  removerVeiculo(id) {
    if (!Utils.confirm('Remover este veículo da frota?')) return;
    const frota = this.getFrota().filter(v => v.id !== id);
    this.saveFrota(frota);
    this.renderListaFrota();
    Utils.showToast('Veículo removido.');
  },

  selecionarVeiculo(select) {
    const opt = select.selectedOptions[0];
    document.getElementById('veiculoPlaca').value  = opt?.dataset.placa || '';
    document.getElementById('veiculoModelo').value = opt?.dataset.nome  || '';
  },

  setTipo(t) {
    document.getElementById('veiculoTipo').value = t;
    document.getElementById('btnEntrada').className = 'btn flex-fill ' + (t === 'ENTRADA' ? 'btn-success' : 'btn-outline-success');
    document.getElementById('btnSaida').className   = 'btn flex-fill ' + (t === 'SAÍDA'  ? 'btn-danger'  : 'btn-outline-danger');
  },

  async carregar() {
    try {
      Utils.showLoading(true);
      this.dados = await Api.getVeiculos();
      this.dados.sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario));
      this.renderTabela(this.dados);
      this.renderKpis();
    } catch (e) {
      document.getElementById('tbodyVeiculos').innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">Erro ao carregar: ${e.message}</td></tr>`;
    } finally {
      Utils.showLoading(false);
    }
  },

  filtrar() {
    const busca = document.getElementById('buscaVeiculo')?.value.toLowerCase() || '';
    const tipo  = document.getElementById('filtroTipoV')?.value || '';
    const data  = document.getElementById('filtroDataV')?.value || '';
    this.renderTabela(this.dados.filter(v =>
      (!busca || (v.placa + v.motorista + v.modelo).toLowerCase().includes(busca)) &&
      (!tipo  || v.tipo === tipo) &&
      (!data  || v.data === data)
    ));
  },

  renderTabela(dados) {
    const tbody = document.getElementById('tbodyVeiculos');
    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Nenhum registro encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = dados.map(v => `
      <tr>
        <td><span class="badge ${v.tipo === 'ENTRADA' ? 'bg-success' : 'bg-danger'}">${v.tipo === 'ENTRADA' ? '↓ Entrada' : '↑ Saída'}</span></td>
        <td>${v.modelo || '—'}</td>
        <td class="fw-bold">${v.placa || '—'}</td>
        <td>${v.motorista || '—'}</td>
        <td>${Utils.formatDate(v.data)}</td>
        <td>${v.horario || '—'}</td>
        <td class="small text-muted">${v.obs || '—'}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1" onclick="Veiculos.editar('${v.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" onclick="Veiculos.excluir('${v.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  },

  renderKpis() {
    const hoje = new Date().toISOString().split('T')[0];
    const entradas = this.dados.filter(v => v.tipo === 'ENTRADA');
    const saidas   = this.dados.filter(v => v.tipo === 'SAÍDA');
    const hoje_reg = this.dados.filter(v => v.data === hoje);
    document.getElementById('veiculoKpis').innerHTML = `
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Total Entradas</div><div class="fw-bold text-success">${entradas.length}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Total Saídas</div><div class="fw-bold text-danger">${saidas.length}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Registros Hoje</div><div class="fw-bold text-primary">${hoje_reg.length}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Total Registros</div><div class="fw-bold">${this.dados.length}</div></div></div></div>`;
  },

  abrirModal(dados = null) {
    const agora = new Date();
    document.getElementById('veiculoId').value        = dados?.id        || '';
    document.getElementById('veiculoData').value      = dados?.data      || agora.toISOString().split('T')[0];
    document.getElementById('veiculoHorario').value   = dados?.horario   || agora.toTimeString().slice(0, 5);
    document.getElementById('veiculoObs').value       = dados?.obs       || '';
    document.getElementById('veiculoPlaca').value     = dados?.placa     || '';
    document.getElementById('veiculoModelo').value    = dados?.modelo    || '';
    document.getElementById('veiculoMotorista').value = dados?.motorista || '';

    const sel = document.getElementById('veiculoSelect');
    if (dados?.placa) {
      const opt = [...sel.options].find(o => o.dataset.placa === dados.placa);
      sel.value = opt ? opt.value : '';
    } else {
      sel.value = '';
    }

    this.setTipo(dados?.tipo || 'ENTRADA');
    new bootstrap.Modal(document.getElementById('modalVeiculo')).show();
  },

  editar(id) {
    const v = this.dados.find(x => x.id === id);
    if (v) this.abrirModal(v);
  },

  async salvar() {
    const form = document.getElementById('formVeiculo');
    if (!form.reportValidity()) return;
    if (!document.getElementById('veiculoSelect').value) {
      Utils.showToast('Selecione o veículo.', 'warning'); return;
    }
    const payload = {
      id:        document.getElementById('veiculoId').value,
      placa:     document.getElementById('veiculoPlaca').value,
      modelo:    document.getElementById('veiculoModelo').value,
      motorista: document.getElementById('veiculoMotorista').value,
      data:      document.getElementById('veiculoData').value,
      horario:   document.getElementById('veiculoHorario').value,
      tipo:      document.getElementById('veiculoTipo').value,
      obs:       document.getElementById('veiculoObs').value,
    };
    try {
      Utils.showLoading(true);
      await Api.saveVeiculo(payload);
      bootstrap.Modal.getInstance(document.getElementById('modalVeiculo')).hide();
      Utils.showToast('Registro salvo!');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  async excluir(id) {
    if (!Utils.confirm('Excluir este registro?')) return;
    try {
      Utils.showLoading(true);
      await Api.deleteVeiculo(id);
      Utils.showToast('Registro excluído.');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },
};
