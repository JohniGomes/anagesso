const Dashboard = {
  dadosMO: [],       // todos os lançamentos de MO
  dadosObras: [],
  dadosOrc: {},

  async render() {
    document.getElementById('pageTitle').textContent = 'Dashboard';
    const mesAtual = new Date().toISOString().slice(0, 7);

    document.getElementById('content').innerHTML = `
      <!-- KPIs Obras -->
      <div class="row g-3 mb-4" id="kpiCards">
        ${[1,2,3,4].map(() => `
          <div class="col-6 col-xl-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body placeholder-glow">
                <span class="placeholder col-8 mb-2 d-block rounded"></span>
                <span class="placeholder col-5 rounded"></span>
              </div>
            </div>
          </div>`).join('')}
      </div>

      <!-- MO com filtros -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header d-flex flex-wrap align-items-center gap-2">
          <span class="fw-semibold me-2"><i class="bi bi-people-fill text-primary me-1"></i>Mão de Obra</span>
          <select class="form-select form-select-sm" id="dashFiltroFunc" style="max-width:150px" onchange="Dashboard.filtrarMO()">
            <option value="">Todos</option>
            ${CONFIG.funcionarios.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
          <input type="month" class="form-control form-control-sm" id="dashFiltroMes" value="${mesAtual}" style="max-width:160px" onchange="Dashboard.filtrarMO()">
          <select class="form-select form-select-sm" id="dashFiltroSemana" style="max-width:175px" onchange="Dashboard.filtrarMO()">
            <option value="">Todas as semanas</option>
          </select>
          <span class="ms-auto badge bg-secondary" id="dashMOCount">0 lançamentos</span>
        </div>
        <div class="card-body p-0" id="moResumo">
          <div class="d-flex justify-content-center py-4">
            <div class="spinner-border spinner-border-sm text-secondary"></div>
          </div>
        </div>
      </div>

      <!-- Orçamentos + Gráfico + Tabela Obras -->
      <div class="row g-3">
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header fw-semibold">
              <i class="bi bi-file-earmark-text-fill text-warning me-1"></i>Orçamentos
            </div>
            <div class="card-body" id="orcResumo">
              <div class="d-flex justify-content-center py-3">
                <div class="spinner-border spinner-border-sm text-secondary"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header fw-semibold">
              <i class="bi bi-pie-chart-fill text-info me-1"></i>Obras por Fase
            </div>
            <div class="card-body d-flex align-items-center justify-content-center" style="min-height:220px">
              <canvas id="chartObras"></canvas>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header fw-semibold">
              <i class="bi bi-building-fill text-success me-1"></i>Últimas Obras
            </div>
            <div class="card-body p-0" id="tabelaObrasRecentes"></div>
          </div>
        </div>
      </div>`;

    await this.loadData();
  },

  async loadData() {
    try {
      Utils.showLoading(true);
      const [dash, moTodos] = await Promise.all([Api.getDashboard(), Api.getMaoDeObra({})]);
      this.dadosMO   = moTodos;
      this.dadosObras = dash.obras || [];
      this.dadosOrc   = dash.orc  || {};

      this.renderKPIs(dash);
      this.renderOrc(dash.orc || {});
      this.renderObrasTable(dash.obras || []);
      this.renderChart(dash.obrasPorFase || {});
      this.atualizarSemanasSelect();
      this.filtrarMO();
    } catch (e) {
      Utils.showToast('Erro ao carregar dashboard: ' + e.message, 'error');
      document.getElementById('moResumo').innerHTML = `<p class="text-danger p-3 mb-0 small"><i class="bi bi-exclamation-triangle me-1"></i>Erro ao carregar. Verifique o backend.</p>`;
    } finally {
      Utils.showLoading(false);
    }
  },

  // Preenche o select de semanas com base no mês selecionado
  atualizarSemanasSelect() {
    const mes = document.getElementById('dashFiltroMes')?.value;
    const sel = document.getElementById('dashFiltroSemana');
    if (!sel || !mes) return;

    const semanas = this.calcularSemanas(mes);
    sel.innerHTML = '<option value="">Todas as semanas</option>' +
      semanas.map((s, i) => `<option value="${i}">${s.label}</option>`).join('');
  },

  // Retorna array de semanas do mês
  calcularSemanas(mes) {
    const [y, m] = mes.split('-').map(Number);
    const primeiro = new Date(y, m - 1, 1);
    const ultimo   = new Date(y, m, 0);
    const semanas  = [];
    let cur = new Date(primeiro);

    while (cur <= ultimo) {
      const ini = new Date(cur);
      // vai até sábado ou fim do mês
      const fim = new Date(cur);
      fim.setDate(fim.getDate() + (6 - fim.getDay()));
      if (fim > ultimo) fim.setTime(ultimo.getTime());

      semanas.push({
        ini: ini.toISOString().slice(0, 10),
        fim: fim.toISOString().slice(0, 10),
        label: `${ini.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'})} – ${fim.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'})}`,
      });

      cur.setDate(fim.getDate() + 1);
    }
    return semanas;
  },

  filtrarMO() {
    this.atualizarSemanasSelect();

    const func    = document.getElementById('dashFiltroFunc')?.value  || '';
    const mes     = document.getElementById('dashFiltroMes')?.value   || '';
    const semIdx  = document.getElementById('dashFiltroSemana')?.value;

    let dados = this.dadosMO;

    if (func) dados = dados.filter(r => r.funcionario === func);
    if (mes)  dados = dados.filter(r => String(r.data).slice(0, 7) === mes);

    let semanaAtiva = null;
    if (semIdx !== '' && semIdx !== undefined) {
      const semanas = this.calcularSemanas(mes);
      semanaAtiva = semanas[parseInt(semIdx)];
      if (semanaAtiva) {
        dados = dados.filter(r => r.data >= semanaAtiva.ini && r.data <= semanaAtiva.fim);
      }
    }

    document.getElementById('dashMOCount').textContent = dados.length + ' lançamentos';
    this.renderMO(dados, func, semanaAtiva);
  },

  renderMO(dados, funcFiltro, semana) {
    const totalValor = dados.reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);
    const totalVale  = dados.reduce((s, r) => s + (parseFloat(r.vale)  || 0), 0);
    const saldo      = totalValor - totalVale;

    // Agrupa por funcionário (ou mostra só o filtrado)
    const funcs = funcFiltro ? [funcFiltro] : [...new Set(dados.map(r => r.funcionario))].sort();

    const tituloSemana = semana ? `<span class="badge bg-info text-dark ms-2">${semana.label}</span>` : '';

    // Monta tabela detalhada se filtrou funcionário
    let detalhe = '';
    if (funcFiltro && dados.length) {
      const linhas = [...dados]
        .sort((a, b) => a.data.localeCompare(b.data))
        .map(r => {
          const total = (parseFloat(r.valor) || 0) - (parseFloat(r.vale) || 0);
          return `<tr>
            <td class="small">${Utils.formatDate(r.data)}</td>
            <td class="small">${r.dia || ''}</td>
            <td class="small">${r.servico || '—'}</td>
            <td class="text-end small">${Utils.formatCurrency(r.valor)}</td>
            <td class="text-end small text-warning">${Utils.formatCurrency(r.vale)}</td>
            <td class="text-end small fw-semibold ${total >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(total)}</td>
          </tr>`;
        }).join('');

      detalhe = `
        <div class="table-responsive">
          <table class="table table-sm table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Data</th><th>Dia</th><th>Serviço</th>
                <th class="text-end">Valor</th><th class="text-end">Vale</th><th class="text-end">Saldo Dia</th>
              </tr>
            </thead>
            <tbody>${linhas || '<tr><td colspan="6" class="text-muted text-center py-3">Nenhum lançamento no período.</td></tr>'}</tbody>
            <tfoot class="table-secondary fw-bold">
              <tr>
                <td colspan="3">Total</td>
                <td class="text-end">${Utils.formatCurrency(totalValor)}</td>
                <td class="text-end text-warning">${Utils.formatCurrency(totalVale)}</td>
                <td class="text-end ${saldo >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(saldo)}</td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    } else {
      // Resumo por funcionário
      const rows = funcs.map(f => {
        const fd = dados.filter(r => r.funcionario === f);
        const v  = fd.reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);
        const vl = fd.reduce((s, r) => s + (parseFloat(r.vale)  || 0), 0);
        const sl = v - vl;
        return `<tr>
          <td><span class="badge bg-primary">${f}</span></td>
          <td class="text-end">${Utils.formatCurrency(v)}</td>
          <td class="text-end text-warning">${Utils.formatCurrency(vl)}</td>
          <td class="text-end fw-semibold ${sl >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(sl)}</td>
        </tr>`;
      }).join('');

      detalhe = funcs.length ? `
        <div class="table-responsive">
          <table class="table table-sm table-hover align-middle mb-0">
            <thead class="table-light">
              <tr><th>Funcionário</th><th class="text-end">Produzido</th><th class="text-end">Vales</th><th class="text-end">Saldo</th></tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot class="table-secondary fw-bold">
              <tr>
                <td>Total</td>
                <td class="text-end">${Utils.formatCurrency(totalValor)}</td>
                <td class="text-end text-warning">${Utils.formatCurrency(totalVale)}</td>
                <td class="text-end ${saldo >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(saldo)}</td>
              </tr>
            </tfoot>
          </table>
        </div>` : '<p class="text-muted p-3 mb-0 small">Nenhum lançamento no período.</p>';
    }

    document.getElementById('moResumo').innerHTML = `
      <div class="row g-0 border-bottom text-center">
        <div class="col-4 p-3 border-end">
          <div class="text-muted small">Produzido ${tituloSemana}</div>
          <div class="fw-bold text-primary fs-6">${Utils.formatCurrency(totalValor)}</div>
        </div>
        <div class="col-4 p-3 border-end">
          <div class="text-muted small">Vales</div>
          <div class="fw-bold text-warning fs-6">${Utils.formatCurrency(totalVale)}</div>
        </div>
        <div class="col-4 p-3">
          <div class="text-muted small">Saldo a Pagar</div>
          <div class="fw-bold fs-6 ${saldo >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(saldo)}</div>
        </div>
      </div>
      ${detalhe}`;
  },

  renderKPIs(data) {
    const kpis = [
      { label: 'Obras Ativas',   value: data.obrasAndamento ?? 0,               icon: 'bi-building',       color: 'primary' },
      { label: 'Total Recebido', value: Utils.formatCurrency(data.totalPago),   icon: 'bi-cash-stack',     color: 'success' },
      { label: 'A Receber',      value: Utils.formatCurrency(data.totalReceber),icon: 'bi-hourglass-split',color: 'warning' },
      { label: 'Lucro Total',    value: Utils.formatCurrency(data.lucroTotal),  icon: 'bi-graph-up-arrow', color: 'info'    },
    ];
    document.getElementById('kpiCards').innerHTML = kpis.map(k => `
      <div class="col-6 col-xl-3">
        <div class="card kpi-card border-0 shadow-sm h-100">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="kpi-icon bg-${k.color} bg-opacity-10 text-${k.color} rounded-3 p-3">
              <i class="bi ${k.icon} fs-4"></i>
            </div>
            <div>
              <div class="text-muted small">${k.label}</div>
              <div class="fw-bold fs-5">${k.value}</div>
            </div>
          </div>
        </div>
      </div>`).join('');
  },

  renderOrc(orc) {
    const pct = orc.total > 0 ? Math.round((orc.aprovados / orc.total) * 100) : 0;
    document.getElementById('orcResumo').innerHTML = `
      <div class="row g-3 mb-3">
        <div class="col-4 text-center">
          <div class="fs-3 fw-bold text-primary">${orc.total || 0}</div>
          <div class="text-muted small">Total</div>
        </div>
        <div class="col-4 text-center">
          <div class="fs-3 fw-bold text-success">${orc.aprovados || 0}</div>
          <div class="text-muted small">Aprovados</div>
        </div>
        <div class="col-4 text-center">
          <div class="fs-3 fw-bold text-warning">${orc.aguardando || 0}</div>
          <div class="text-muted small">Aguardando</div>
        </div>
      </div>
      <div class="mb-2">
        <div class="d-flex justify-content-between small text-muted mb-1">
          <span>Taxa de aprovação</span><span>${pct}%</span>
        </div>
        <div class="progress" style="height:8px">
          <div class="progress-bar bg-success" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
        <span class="text-muted small">Valor total orçado</span>
        <span class="fw-bold text-primary">${Utils.formatCurrency(orc.valorTotal)}</span>
      </div>`;
  },

  renderObrasTable(obras) {
    if (!obras.length) {
      document.getElementById('tabelaObrasRecentes').innerHTML = '<p class="text-muted p-3 small">Nenhuma obra registrada.</p>';
      return;
    }
    document.getElementById('tabelaObrasRecentes').innerHTML = `
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr><th>Obra</th><th>Fase</th><th class="text-end">Lucro</th></tr>
        </thead>
        <tbody>${obras.slice(0, 8).map(o => `
          <tr>
            <td class="fw-semibold small">${o.nome}</td>
            <td><span class="badge ${o.fase === 'EXECUTADO' ? 'bg-success' : o.fase === 'ANDAMENTO' ? 'bg-warning text-dark' : 'bg-info'}">${o.fase || '—'}</span></td>
            <td class="text-end fw-bold small ${parseFloat(o.lucro) >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(o.lucro)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  },

  renderChart(fases) {
    const ctx = document.getElementById('chartObras');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    const labels = Object.keys(fases);
    const values = Object.values(fases);
    if (!values.length) return;

    const total  = values.reduce((a, b) => a + b, 0);
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
          datalabels: {
            color: '#fff',
            font: { weight: 'bold', size: 13 },
            formatter: (value) => {
              const pct = Math.round((value / total) * 100);
              return `${value}\n(${pct}%)`;
            },
            textAlign: 'center',
          }
        }
      },
      plugins: [ChartDataLabels],
    });
  },
};
