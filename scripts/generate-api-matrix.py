#!/usr/bin/env python3
"""
Belooga Backend API Matrix & Catalog Generator
Generates an interactive, standalone offline HTML dashboard from openapi.json.
Provides search, method filters, domain filtering, and request/response schema previews.
"""

import json
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
OPENAPI_JSON = ROOT_DIR / "docs" / "architecture" / "openapi.json"
OUTPUT_HTML = ROOT_DIR / "docs" / "architecture" / "backend_api_matrix.html"


def generate_html(openapi_data: dict) -> str:
    paths = openapi_data.get("paths", {})
    components = openapi_data.get("components", {}).get("schemas", {})
    
    # Extract flattened endpoint list
    endpoints = []
    domains = set()
    
    for path, methods in sorted(paths.items()):
        for method, op in methods.items():
            method_upper = method.upper()
            summary = op.get("summary", path)
            tags = op.get("tags", ["General"])
            domain = tags[0] if tags else "General"
            domains.add(domain)
            
            operation_id = op.get("operationId", "")
            parameters = op.get("parameters", [])
            security = op.get("security", [])
            auth_required = bool(security)
            
            # Request body schema
            req_body = op.get("requestBody", {})
            req_schema_ref = None
            if req_body:
                content = req_body.get("content", {})
                app_json = content.get("application/json", {}) or content.get("multipart/form-data", {})
                schema = app_json.get("schema", {})
                req_schema_ref = schema.get("$ref", "")
                if req_schema_ref:
                    req_schema_ref = req_schema_ref.split("/")[-1]
            
            # Responses
            responses = op.get("responses", {})
            resp_codes = list(responses.keys())
            
            endpoints.append({
                "method": method_upper,
                "path": path,
                "summary": summary,
                "domain": domain,
                "auth_required": auth_required,
                "parameters": parameters,
                "req_schema_name": req_schema_ref,
                "resp_codes": resp_codes,
                "description": op.get("description", "")
            })
            
    endpoints_json = json.dumps(endpoints)
    components_json = json.dumps(components)
    domains_sorted = sorted(list(domains))

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Belooga Backend API Matrix & Architecture Catalog</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      background-color: #0b0f19;
      background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 24px 24px;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 30px 40px;
      line-height: 1.5;
    }}
    header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 20px;
    }}
    .title-area h1 {{
      font-size: 24px;
      font-weight: 700;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 10px;
    }}
    .title-area p {{
      color: #94a3b8;
      font-size: 13px;
      margin-top: 6px;
    }}
    .quick-links {{
      display: flex;
      gap: 10px;
    }}
    .btn-link {{
      background: rgba(30, 41, 59, 0.8);
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 12px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
    }}
    .btn-link:hover {{
      background: #0284c7;
      color: #ffffff;
      border-color: #38bdf8;
    }}
    .stats-bar {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }}
    .stat-card {{
      background: rgba(17, 24, 39, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 14px 18px;
    }}
    .stat-card .num {{
      font-size: 22px;
      font-weight: 700;
      color: #38bdf8;
    }}
    .stat-card .lbl {{
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }}
    .controls-panel {{
      background: rgba(17, 24, 39, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      align-items: center;
    }}
    .search-box {{
      flex: 1;
      min-width: 260px;
    }}
    .search-box input {{
      width: 100%;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 8px 14px;
      color: #f8fafc;
      font-size: 13px;
      outline: none;
    }}
    .search-box input:focus {{
      border-color: #38bdf8;
    }}
    .filter-group {{
      display: flex;
      gap: 6px;
      align-items: center;
    }}
    .filter-btn {{
      background: #1e293b;
      color: #94a3b8;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }}
    .filter-btn:hover {{
      background: #334155;
      color: #f8fafc;
    }}
    .filter-btn.active {{
      background: #0284c7;
      color: #ffffff;
      border-color: #38bdf8;
    }}
    .select-dropdown {{
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 12px;
      outline: none;
    }}
    .api-grid {{
      display: flex;
      flex-direction: column;
      gap: 12px;
    }}
    .api-card {{
      background: rgba(17, 24, 39, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 16px 20px;
      transition: border-color 0.2s;
    }}
    .api-card:hover {{
      border-color: rgba(56, 189, 248, 0.4);
    }}
    .api-header {{
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      user-select: none;
    }}
    .method-badge {{
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      min-width: 58px;
      text-align: center;
    }}
    .method-GET {{ background: rgba(2, 132, 199, 0.2); color: #38bdf8; border: 1px solid rgba(2, 132, 199, 0.4); }}
    .method-POST {{ background: rgba(22, 163, 74, 0.2); color: #4ade80; border: 1px solid rgba(22, 163, 74, 0.4); }}
    .method-PATCH {{ background: rgba(217, 119, 6, 0.2); color: #fbbf24; border: 1px solid rgba(217, 119, 6, 0.4); }}
    .method-DELETE {{ background: rgba(220, 38, 38, 0.2); color: #f87171; border: 1px solid rgba(220, 38, 38, 0.4); }}
    .path-text {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 14px;
      font-weight: 600;
      color: #f8fafc;
      flex: 1;
    }}
    .summary-text {{
      color: #94a3b8;
      font-size: 13px;
    }}
    .domain-tag {{
      background: rgba(30, 41, 59, 0.6);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
    }}
    .auth-badge {{
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }}
    .auth-req {{ background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }}
    .auth-pub {{ background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }}
    .api-details {{
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 13px;
      display: none;
    }}
    .api-card.expanded .api-details {{
      display: block;
    }}
    .schema-block {{
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      color: #e2e8f0;
      max-height: 250px;
      overflow-y: auto;
      margin-top: 6px;
      white-space: pre-wrap;
    }}
    .copy-btn {{
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
    }}
    .copy-btn:hover {{
      color: #38bdf8;
      background: rgba(255, 255, 255, 0.05);
    }}
  </style>
</head>
<body>

  <header>
    <div class="title-area">
      <h1>🐋 Belooga Backend API Matrix & Catalog</h1>
      <p>Authoritative Offline API Documentation for 38 Endpoints across 8 Business Domains (FastAPI + SQLAlchemy 2.0 Async)</p>
    </div>
    <div class="quick-links">
      <a href="http://localhost:8000/docs" target="_blank" class="btn-link">⚡ Live Swagger UI</a>
      <a href="http://localhost:8000/redoc" target="_blank" class="btn-link">📖 Live ReDoc</a>
      <a href="./openapi.json" download class="btn-link">⬇️ openapi.json</a>
    </div>
  </header>

  <div class="stats-bar">
    <div class="stat-card">
      <div class="num" id="stat-total">38</div>
      <div class="lbl">Total API Endpoints</div>
    </div>
    <div class="stat-card">
      <div class="num">8</div>
      <div class="lbl">Service Domains</div>
    </div>
    <div class="stat-card">
      <div class="num">24</div>
      <div class="lbl">PostgreSQL Tables</div>
    </div>
    <div class="stat-card">
      <div class="num">100%</div>
      <div class="lbl">Async Non-Blocking (ADR-003)</div>
    </div>
  </div>

  <div class="controls-panel">
    <div class="search-box">
      <input type="text" id="search-input" placeholder="🔍 Search endpoint by path, summary, or keyword..." />
    </div>

    <div class="filter-group">
      <button class="filter-btn active" data-method="ALL">ALL</button>
      <button class="filter-btn" data-method="GET">GET</button>
      <button class="filter-btn" data-method="POST">POST</button>
      <button class="filter-btn" data-method="PATCH">PATCH</button>
      <button class="filter-btn" data-method="DELETE">DELETE</button>
    </div>

    <select id="domain-select" class="select-dropdown">
      <option value="ALL">All Domains ({len(domains_sorted)})</option>
      {"".join([f'<option value="{d}">{d}</option>' for d in domains_sorted])}
    </select>

    <select id="auth-select" class="select-dropdown">
      <option value="ALL">All Auth States</option>
      <option value="AUTH">🔒 Auth Required</option>
      <option value="PUBLIC">🔓 Public / Optional</option>
    </select>
  </div>

  <div class="api-grid" id="api-grid">
    <!-- Populated by JavaScript -->
  </div>

  <script>
    const endpoints = {endpoints_json};
    const schemas = {components_json};

    let currentMethod = 'ALL';
    let currentDomain = 'ALL';
    let currentAuth = 'ALL';
    let searchQuery = '';

    function render() {{
      const grid = document.getElementById('api-grid');
      grid.innerHTML = '';

      const filtered = endpoints.filter(ep => {{
        if (currentMethod !== 'ALL' && ep.method !== currentMethod) return false;
        if (currentDomain !== 'ALL' && ep.domain !== currentDomain) return false;
        if (currentAuth === 'AUTH' && !ep.auth_required) return false;
        if (currentAuth === 'PUBLIC' && ep.auth_required) return false;
        if (searchQuery) {{
          const q = searchQuery.toLowerCase();
          const matchPath = ep.path.toLowerCase().includes(q);
          const matchSum = ep.summary.toLowerCase().includes(q);
          const matchDomain = ep.domain.toLowerCase().includes(q);
          if (!matchPath && !matchSum && !matchDomain) return false;
        }}
        return true;
      }});

      document.getElementById('stat-total').textContent = filtered.length;

      if (filtered.length === 0) {{
        grid.innerHTML = '<div style="text-align:center; padding: 40px; color: #64748b;">No endpoints matched your filter criteria.</div>';
        return;
      }}

      filtered.forEach((ep, idx) => {{
        const card = document.createElement('div');
        card.className = 'api-card';

        const authClass = ep.auth_required ? 'auth-req' : 'auth-pub';
        const authLabel = ep.auth_required ? '🔒 Bearer JWT' : '🔓 Public';

        let paramsHtml = '';
        if (ep.parameters && ep.parameters.length > 0) {{
          paramsHtml = `<div style="margin-top: 8px;"><b>Parameters:</b> ` + 
            ep.parameters.map(p => `<code style="background:#1e293b; padding:2px 6px; border-radius:3px;">${{p.name}} (${{p.in}})</code>`).join(' ') +
            `</div>`;
        }}

        let schemaHtml = '';
        if (ep.req_schema_name && schemas[ep.req_schema_name]) {{
          const schemaObj = schemas[ep.req_schema_name];
          schemaHtml = `<div style="margin-top: 10px;">
            <b>Request Body Model:</b> <code style="color:#38bdf8;">${{ep.req_schema_name}}</code>
            <div class="schema-block">${{JSON.stringify(schemaObj.properties || schemaObj, null, 2)}}</div>
          </div>`;
        }}

        card.innerHTML = `
          <div class="api-header" onclick="this.parentElement.classList.toggle('expanded')">
            <span class="method-badge method-${{ep.method}}">${{ep.method}}</span>
            <span class="path-text">${{ep.path}}</span>
            <span class="summary-text">${{ep.summary}}</span>
            <span class="domain-tag">${{ep.domain}}</span>
            <span class="auth-badge ${{authClass}}">${{authLabel}}</span>
            <button class="copy-btn" onclick="event.stopPropagation(); navigator.clipboard.writeText('${{ep.path}}'); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy', 1500);">Copy</button>
          </div>
          <div class="api-details">
            <div><b>Responses:</b> ${{ep.resp_codes.map(c => `<span style="background:#1e293b; color:#4ade80; padding:2px 6px; border-radius:3px; font-weight:600; font-size:11px;">HTTP ${{c}}</span>`).join(' ')}}</div>
            ${{paramsHtml}}
            ${{schemaHtml}}
          </div>
        `;
        grid.appendChild(card);
      }});
    }}

    // Filter Listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {{
      btn.addEventListener('click', (e) => {{
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentMethod = e.target.dataset.method;
        render();
      }});
    }});

    document.getElementById('domain-select').addEventListener('change', (e) => {{
      currentDomain = e.target.value;
      render();
    }});

    document.getElementById('auth-select').addEventListener('change', (e) => {{
      currentAuth = e.target.value;
      render();
    }});

    document.getElementById('search-input').addEventListener('input', (e) => {{
      searchQuery = e.target.value.trim();
      render();
    }});

    render();
  </script>
</body>
</html>
"""
    return html


def main():
    if not OPENAPI_JSON.exists():
        print(f"[!] openapi.json not found at {OPENAPI_JSON}")
        return

    with open(OPENAPI_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    html_content = generate_html(data)
    OUTPUT_HTML.write_text(html_content, encoding="utf-8")
    print(f"[✓] Successfully generated {OUTPUT_HTML}")


if __name__ == "__main__":
    main()
