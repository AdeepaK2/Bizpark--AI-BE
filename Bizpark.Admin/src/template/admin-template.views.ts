import { TemplateType } from 'bizpark.core';

type TemplateViewModel = {
  id: string;
  name: string;
  description: string | null;
  type: TemplateType;
  baseHtmlUrl: string | null;
  createdAt: Date;
};

type FormDataModel = {
  name?: string;
  description?: string;
  type?: TemplateType;
  baseHtmlUrl?: string;
  deploymentRaw?: string;
  cmsSchemaRaw?: string;
  baseHtmlTemplate?: string;
  previewDataRaw?: string;
};

const types: TemplateType[] = [
  'SHOWCASE',
  'ECOMMERCE_ITEM',
  'ECOMMERCE_SUBSCRIPTION',
];

const style = `
  <style>
    :root { --bg: #f7f8fb; --panel: #ffffff; --line: #dfe3ec; --text: #0f172a; --muted: #4b5563; --brand: #075985; }
    * { box-sizing: border-box; }
    body { margin: 0; background: radial-gradient(1200px 500px at -5% -10%, #cdeafe, transparent), var(--bg); color: var(--text); font-family: "Avenir Next", "SF Pro Display", "Segoe UI", sans-serif; }
    .wrap { max-width: 1120px; margin: 0 auto; padding: 28px 18px 60px; }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 10px; }
    h1 { margin: 0; font-size: 28px; letter-spacing: -0.02em; }
    .sub { color: var(--muted); margin: 6px 0 0; }
    .btn { border: 1px solid var(--line); background: #fff; color: var(--text); border-radius: 10px; padding: 10px 14px; font-weight: 600; text-decoration: none; cursor: pointer; }
    .btn:hover { border-color: var(--brand); }
    .btn-primary { border-color: var(--brand); background: var(--brand); color: #fff; }
    .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 16px; box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06); }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #edf1f7; font-size: 14px; vertical-align: top; }
    th { color: var(--muted); font-weight: 600; }
    .badge { display: inline-block; background: #e0f2fe; color: #0c4a6e; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 700; }
    form { display: grid; gap: 14px; }
    label { display: grid; gap: 6px; font-size: 13px; font-weight: 700; color: #1f2937; }
    input, select, textarea { border: 1px solid var(--line); border-radius: 10px; padding: 10px 11px; font: inherit; }
    textarea { min-height: 160px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
    .muted { color: var(--muted); font-size: 12px; margin: 0; }
    .err { border: 1px solid #fecaca; background: #fef2f2; color: #7f1d1d; border-radius: 10px; padding: 10px 12px; font-size: 13px; }
    .ok { border: 1px solid #bbf7d0; background: #f0fdf4; color: #14532d; border-radius: 10px; padding: 10px 12px; font-size: 13px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .builder { border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
    .section { border: 1px dashed #cbd5e1; border-radius: 12px; padding: 10px; margin-bottom: 10px; background: #f8fafc; }
    .section-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
    .fields { display: grid; gap: 8px; }
    .field { display: grid; grid-template-columns: 1fr 1fr 140px 1fr auto; gap: 8px; align-items: center; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
    .preview-frame { border: 1px solid var(--line); border-radius: 12px; width: 100%; min-height: 440px; background: #fff; }
    @media (max-width: 960px) {
      .row, .row-2 { grid-template-columns: 1fr; }
      .field { grid-template-columns: 1fr 1fr; }
    }
  </style>
`;

function esc(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function typeOptions(selected?: string) {
  return types
    .map((t) => `<option value="${t}" ${selected === t ? 'selected' : ''}>${t}</option>`)
    .join('');
}

function defaultDeployment() {
  return JSON.stringify(
    { framework: 'NEXTJS', repositoryUrl: '', envRequirements: [] },
    null,
    2,
  );
}

function defaultCms() {
  return JSON.stringify({ sections: [] }, null, 2);
}

function defaultBaseHtmlTemplate() {
  return `<section style="font-family:Arial,sans-serif;padding:56px;max-width:980px;margin:0 auto;">
  <h1 style="font-size:42px;margin:0 0 10px;">{{hero.title}}</h1>
  <p style="font-size:18px;line-height:1.6;color:#334155;margin:0 0 18px;">{{hero.subtitle}}</p>
  <a href="#" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;">{{hero.ctaText}}</a>
  <div style="margin-top:32px;padding:22px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
    <h2 style="margin:0 0 8px;font-size:28px;">{{about.heading}}</h2>
    <p style="margin:0;color:#475569;line-height:1.7;">{{about.body}}</p>
  </div>
</section>`;
}

function defaultPreviewData() {
  return JSON.stringify(
    {
      hero: {
        title: 'Grow your business online',
        subtitle: 'A modern website generated from your template and CMS fields.',
        ctaText: 'Get Started',
      },
      about: {
        heading: 'About Us',
        body: 'Add your business details and value proposition.',
      },
    },
    null,
    2,
  );
}

function builderScript() {
  return `
  <script>
    const root = document.getElementById('cms-builder');
    const hiddenSchema = document.getElementById('cmsSchemaRaw');
    const schemaPreview = document.getElementById('cmsPreview');
    const htmlInput = document.getElementById('baseHtmlTemplate');
    const previewDataInput = document.getElementById('previewDataRaw');
    const frame = document.getElementById('livePreview');
    let sections;
    let previewDataManuallyChanged = false;
    let lastAutoPreview = '';

    try {
      const parsed = JSON.parse(hiddenSchema.value || '{"sections":[]}');
      sections = Array.isArray(parsed.sections) ? parsed.sections : [];
    } catch {
      sections = [];
    }

    function uid(prefix) {
      return prefix + '-' + Math.random().toString(36).slice(2, 8);
    }

    function getPathValue(obj, path) {
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
        if (current == null) return '';
        current = current[part];
      }
      return current == null ? '' : String(current);
    }

    function applyTemplate(templateText, data) {
      return String(templateText || '').replace(/\\{\\{\\s*([a-zA-Z0-9_.-]+)\\s*\\}\\}/g, function(_, key) {
        return getPathValue(data, key);
      });
    }

    function buildDefaultPreviewData() {
      const result = {};
      for (const section of sections) {
        if (!section || !section.id) continue;
        result[section.id] = result[section.id] || {};
        const fields = Array.isArray(section.fields) ? section.fields : [];
        for (const field of fields) {
          if (!field || !field.key) continue;
          const fallback = field.defaultValue || ('Sample ' + (field.label || field.key));
          result[section.id][field.key] = fallback;
        }
      }
      return result;
    }

    function syncSchema() {
      const data = { sections: sections };
      const raw = JSON.stringify(data, null, 2);
      hiddenSchema.value = raw;
      schemaPreview.value = raw;
      if (!previewDataManuallyChanged || previewDataInput.value.trim() === '' || previewDataInput.value === lastAutoPreview) {
        lastAutoPreview = JSON.stringify(buildDefaultPreviewData(), null, 2);
        previewDataInput.value = lastAutoPreview;
      }
      renderPreview();
    }

    function renderPreview() {
      let dataObj = {};
      try {
        dataObj = previewDataInput.value.trim() ? JSON.parse(previewDataInput.value) : {};
      } catch {
        frame.srcdoc = '<div style="font-family:Arial,sans-serif;padding:24px;color:#7f1d1d">Preview data JSON is invalid.</div>';
        return;
      }
      const html = applyTemplate(htmlInput.value, dataObj);
      frame.srcdoc = html || '<div style="font-family:Arial,sans-serif;padding:24px;color:#334155">Add Base HTML Template to see preview.</div>';
    }

    function addSection() {
      sections.push({ id: uid('section'), label: 'New Section', fields: [] });
      renderBuilder();
    }

    function addField(sectionIndex) {
      sections[sectionIndex].fields.push({ key: uid('field'), label: 'New Field', type: 'TEXT', defaultValue: '' });
      renderBuilder();
    }

    function removeSection(sectionIndex) {
      sections.splice(sectionIndex, 1);
      renderBuilder();
    }

    function removeField(sectionIndex, fieldIndex) {
      sections[sectionIndex].fields.splice(fieldIndex, 1);
      renderBuilder();
    }

    function renderBuilder() {
      root.innerHTML = '';
      sections.forEach((section, sectionIndex) => {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'section';
        sectionEl.innerHTML = \`
          <div class="section-head">
            <input value="\${section.id || ''}" data-kind="section-id" data-s="\${sectionIndex}" placeholder="section id" />
            <input value="\${section.label || ''}" data-kind="section-label" data-s="\${sectionIndex}" placeholder="section label" />
            <button type="button" class="btn" data-act="remove-section" data-s="\${sectionIndex}">Delete</button>
          </div>
          <div class="fields"></div>
          <div class="actions">
            <button type="button" class="btn" data-act="add-field" data-s="\${sectionIndex}">Add Field</button>
          </div>
        \`;
        const fieldsWrap = sectionEl.querySelector('.fields');
        (section.fields || []).forEach((field, fieldIndex) => {
          const row = document.createElement('div');
          row.className = 'field';
          row.innerHTML = \`
            <input value="\${field.key || ''}" data-kind="field-key" data-s="\${sectionIndex}" data-f="\${fieldIndex}" placeholder="key" />
            <input value="\${field.label || ''}" data-kind="field-label" data-s="\${sectionIndex}" data-f="\${fieldIndex}" placeholder="label" />
            <select data-kind="field-type" data-s="\${sectionIndex}" data-f="\${fieldIndex}">
              <option value="TEXT" \${field.type === 'TEXT' ? 'selected' : ''}>TEXT</option>
              <option value="COLOR" \${field.type === 'COLOR' ? 'selected' : ''}>COLOR</option>
              <option value="IMAGE_URL" \${field.type === 'IMAGE_URL' ? 'selected' : ''}>IMAGE_URL</option>
            </select>
            <input value="\${field.defaultValue || ''}" data-kind="field-default" data-s="\${sectionIndex}" data-f="\${fieldIndex}" placeholder="default value" />
            <button type="button" class="btn" data-act="remove-field" data-s="\${sectionIndex}" data-f="\${fieldIndex}">X</button>
          \`;
          fieldsWrap.appendChild(row);
        });
        root.appendChild(sectionEl);
      });
      syncSchema();
    }

    root.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const act = t.getAttribute('data-act');
      if (act === 'add-field') addField(Number(t.getAttribute('data-s')));
      if (act === 'remove-section') removeSection(Number(t.getAttribute('data-s')));
      if (act === 'remove-field') removeField(Number(t.getAttribute('data-s')), Number(t.getAttribute('data-f')));
    });

    root.addEventListener('input', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLInputElement || t instanceof HTMLSelectElement)) return;
      const kind = t.getAttribute('data-kind');
      const s = Number(t.getAttribute('data-s'));
      const f = Number(t.getAttribute('data-f'));
      if (kind === 'section-id') sections[s].id = t.value;
      if (kind === 'section-label') sections[s].label = t.value;
      if (kind === 'field-key') sections[s].fields[f].key = t.value;
      if (kind === 'field-label') sections[s].fields[f].label = t.value;
      if (kind === 'field-type') sections[s].fields[f].type = t.value;
      if (kind === 'field-default') sections[s].fields[f].defaultValue = t.value;
      syncSchema();
    });

    document.getElementById('add-section').addEventListener('click', addSection);
    document.getElementById('reset-preview-data').addEventListener('click', () => {
      previewDataManuallyChanged = false;
      syncSchema();
    });
    previewDataInput.addEventListener('input', () => {
      previewDataManuallyChanged = true;
      renderPreview();
    });
    htmlInput.addEventListener('input', renderPreview);

    renderBuilder();
  </script>
  `;
}

export function layout(title: string, body: string) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${esc(title)}</title>
        ${style}
      </head>
      <body>
        <div class="wrap">${body}</div>
      </body>
    </html>
  `;
}

export function templatesListPage(input: {
  templates: TemplateViewModel[];
  notice?: string;
}) {
  const rows = input.templates
    .map(
      (t) => `
        <tr>
          <td>${esc(t.name)}</td>
          <td>${esc(t.description || '-')}</td>
          <td><span class="badge">${esc(t.type)}</span></td>
          <td>${esc(t.baseHtmlUrl || '-')}</td>
          <td>${new Date(t.createdAt).toLocaleString()}</td>
          <td><a class="btn" href="/admin/templates/${t.id}">Edit</a></td>
        </tr>
      `,
    )
    .join('');
  return layout(
    'Template Manager',
    `
      <div class="top">
        <div>
          <h1>Template Manager</h1>
          <p class="sub">Create and maintain reusable website templates and CMS schemas.</p>
        </div>
        <div style="display:flex;gap:8px;">
          <form method="post" action="/admin/templates/seed-starters">
            <button class="btn" type="submit">Seed Starter Templates</button>
          </form>
          <a class="btn btn-primary" href="/admin/templates/new">New Template</a>
        </div>
      </div>
      ${input.notice ? `<div class="ok">${esc(input.notice)}</div>` : ''}
      <div class="panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Type</th>
              <th>Base HTML URL</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6">No templates found.</td></tr>'}</tbody>
        </table>
      </div>
    `,
  );
}

export function templateFormPage(input: {
  mode: 'create' | 'edit';
  action: string;
  error?: string;
  notice?: string;
  values?: FormDataModel;
}) {
  const deployment = input.values?.deploymentRaw || defaultDeployment();
  const cmsSchema = input.values?.cmsSchemaRaw || defaultCms();
  const baseHtmlTemplate = input.values?.baseHtmlTemplate || defaultBaseHtmlTemplate();
  const previewDataRaw = input.values?.previewDataRaw || defaultPreviewData();
  const title = input.mode === 'create' ? 'Create Template' : 'Edit Template';
  return layout(
    title,
    `
      <div class="top">
        <div>
          <h1>${esc(title)}</h1>
          <p class="sub">Define metadata, deployment settings, CMS fields, and preview.</p>
        </div>
        <a class="btn" href="/admin/templates">Back</a>
      </div>
      ${input.error ? `<div class="err">${esc(input.error)}</div>` : ''}
      ${input.notice ? `<div class="ok">${esc(input.notice)}</div>` : ''}
      <div class="panel">
        <form method="post" action="${esc(input.action)}">
          <div class="row">
            <label>
              Template Name
              <input name="name" required value="${esc(input.values?.name || '')}" />
            </label>
            <label>
              Type
              <select name="type">${typeOptions(input.values?.type)}</select>
            </label>
          </div>
          <label>
            Description
            <input name="description" value="${esc(input.values?.description || '')}" />
          </label>
          <label>
            Base HTML URL
            <input name="baseHtmlUrl" placeholder="https://..." value="${esc(input.values?.baseHtmlUrl || '')}" />
          </label>
          <label>
            Deployment JSON
            <textarea name="deploymentRaw">${esc(deployment)}</textarea>
            <p class="muted">Framework/repository/env requirements. Base template HTML is stored separately below.</p>
          </label>
          <div class="builder">
            <div class="top" style="margin-bottom:8px;">
              <strong>CMS Schema Builder</strong>
              <button type="button" class="btn" id="add-section">Add Section</button>
            </div>
            <div id="cms-builder"></div>
            <label>
              CMS Schema JSON (auto-generated)
              <textarea id="cmsPreview" readonly></textarea>
            </label>
          </div>
          <input type="hidden" id="cmsSchemaRaw" name="cmsSchemaRaw" value="${esc(cmsSchema)}" />

          <div class="row-2">
            <label>
              Base HTML Template (use placeholders like <code>{{hero.title}}</code>)
              <textarea id="baseHtmlTemplate" name="baseHtmlTemplate">${esc(baseHtmlTemplate)}</textarea>
            </label>
            <label>
              Preview Data JSON (fillable values)
              <textarea id="previewDataRaw" name="previewDataRaw">${esc(previewDataRaw)}</textarea>
              <div class="actions" style="justify-content:flex-start;">
                <button type="button" id="reset-preview-data" class="btn">Reset From Schema Defaults</button>
              </div>
            </label>
          </div>
          <div>
            <p class="muted">Live Preview</p>
            <iframe id="livePreview" class="preview-frame"></iframe>
          </div>

          <div class="actions">
            <button class="btn btn-primary" type="submit">${input.mode === 'create' ? 'Create Template' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
      ${builderScript()}
    `,
  );
}

