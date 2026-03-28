const fs = require('fs');
const path = require('path');

// Read jest JSON output
const results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));

// Read coverage summary if available
let coverageSummary = {};
const covSummaryPath = path.join('coverage-data', 'coverage-summary.json');
if (fs.existsSync(covSummaryPath)) {
  coverageSummary = JSON.parse(fs.readFileSync(covSummaryPath, 'utf8'));
}

const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo', hour12: false });
const passed = results.numPassedTests;
const failed = results.numFailedTests;
const total = results.numTotalTests;
const suites = results.numPassedTestSuites;
const duration = ((results.testResults.reduce((a, r) => a + ((r.endTime ?? 0) - (r.startTime ?? 0)), 0)) / 1000).toFixed(2);

function pctClass(v) {
  if (v >= 90) return 'high';
  if (v >= 70) return 'medium';
  return 'low';
}

function pctColor(v) {
  if (v >= 90) return '#4ade80';
  if (v >= 70) return '#fbbf24';
  return '#f87171';
}

// Build coverage rows from summary
function buildCoverageRows() {
  const skip = ['total'];
  return Object.entries(coverageSummary)
    .filter(([file]) => !skip.includes(file))
    .map(([file, data]) => {
      const name = file.replace(/.*\/src\//, '').replace(/\\/g, '/');
      const s = data.statements.pct;
      const b = data.branches.pct;
      const f = data.functions.pct;
      const l = data.lines.pct;
      return `
        <tr>
          <td><strong>${name}</strong></td>
          <td><span class="pct ${pctClass(s)}">${s}%</span><span class="bar-wrap"><span class="bar ${pctClass(s)}" style="width:${s}%"></span></span></td>
          <td><span class="pct ${pctClass(b)}">${b}%</span><span class="bar-wrap"><span class="bar ${pctClass(b)}" style="width:${b}%"></span></span></td>
          <td><span class="pct ${pctClass(f)}">${f}%</span><span class="bar-wrap"><span class="bar ${pctClass(f)}" style="width:${f}%"></span></span></td>
          <td><span class="pct ${pctClass(l)}">${l}%</span><span class="bar-wrap"><span class="bar ${pctClass(l)}" style="width:${l}%"></span></span></td>
        </tr>`;
    }).join('');
}

// Build test suite blocks
function buildSuites() {
  return results.testResults.map(suite => {
    const suiteName = path.basename(suite.name, '.spec.ts')
      .replace(/\./g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
    const tests = suite.assertionResults;
    const passCount = tests.filter(t => t.status === 'passed').length;
    const failCount = tests.filter(t => t.status === 'failed').length;
    const countBadge = failCount > 0
      ? `<span class="suite-count fail">${passCount} passed, ${failCount} failed</span>`
      : `<span class="suite-count">${passCount} passed</span>`;

    const items = tests.map(t => {
      const icon = t.status === 'passed' ? 'dot' : 'dot fail-dot';
      const name = t.fullName || t.title;
      return `<div class="test-item"><span class="${icon}"></span>${name}</div>`;
    }).join('');

    return `
      <div class="suite">
        <div class="suite-header">
          <span class="suite-name">${suiteName}</span>
          ${countBadge}
        </div>
        <div class="test-list">${items}</div>
      </div>`;
  }).join('');
}

// Total coverage from summary
const totalCov = coverageSummary.total || {};
const stmtPct = totalCov.statements?.pct ?? 'N/A';
const branchPct = totalCov.branches?.pct ?? 'N/A';
const funcPct = totalCov.functions?.pct ?? 'N/A';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Bizpark.Commerce — Test Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; }
  header { background: linear-gradient(135deg, #1e293b, #0f172a); border-bottom: 1px solid #334155; padding: 24px 40px; }
  header h1 { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; }
  header p { color: #94a3b8; font-size: 0.875rem; margin-top: 4px; }
  .container { max-width: 1200px; margin: 0 auto; padding: 32px 40px; }
  .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 32px; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; }
  .card .value { font-size: 2.25rem; font-weight: 800; line-height: 1; }
  .card .label { font-size: 0.8rem; color: #94a3b8; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
  .green { color: #4ade80; } .blue { color: #60a5fa; } .yellow { color: #fbbf24; } .purple { color: #a78bfa; } .red { color: #f87171; }
  .section { margin-bottom: 32px; }
  .section-title { font-size: 1rem; font-weight: 600; color: #f1f5f9; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .badge { font-size: 0.7rem; background: #334155; color: #94a3b8; padding: 2px 8px; border-radius: 99px; font-weight: 500; }
  .badge.pass { background: #14532d; color: #4ade80; } .badge.fail { background: #450a0a; color: #f87171; }
  table { width: 100%; border-collapse: collapse; background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
  thead tr { background: #0f172a; }
  th { text-align: left; padding: 10px 16px; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 10px 16px; font-size: 0.85rem; border-top: 1px solid #0f172a; }
  tbody tr { background: #1e293b; } tbody tr:nth-child(even) { background: #172033; } tbody tr:hover { background: #253349; }
  .bar-wrap { background: #0f172a; border-radius: 99px; height: 8px; width: 100px; overflow: hidden; display: inline-block; vertical-align: middle; margin-left: 8px; }
  .bar { height: 100%; border-radius: 99px; }
  .bar.high { background: #4ade80; } .bar.medium { background: #fbbf24; } .bar.low { background: #f87171; }
  .pct { font-size: 0.8rem; font-weight: 600; display: inline-block; width: 42px; text-align: right; }
  .pct.high { color: #4ade80; } .pct.medium { color: #fbbf24; } .pct.low { color: #f87171; }
  .suite { background: #1e293b; border: 1px solid #334155; border-radius: 10px; margin-bottom: 12px; overflow: hidden; }
  .suite-header { padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; background: #172033; }
  .suite-name { font-size: 0.875rem; font-weight: 600; color: #e2e8f0; }
  .suite-count { font-size: 0.75rem; color: #4ade80; background: #14532d; padding: 2px 8px; border-radius: 99px; }
  .suite-count.fail { color: #f87171; background: #450a0a; }
  .test-list { padding: 8px 0; }
  .test-item { display: flex; align-items: center; gap: 10px; padding: 6px 18px; font-size: 0.8rem; color: #94a3b8; }
  .test-item:hover { background: #253349; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }
  .fail-dot { width: 8px; height: 8px; border-radius: 50%; background: #f87171; flex-shrink: 0; }
  footer { text-align: center; padding: 24px; color: #475569; font-size: 0.78rem; border-top: 1px solid #1e293b; margin-top: 40px; }
</style>
</head>
<body>
<header>
  <h1>Bizpark.Commerce — Test Report</h1>
  <p>Generated: ${now} &nbsp;|&nbsp; Jest + ts-jest &nbsp;|&nbsp; Node.js</p>
</header>
<div class="container">

  <div class="summary">
    <div class="card"><div class="value green">${passed}</div><div class="label">Passed</div></div>
    <div class="card"><div class="value ${failed > 0 ? 'red' : 'green'}">${failed}</div><div class="label">Failed</div></div>
    <div class="card"><div class="value blue">${suites}</div><div class="label">Suites</div></div>
    <div class="card"><div class="value purple">${duration}s</div><div class="label">Duration</div></div>
    <div class="card"><div class="value yellow">${stmtPct}%</div><div class="label">Stmt Coverage</div></div>
  </div>

  <div class="section">
    <div class="section-title">
      Coverage by File
      <span class="badge">Stmts ${stmtPct}% &nbsp;|&nbsp; Branches ${branchPct}% &nbsp;|&nbsp; Functions ${funcPct}%</span>
    </div>
    <table>
      <thead><tr><th>File</th><th>Statements</th><th>Branches</th><th>Functions</th><th>Lines</th></tr></thead>
      <tbody>${buildCoverageRows()}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">
      Test Suites
      <span class="badge ${failed > 0 ? 'fail' : 'pass'}">${passed} passed / ${total} total</span>
    </div>
    ${buildSuites()}
  </div>

</div>
<footer>Bizpark.Commerce &mdash; ${total} tests &middot; ${suites} suites &middot; ${failed} failures &middot; ${now}</footer>
</body>
</html>`;

fs.writeFileSync('test-report.html', html, 'utf8');

// Cleanup temp files
if (fs.existsSync('test-results.json')) fs.unlinkSync('test-results.json');
if (fs.existsSync('coverage-data')) fs.rmSync('coverage-data', { recursive: true, force: true });

console.log('\n✅ test-report.html updated successfully');
