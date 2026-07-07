const sources = ["card-present", "mobile-pay", "web-checkout", "atm", "wallet", "merchant-api"];
const maxPoints = 92;
const state = {
  paused: false,
  timer: null,
  sequence: 0,
  events: [],
  incidents: [],
  baseline: [],
  anomalyCount: 0,
  startTime: Date.now(),
  lastRetrain: Date.now(),
};

const els = {
  sensitivity: document.querySelector("#sensitivity"),
  velocity: document.querySelector("#velocity"),
  injectAnomalies: document.querySelector("#injectAnomalies"),
  pauseButton: document.querySelector("#pauseButton"),
  resetButton: document.querySelector("#resetButton"),
  streamStatus: document.querySelector("#streamStatus"),
  thresholdLabel: document.querySelector("#thresholdLabel"),
  throughputChart: document.querySelector("#throughputChart"),
  distributionChart: document.querySelector("#distributionChart"),
  eventsMetric: document.querySelector("#eventsMetric"),
  eventsTrend: document.querySelector("#eventsTrend"),
  rateMetric: document.querySelector("#rateMetric"),
  rateTrend: document.querySelector("#rateTrend"),
  latencyMetric: document.querySelector("#latencyMetric"),
  latencyTrend: document.querySelector("#latencyTrend"),
  riskMetric: document.querySelector("#riskMetric"),
  riskTrend: document.querySelector("#riskTrend"),
  incidentFeed: document.querySelector("#incidentFeed"),
  eventTable: document.querySelector("#eventTable"),
  modelMeterFill: document.querySelector("#modelMeterFill"),
  precisionMetric: document.querySelector("#precisionMetric"),
  retrainMetric: document.querySelector("#retrainMetric"),
};

const throughputCtx = els.throughputChart.getContext("2d");
const distributionCtx = els.distributionChart.getContext("2d");

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values, mean) {
  if (values.length < 2) return 1;
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.max(Math.sqrt(variance), 1);
}

function makeEvent() {
  const source = sources[Math.floor(Math.random() * sources.length)];
  const cycle = Math.sin(state.sequence / 9) * 16 + Math.cos(state.sequence / 21) * 10;
  const sourceOffset = sources.indexOf(source) * 6;
  let value = 112 + cycle + sourceOffset + randomBetween(-13, 13);

  const shouldInject = els.injectAnomalies.checked && Math.random() < 0.15;
  if (shouldInject) {
    value += Math.random() > 0.45 ? randomBetween(55, 104) : randomBetween(-70, -38);
  }

  const window = state.baseline.slice(-60);
  const mean = window.length > 8 ? average(window) : 126;
  const deviation = standardDeviation(window, mean);
  const score = Math.abs((value - mean) / deviation);
  const threshold = Number(els.sensitivity.value);
  const status = score > threshold + 1.1 ? "critical" : score > threshold ? "warning" : "normal";

  const event = {
    id: state.sequence,
    time: new Date(),
    source,
    value: Math.round(value),
    baseline: Math.round(mean),
    score,
    status,
  };

  state.sequence += 1;
  state.events.push(event);
  if (state.events.length > maxPoints) state.events.shift();

  if (status === "normal") {
    state.baseline.push(value);
    if (state.baseline.length > 180) state.baseline.shift();
  } else {
    state.anomalyCount += 1;
    state.incidents.unshift(event);
    if (state.incidents.length > 18) state.incidents.pop();
  }

  if (state.sequence % 70 === 0) state.lastRetrain = Date.now();
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function drawGrid(ctx, width, height) {
  ctx.strokeStyle = "#e6edf3";
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i += 1) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawThroughputChart() {
  const canvas = els.throughputChart;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  throughputCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const padding = 26;
  const values = state.events.map((event) => event.value);
  const min = Math.min(40, ...values) - 10;
  const max = Math.max(230, ...values) + 10;
  const scaleY = (value) => height - padding - ((value - min) / (max - min)) * (height - padding * 2);
  const scaleX = (index) => padding + (index / Math.max(maxPoints - 1, 1)) * (width - padding * 2);

  throughputCtx.clearRect(0, 0, width, height);
  drawGrid(throughputCtx, width, height);

  if (state.events.length > 1) {
    throughputCtx.beginPath();
    state.events.forEach((event, index) => {
      const x = scaleX(index);
      const y = scaleY(event.value);
      if (index === 0) throughputCtx.moveTo(x, y);
      else throughputCtx.lineTo(x, y);
    });
    throughputCtx.strokeStyle = "#1d8f8f";
    throughputCtx.lineWidth = 3;
    throughputCtx.stroke();
  }

  state.events.forEach((event, index) => {
    if (event.status === "normal") return;
    throughputCtx.beginPath();
    throughputCtx.arc(scaleX(index), scaleY(event.value), event.status === "critical" ? 6 : 5, 0, Math.PI * 2);
    throughputCtx.fillStyle = event.status === "critical" ? "#d94b4b" : "#d89c24";
    throughputCtx.fill();
    throughputCtx.strokeStyle = "#ffffff";
    throughputCtx.lineWidth = 2;
    throughputCtx.stroke();
  });

  throughputCtx.fillStyle = "#667085";
  throughputCtx.font = "12px Inter, sans-serif";
  throughputCtx.fillText(`${Math.round(max)} max`, 10, 18);
  throughputCtx.fillText(`${Math.round(min)} min`, 10, height - 10);
}

function drawDistributionChart() {
  const canvas = els.distributionChart;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  distributionCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const counts = sources.map((source) => state.events.filter((event) => event.source === source).length);
  const max = Math.max(1, ...counts);
  const barWidth = Math.max(16, (width - 44) / sources.length - 10);

  distributionCtx.clearRect(0, 0, width, height);
  drawGrid(distributionCtx, width, height);

  counts.forEach((count, index) => {
    const x = 22 + index * (barWidth + 10);
    const barHeight = (count / max) * (height - 62);
    distributionCtx.fillStyle = ["#1d8f8f", "#2e9d62", "#d89c24", "#7755aa", "#4d7ea8", "#d94b4b"][index];
    distributionCtx.fillRect(x, height - 34 - barHeight, barWidth, barHeight);
    distributionCtx.fillStyle = "#667085";
    distributionCtx.font = "11px Inter, sans-serif";
    distributionCtx.save();
    distributionCtx.translate(x + barWidth / 2, height - 18);
    distributionCtx.rotate(-0.5);
    distributionCtx.textAlign = "center";
    distributionCtx.fillText(sources[index].split("-")[0], 0, 0);
    distributionCtx.restore();
  });
}

function renderMetrics() {
  const total = Math.max(state.sequence, 1);
  const durationMinutes = Math.max((Date.now() - state.startTime) / 60000, 0.1);
  const eventsPerMinute = Math.round(total / durationMinutes);
  const recent = state.events.slice(-24);
  const latency = Math.round(average(recent.map((event) => Math.abs(event.value - event.baseline) * 2 + 68)));
  const anomalyRate = (state.anomalyCount / total) * 100;
  const risk = Math.min(100, Math.round(anomalyRate * 5 + average(recent.map((event) => event.score)) * 8));

  els.eventsMetric.textContent = eventsPerMinute.toLocaleString();
  els.eventsTrend.textContent = `${recent.length} records in active window`;
  els.rateMetric.textContent = `${anomalyRate.toFixed(1)}%`;
  els.rateTrend.textContent = anomalyRate > 12 ? "elevated incident density" : "baseline stable";
  els.latencyMetric.textContent = `${latency || 0} ms`;
  els.latencyTrend.textContent = latency > 190 ? "processing drift detected" : "within SLA target";
  els.riskMetric.textContent = risk;
  els.riskTrend.textContent = risk > 65 ? "investigate now" : risk > 36 ? "watch closely" : "normal";
  els.thresholdLabel.textContent = `threshold ${Number(els.sensitivity.value).toFixed(2)}z`;
  els.modelMeterFill.style.width = `${Math.max(18, 100 - risk * 0.72)}%`;
  els.precisionMetric.textContent = `${Math.max(82, 98 - anomalyRate * 0.7).toFixed(1)}%`;
  els.retrainMetric.textContent = `${Math.max(0, Math.round((Date.now() - state.lastRetrain) / 1000))}s ago`;
}

function renderIncidents() {
  if (!state.incidents.length) {
    els.incidentFeed.innerHTML = '<div class="incident"><span class="severity"></span><div><strong>No suspicious transactions yet</strong><span>Detector is learning the current payment pattern.</span></div><code>OK</code></div>';
    return;
  }

  els.incidentFeed.innerHTML = state.incidents
    .slice(0, 7)
    .map(
      (event) => `
        <div class="incident">
          <span class="severity ${event.status === "critical" ? "high" : ""}"></span>
          <div>
            <strong>${event.source} anomaly at ${formatTime(event.time)}</strong>
            <span>amount ${event.value}, baseline ${event.baseline}</span>
          </div>
          <code>${event.score.toFixed(1)}z</code>
        </div>
      `,
    )
    .join("");
}

function renderTable() {
  els.eventTable.innerHTML = state.events
    .slice(-10)
    .reverse()
    .map(
      (event) => `
        <tr>
          <td>${formatTime(event.time)}</td>
          <td>${event.source}</td>
          <td>${event.value}</td>
          <td>${event.baseline}</td>
          <td>${event.score.toFixed(2)}z</td>
          <td><span class="badge ${event.status}">${event.status}</span></td>
        </tr>
      `,
    )
    .join("");
}

function render() {
  drawThroughputChart();
  drawDistributionChart();
  renderMetrics();
  renderIncidents();
  renderTable();
}

function tick() {
  if (!state.paused) {
    makeEvent();
    if (Math.random() > 0.45) makeEvent();
    render();
  }
  schedule();
}

function schedule() {
  clearTimeout(state.timer);
  state.timer = setTimeout(tick, Number(els.velocity.value));
}

function reset() {
  state.sequence = 0;
  state.events = [];
  state.incidents = [];
  state.baseline = [];
  state.anomalyCount = 0;
  state.startTime = Date.now();
  state.lastRetrain = Date.now();
  for (let index = 0; index < 38; index += 1) makeEvent();
  render();
}

els.pauseButton.addEventListener("click", () => {
  state.paused = !state.paused;
  els.pauseButton.textContent = state.paused ? ">" : "||";
  els.pauseButton.title = state.paused ? "Resume stream" : "Pause stream";
  els.streamStatus.textContent = state.paused ? "Paused" : "Streaming";
  document.querySelector(".status-dot").style.background = state.paused ? "#d89c24" : "#2e9d62";
});

els.resetButton.addEventListener("click", reset);
els.sensitivity.addEventListener("input", renderMetrics);
els.velocity.addEventListener("input", schedule);
window.addEventListener("resize", render);

reset();
schedule();
