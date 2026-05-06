const Dashboard = {
  async render() {
    document.getElementById('pageTitle').textContent = 'Dashboard';
    document.getElementById('content').innerHTML = `
      <!-- KPIs Obras -->
      <div class="row g-3 mb-4" id="kpiCards">
        ${[1,2,3,4].map(() => `<div class="col-6 col-xl-3"><div class="card border-0 shadow-sm h-100"><div class="card-body placeholder-glow"><span class="placeholder col-8 mb-2 d-block rounded"></span><span class="placeholder col-5 rounded"></span></div></div></div>`).join('')}
      </div>

      <!-- MO + Orçamentos -->
      <div class="row g-3 mb-4">
        <!-- Mão de Obra Mensal -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header fw-semibold d-flex align-items-center gap-2">
              <i class="bi bi-people-fill text-primary"></i>
              <span>Mão de Obra — <span id="moMesLabel" class="text-muted fw-normal small"></span></span>
            </div>
            <div class="card-body p-0" id="moResumo">
              <div class="d-flex justify-content-center py-4"><div class="spinner-border spinner-border-sm text-secondary"></div></div>
            </div>
          </div>
        </div>

        <!-- Orçamentos -->
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header fw-semibold d-flex align-items-center gap-2">
              <i class="bi bi-file-earmark-text-fill text-warning"></i>
              <span>Orçamentos</span>
            </div>
            <div class="card-body" id="orcResumo">
              <div class="d-flex justify-content-center py-4"><div class="spinner-border spinner-border-sm text-secondary"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráfico + Tabela obras -->
      <div class="row g-3">
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header fw-semibold"><i class="bi bi-pie-chart-fill me-2 text-info"></i>Obras por Fase</div>
            <div class="card-body d-flex align-items-center justify-content-center" style="min-height:220px">
              <canvas id="chartObras" style="max-height:200px"></canvas>
            </div>
          </div>
        </div>
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header fw-semibold"><i class="bi bi-building-fill me-2 text-success"></i>Últimas Obras</div>
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
      this.renderMO(data.mo || {});
      this.renderOrc(data.orc || {});
      this.renderObrasTable(data.obras || []);
      this.renderChart(data.obrasPorFase || {});
    } catch (e) {
      Utils.showToast('Erro ao carregar dashboard: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  renderKPIs(data) {
    const kpis = [
      { label: 'Obras Ativas',   value: data.obrasAndamento ?? 0,              icon: 'bi-building',       color: 'primary', isMoney: false },
      { label: 'Total Recebido', value: Utils.formatCurrency(data.totalPago),  icon: 'bi-cash-stack',     color: 'success', isMoney: true  },
      { label: 'A Receber',      value: Utils.formatCurrency(data.totalReceber),icon: 'bi-hourglass-split',color: 'warning', isMoney: true  },
      { label: 'Lucro Total',    value: Utils.formatCurrency(data.lucroTotal), icon: 'bi-graph-up-arrow', color: 'info',    isMoney: true  },
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

  renderMO(mo) {
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    if (mo.mesAtual) {
      const [y, m] = mo.mesAtual.split('-');
      document.getElementById('moMesLabel').textContent = meses[parseInt(m) - 1] + '/' + y;
    }

    const porFunc = mo.porFunc || {};
    const funcRows = Object.entries(porFunc).map(([nome, v]) => {
      const saldo = v.valor - v.vale;
      return `<tr>
        <td><span class="badge bg-primary">${nome}</span></td>
        <td class="text-end">${Utils.formatCurrency(v.valor)}</td>
        <td class="text-end text-warning">${Utils.formatCurrency(v.vale)}</td>
        <td class="text-end fw-semibold ${saldo >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(saldo)}</td>
      </tr>`;
    }).join('');

    document.getElementById('moResumo').innerHTML = `
      <div class="row g-0 border-bottom">
        <div class="col-4 p-3 text-center border-end">
          <div class="text-muted small">Produzido</div>
          <div class="fw-bold text-primary">${Utils.formatCurrency(mo.totalValor)}</div>
        </div>
        <div class="col-4 p-3 text-center border-end">
          <div class="text-muted small">Vales</div>
          <div class="fw-bold text-warning">${Utils.formatCurrency(mo.totalVale)}</div>
        </div>
        <div class="col-4 p-3 text-center">
          <div class="text-muted small">Saldo a Pagar</div>
          <div class="fw-bold text-success">${Utils.formatCurrency(mo.saldo)}</div>
        </div>
      </div>
      ${funcRows ? `<div class="table-responsive"><table class="table table-sm align-middle mb-0">
        <thead class="table-light"><tr><th>Funcionário</th><th class="text-end">Produzido</th><th class="text-end">Vales</th><th class="text-end">Saldo</th></tr></thead>
        <tbody>${funcRows}</tbody>
      </table></div>` : '<p class="text-muted p-3 mb-0">Nenhum lançamento no mês.</p>'}`;
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
      document.getElementById('tabelaObrasRecentes').innerHTML = '<p class="text-muted p-3">Nenhuma obra registrada.</p>';
      return;
    }
    document.getElementById('tabelaObrasRecentes').innerHTML = `
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light"><tr><th>Obra</th><th>Fase</th><th class="text-end">Lucro</th></tr></thead>
        <tbody>${obras.slice(0, 8).map(o => `
          <tr>
            <td class="fw-semibold small">${o.nome}</td>
            <td><span class="badge ${o.fase === 'EXECUTADO' ? 'bg-success' : o.fase === 'ANDAMENTO' ? 'bg-warning text-dark' : 'bg-info'}">${o.fase || '—'}</span></td>
            <td class="text-end fw-bold ${parseFloat(o.lucro) >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(o.lucro)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  },

  renderChart(fases) {
    const ctx = document.getElementById('chartObras');
    if (!ctx) return;
    if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy();
    const labels = Object.keys(fases);
    const values = Object.values(fases);
    if (!values.length) return;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: ['#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6'], borderWidth: 2 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }
      }
    });
  }
};
