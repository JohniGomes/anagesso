const Dashboard = {
  async render() {
    document.getElementById('pageTitle').textContent = 'Dashboard';
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="row g-4 mb-4" id="kpiCards">
        ${[1,2,3,4].map(() => `<div class="col-sm-6 col-xl-3"><div class="card kpi-card h-100"><div class="card-body placeholder-glow"><span class="placeholder col-6 mb-2 d-block"></span><span class="placeholder col-4"></span></div></div></div>`).join('')}
      </div>
      <div class="row g-4">
        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header fw-semibold">Obras por Fase</div>
            <div class="card-body" id="obrasChart"><canvas id="chartObras"></canvas></div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header fw-semibold">Últimas Obras</div>
            <div class="card-body p-0" id="tabelaObrasRecentes"></div>
          </div>
        </div>
      </div>`;
    await this.loadData();
  },

  async loadData() {
    try {
      Utils.showLoading(true);
      const data = await Api.getDashboard();
      this.renderKPIs(data);
      this.renderObrasTable(data.obras || []);
      this.renderChart(data.obrasPorFase || {});
    } catch (e) {
      this.renderMockDashboard();
    } finally {
      Utils.showLoading(false);
    }
  },

  renderMockDashboard() {
    const mock = {
      totalObras: 10, obrasAndamento: 3, totalPago: 98493, totalReceber: 19690,
      lucroTotal: 56329.8, totalMOmes: 12500,
      obras: [],
      obrasPorFase: { 'Em Andamento': 3, 'Executado': 7 }
    };
    this.renderKPIs(mock);
    this.renderObrasTable([]);
    this.renderChart(mock.obrasPorFase);
  },

  renderKPIs(data) {
    const kpis = [
      { label: 'Obras Ativas', value: data.obrasAndamento ?? 0, icon: 'bi-building', color: 'primary', suffix: '' },
      { label: 'Total Recebido', value: Utils.formatCurrency(data.totalPago), icon: 'bi-cash-stack', color: 'success', suffix: '' },
      { label: 'A Receber', value: Utils.formatCurrency(data.totalReceber), icon: 'bi-hourglass-split', color: 'warning', suffix: '' },
      { label: 'Lucro Total', value: Utils.formatCurrency(data.lucroTotal), icon: 'bi-graph-up-arrow', color: 'info', suffix: '' },
    ];
    document.getElementById('kpiCards').innerHTML = kpis.map(k => `
      <div class="col-sm-6 col-xl-3">
        <div class="card kpi-card h-100 border-0 shadow-sm">
          <div class="card-body d-flex align-items-center gap-3">
            <div class="kpi-icon bg-${k.color} bg-opacity-10 text-${k.color} rounded-3 p-3">
              <i class="bi ${k.icon} fs-4"></i>
            </div>
            <div>
              <div class="text-muted small">${k.label}</div>
              <div class="fw-bold fs-5">${k.value}${k.suffix}</div>
            </div>
          </div>
        </div>
      </div>`).join('');
  },

  renderObrasTable(obras) {
    if (!obras.length) {
      document.getElementById('tabelaObrasRecentes').innerHTML = '<p class="text-muted p-3">Nenhuma obra registrada.</p>';
      return;
    }
    document.getElementById('tabelaObrasRecentes').innerHTML = `
      <table class="table table-hover mb-0">
        <thead><tr><th>Obra</th><th>Fase</th><th>Lucro</th></tr></thead>
        <tbody>${obras.slice(0, 8).map(o => `
          <tr>
            <td>${o.nome}</td>
            <td><span class="badge ${o.fase === 'EXECUTADO' ? 'bg-success' : 'bg-warning text-dark'}">${o.fase || '—'}</span></td>
            <td>${Utils.formatCurrency(o.lucro)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  },

  renderChart(fases) {
    const ctx = document.getElementById('chartObras');
    if (!ctx) return;
    const labels = Object.keys(fases);
    const values = Object.values(fases);
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 2 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
};
