import * as vscode from 'vscode';

type Health = { ok: boolean; environment?: string; version?: string } & Record<string, any>;
type SearchHit = { id: string; title?: string; snippet?: string; thread?: string; path?: string; url?: string; score?: number; date?: string; tags?: string[]; source?: string };
type SearchResponse = { ok: boolean; total: number; hits: SearchHit[] };
type SaveResponse = { ok: boolean; data?: { id: string; thread: string; when: string } };

function cfg<T = string>(key: string): T {
  return vscode.workspace.getConfiguration().get<T>(key)!;
}
function baseUrl() { return cfg<string>('yuihub.apiBaseUrl').replace(/\/$/, ''); }
function apiKey() { return cfg<string>('yuihub.apiKey'); }
function defaultThread(context: vscode.ExtensionContext): string | undefined {
  const s = cfg<string>('yuihub.defaultThreadId');
  if (s) return s;
  return context.workspaceState.get<string>('yuihub.thread');
}
function setThread(context: vscode.ExtensionContext, th: string) {
  context.workspaceState.update('yuihub.thread', th);
}
function headers() {
  const h: Record<string,string> = { 'Content-Type': 'application/json' };
  const key = apiKey();
  if (key) h['Authorization'] = `Bearer ${key}`;
  return h;
}
async function get<T>(path: string, params?: Record<string,any>): Promise<T> {
  const url = new URL(baseUrl() + path);
  if (params) Object.entries(params).forEach(([k,v]) => v === undefined ? null : url.searchParams.set(k, String(v)));
  const res = await fetch(url, { method: 'GET', headers: headers() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json() as T;
}
async function post<T>(path: string, body: any): Promise<T> {
  const res = await fetch(baseUrl() + path, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json() as T;
}

export function activate(context: vscode.ExtensionContext) {
  // Smoke Test
  context.subscriptions.push(vscode.commands.registerCommand('yuihub.smokeTest', async () => {
    try {
      const health = await get<Health>('/health');
      const msg = health.ok ? `OK  version=${health.version ?? 'n/a'} env=${health.environment ?? 'n/a'}` : 'Not OK';
      vscode.window.showInformationMessage(`YuiHub /health: ${msg}`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Smoke Test failed: ${e.message}`);
    }
  }));

  // Search
  context.subscriptions.push(vscode.commands.registerCommand('yuihub.search', async () => {
    const q = await vscode.window.showInputBox({ prompt: 'Search YuiHub (q)', placeHolder: '設計 決定 …' });
    if (!q) return;
    try {
      const limit = cfg<number>('yuihub.searchLimit');
      const res = await get<SearchResponse>('/search', { q, limit });
      if (!res.ok || !res.hits?.length) { vscode.window.showInformationMessage('No hits.'); return; }
      const pick = await vscode.window.showQuickPick(res.hits.map(h => ({
        label: h.title || h.snippet?.slice(0,60) || h.id,
        description: `${h.thread || ''}  score:${h.score?.toFixed?.(2) ?? ''}`.trim(),
        detail: h.snippet || '',
        h
      })), { matchOnDetail: true, matchOnDescription: true, placeHolder: `${res.total} hits` });
      if (!pick) return;
      const h = pick.h as SearchHit;
      const text = `// YuiHub Search Hit\n// id: ${h.id}\n// thread: ${h.thread ?? ''}\n// path: ${h.path ?? ''}\n${h.snippet ?? ''}`;
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await editor.edit(ed => ed.insert(editor.selection.active, text));
      } else {
        const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content: text });
        await vscode.window.showTextDocument(doc);
      }
    } catch (e: any) {
      vscode.window.showErrorMessage(`Search failed: ${e.message}`);
    }
  }));

  // Issue new thread
  context.subscriptions.push(vscode.commands.registerCommand('yuihub.issueThread', async () => {
    try {
      const res = await post<{ ok: boolean; data?: { thread: string } }>('/threads/new', {});
      if (!res.ok || !res.data?.thread) throw new Error('No thread returned');
      setThread(context, res.data.thread);
      vscode.window.showInformationMessage(`New thread issued: ${res.data.thread}`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Issue thread failed: ${e.message}`);
    }
  }));

  // Save Selection
  context.subscriptions.push(vscode.commands.registerCommand('yuihub.saveSelection', async () => {
    let th = defaultThread(context);
    if (!th) {
      const input = await vscode.window.showInputBox({ prompt: 'Enter Thread ID (th-...) or leave empty to create new' });
      if (input) {
        th = input;
        setThread(context, th);
      } else {
        // auto issue
        try {
          const res = await post<{ ok: boolean; data?: { thread: string } }>('/threads/new', {});
          if (res.ok && res.data?.thread) { th = res.data.thread; setThread(context, th); }
        } catch {}
      }
    }
    if (!th) { vscode.window.showWarningMessage('No thread set.'); return; }

    const editor = vscode.window.activeTextEditor;
    if (!editor) { vscode.window.showWarningMessage('No active editor.'); return; }
    const text = editor.document.getText(editor.selection) || editor.document.getText();
    if (!text.trim()) { vscode.window.showWarningMessage('No text to save.'); return; }

    const author = cfg<string>('yuihub.defaultAuthor');
    const source = cfg<string>('yuihub.defaultSource');

    try {
      const body = { source, thread: th, author, text };
      const res = await post<SaveResponse>('/save', body);
      if (!res.ok || !res.data) throw new Error('Save failed');
      vscode.window.showInformationMessage(`Saved to ${res.data.thread} (id=${res.data.id})`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Save failed: ${e.message}`);
    }
  }));
}

export function deactivate() {}