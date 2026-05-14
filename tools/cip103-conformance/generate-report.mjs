// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function escapeHtml(s) {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

function normalizeStatus(s) {
    if (s === 'pass' || s === 'fail' || s === 'skip') return s
    return 'fail'
}

function statusBadge(status) {
    const cls =
        status === 'pass'
            ? 'badge pass'
            : status === 'skip'
              ? 'badge skip'
              : 'badge fail'
    return `<span class="${cls}">${escapeHtml(status.toUpperCase())}</span>`
}

function summarizeMethods(results) {
    // schema tests are of the form CIP103-SCHEMA-<methodName>
    const methods = new Map()
    for (const r of results) {
        if (!r?.id || typeof r.id !== 'string') continue
        if (!r.id.startsWith('CIP103-SCHEMA-')) continue
        const method = r.id.slice('CIP103-SCHEMA-'.length)
        if (!method) continue
        methods.set(method, normalizeStatus(r.status))
    }
    const all = Array.from(methods.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
    )
    const covered = all.filter(([, st]) => st === 'pass').length
    return { all, covered, total: all.length }
}

function groupByCategory(results) {
    const groups = new Map()
    for (const r of results) {
        const cat = r?.category ?? 'unknown'
        if (!groups.has(cat)) groups.set(cat, [])
        groups.get(cat).push(r)
    }
    for (const [, arr] of groups) {
        arr.sort((a, b) => String(a.id).localeCompare(String(b.id)))
    }
    return groups
}

const resultFiles = fs
    .readdirSync(__dirname)
    .filter((f) => f.startsWith('result-') && f.endsWith('.json'))
    .map((f) => path.join(__dirname, f))

const artifacts = resultFiles.map((filePath) => {
    const artifact = readJson(filePath)
    return {
        fileName: path.basename(filePath),
        filePath,
        suite: artifact.suite,
        profile: artifact.profile,
        provider: artifact.provider,
        generatedAt: artifact.generatedAt,
        summary: artifact.summary,
        results: artifact.results ?? [],
    }
})

artifacts.sort((a, b) =>
    String(a.provider?.name ?? a.fileName).localeCompare(
        String(b.provider?.name ?? b.fileName)
    )
)

const generatedAt = new Date().toISOString()
const outPath = path.join(__dirname, 'conformance-report.html')

const rowsHtml = artifacts
    .map((a, idx) => {
        const providerName = a.provider?.name ?? a.fileName
        const providerTransport = a.provider?.transport ?? 'unknown'
        const providerEndpoint =
            a.provider?.endpoint ?? a.provider?.appUrl ?? ''
        const overall = a.summary?.status ?? 'fail'
        const methods = summarizeMethods(a.results)
        const groups = groupByCategory(a.results)

        const methodsHtml =
            methods.total === 0
                ? '<span class="muted">No schema checks found.</span>'
                : `<span class="mono">${methods.covered}/${methods.total}</span>`

        const detailId = `detail-${idx}`
        const compactChecks = ['protocol', 'behavior', 'stability']
            .flatMap((cat) => (groups.get(cat) ?? []).map((r) => r))
            .map((r) => {
                const st = normalizeStatus(r.status)
                return `<tr>
  <td class="mono">${escapeHtml(r.id)}</td>
  <td>${escapeHtml(r.title ?? '')}</td>
  <td>${escapeHtml(r.category ?? '')}</td>
  <td>${statusBadge(st)}</td>
  <td class="mono">${escapeHtml(r.details ?? '')}</td>
</tr>`
            })
            .join('\n')

        const methodRows = methods.all
            .map(([m, st]) => {
                return `<tr>
  <td class="mono">${escapeHtml(m)}</td>
  <td>${statusBadge(st)}</td>
</tr>`
            })
            .join('\n')

        return `<tbody class="wallet">
<tr class="wallet-row" data-wallet-index="${idx}">
  <td>
    <div class="wallet-name">${escapeHtml(providerName)}</div>
    <div class="muted small">${escapeHtml(providerTransport)} ${providerEndpoint ? '• ' + escapeHtml(providerEndpoint) : ''}</div>
  </td>
  <td>${statusBadge(overall)}</td>
  <td class="mono">${escapeHtml(a.profile ?? '')}</td>
  <td>${methodsHtml}</td>
  <td class="mono">${escapeHtml(a.fileName)}</td>
  <td><button class="btn" data-toggle="${detailId}">Details</button></td>
</tr>
<tr id="${detailId}" class="wallet-detail hidden">
  <td colspan="6">
    <div class="detail-grid">
      <div>
        <h3>Method coverage (schema)</h3>
        <table class="mini">
          <thead><tr><th>Method</th><th>Status</th></tr></thead>
          <tbody>
            ${methodRows || '<tr><td colspan="2" class="muted">No schema checks.</td></tr>'}
          </tbody>
        </table>
      </div>
      <div>
        <h3>Other checks</h3>
        <table class="mini">
          <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Status</th><th>Details</th></tr></thead>
          <tbody>
            ${compactChecks || '<tr><td colspan="5" class="muted">No checks.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </td>
</tr>
</tbody>`
    })
    .join('\n')

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>CIP-103 Conformance Report</title>
    <style>
      :root {
        --bg: #0b1020;
        --card: #111a33;
        --text: #e7ecff;
        --muted: #a6b0d6;
        --border: rgba(231,236,255,0.12);
        --pass: #24c08a;
        --fail: #ff4d5f;
        --skip: #f1b44c;
        --btn: #1c2a55;
        --btnHover: #24356d;
        --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      }
      body { margin: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
      .wrap { max-width: 1200px; margin: 0 auto; padding: 24px; }
      .header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
      h1 { margin: 0; font-size: 20px; }
      .meta { color: var(--muted); font-size: 12px; }
      .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-top: 16px; }
      .controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
      input[type="search"] { flex: 1; min-width: 280px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text); }
      select { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text); }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
      th { color: var(--muted); font-weight: 600; text-align: left; font-size: 12px; }
      .wallet-name { font-weight: 700; }
      .muted { color: var(--muted); }
      .small { font-size: 12px; }
      .mono { font-family: var(--mono); font-size: 12px; }
      .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
      .badge.pass { background: rgba(36,192,138,0.15); color: var(--pass); border: 1px solid rgba(36,192,138,0.35); }
      .badge.fail { background: rgba(255,77,95,0.12); color: var(--fail); border: 1px solid rgba(255,77,95,0.35); }
      .badge.skip { background: rgba(241,180,76,0.12); color: var(--skip); border: 1px solid rgba(241,180,76,0.35); }
      .btn { padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border); background: var(--btn); color: var(--text); cursor: pointer; }
      .btn:hover { background: var(--btnHover); }
      .hidden { display: none; }
      .detail-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; padding: 12px 0; }
      h3 { margin: 0 0 10px 0; font-size: 14px; }
      .mini th, .mini td { padding: 8px 8px; }
      .mini td { font-size: 12px; }
      @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <h1>CIP-103 Conformance Report</h1>
        <div class="meta">Generated ${escapeHtml(generatedAt)} • Source: tools/cip103-conformance/result-*.json</div>
      </div>

      <div class="card">
        <div class="controls">
          <input id="q" type="search" placeholder="Filter wallets / endpoints / filenames…" />
          <select id="status">
            <option value="all">All statuses</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          <select id="profile">
            <option value="all">All profiles</option>
            <option value="sync">sync</option>
            <option value="async">async</option>
          </select>
        </div>
      </div>

      <div class="card">
        <table id="tbl">
          <thead>
            <tr>
              <th>Wallet</th>
              <th>Overall</th>
              <th>Profile</th>
              <th>Methods covered</th>
              <th>Artifact</th>
              <th></th>
            </tr>
          </thead>
          ${rowsHtml}
        </table>
      </div>
    </div>

    <script>
      const q = document.getElementById('q');
      const statusSel = document.getElementById('status');
      const profileSel = document.getElementById('profile');

      function textOfRow(tbody) {
        return tbody.innerText.toLowerCase();
      }

      function applyFilter() {
        const needle = (q.value || '').trim().toLowerCase();
        const status = statusSel.value;
        const profile = profileSel.value;

        for (const tbody of document.querySelectorAll('tbody.wallet')) {
          const row = tbody.querySelector('.wallet-row');
          const overallText = row.children[1].innerText.trim().toLowerCase();
          const profileText = row.children[2].innerText.trim().toLowerCase();
          const hay = textOfRow(tbody);

          const okNeedle = !needle || hay.includes(needle);
          const okStatus = status === 'all' || overallText.includes(status);
          const okProfile = profile === 'all' || profileText === profile;

          tbody.style.display = (okNeedle && okStatus && okProfile) ? '' : 'none';
        }
      }

      q.addEventListener('input', applyFilter);
      statusSel.addEventListener('change', applyFilter);
      profileSel.addEventListener('change', applyFilter);
      applyFilter();

      document.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-toggle]');
        if (!btn) return;
        const id = btn.getAttribute('data-toggle');
        const detail = document.getElementById(id);
        if (!detail) return;
        detail.classList.toggle('hidden');
        btn.textContent = detail.classList.contains('hidden') ? 'Details' : 'Hide';
      });
    </script>
  </body>
</html>
`

fs.writeFileSync(outPath, html, 'utf8')
console.log(`Wrote ${outPath}`)
