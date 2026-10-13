<script lang="ts">
  let { file }: { file: File } = $props();
  let url = $state('');
  let text = $state('');
  let loading = $state(false);
  let failed = $state(false);
  const textLimit = 1024 * 1024;
  const imageTypes: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', avif: 'image/avif', ico: 'image/x-icon' };
  let extension = $derived(file.name.split('.').pop()?.toLowerCase() ?? '');
  let kind = $derived(imageTypes[extension] ? 'image' : extension === 'pdf' || file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('text/') || ['txt', 'csv', 'json', 'md', 'log', 'xml', 'html', 'css', 'js', 'ts', 'yaml', 'yml', 'svg'].includes(extension) ? 'text' : 'unsupported');

  $effect(() => {
    const currentFile = file;
    const currentKind = kind;
    // Force a safe viewer type. HTML and SVG are displayed as escaped text.
    const mime = currentKind === 'image' ? imageTypes[extension] : currentKind === 'pdf' ? 'application/pdf' : 'application/octet-stream';
    const objectUrl = URL.createObjectURL(new Blob([currentFile], { type: mime }));
    url = objectUrl;
    text = '';
    failed = false;
    loading = currentKind === 'text';
    let cancelled = false;
    if (currentKind === 'text') {
      currentFile.slice(0, textLimit).text().then(value => {
        if (!cancelled) { text = value; loading = false; }
      }).catch(() => { if (!cancelled) { failed = true; loading = false; } });
    }
    return () => { cancelled = true; URL.revokeObjectURL(objectUrl); };
  });
</script>

<section class="preview" aria-label={`Preview of ${file.name}`}>
  <header><strong>{file.name}</strong><a href={url} download={file.name}>Download</a></header>
  <div class="preview-body">
    {#if failed}
      <p>This file could not be previewed. Use Download to open it on your computer.</p>
    {:else if kind === 'image' && url}
      <img src={url} alt={file.name} onerror={() => failed = true} />
    {:else if kind === 'pdf' && url}
      <iframe src={url} title={`PDF preview: ${file.name}`}></iframe>
      <p class="hint">If the PDF does not display, use Download.</p>
    {:else if kind === 'text'}
      {#if loading}<p>Loading…</p>{:else}<pre>{text || '(Empty file)'}</pre>{/if}
      {#if file.size > textLimit}<p class="hint">Showing the first 1 MiB. Download to read the full file.</p>{/if}
    {:else}
      <p>Preview is not available for this file type. Use Download to open it on your computer.</p>
    {/if}
  </div>
</section>

<style>
  .preview { display: flex; flex-direction: column; height: 100%; min-height: 0; }
  header { display: flex; align-items: start; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13px; }
  strong { min-width: 0; overflow-wrap: anywhere; }
  a { flex-shrink: 0; color: var(--accent); }
  .preview-body { flex: 1; min-height: 0; overflow: auto; padding: 12px; }
  img { display: block; max-width: 100%; max-height: 100%; margin: auto; object-fit: contain; }
  iframe { display: block; width: 100%; height: 100%; min-height: 220px; border: 0; }
  pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.6 ui-monospace, monospace; color: #193344; }
  p { margin: 8px; font-size: 13px; color: #526575; }
  .hint { font-size: 11px; }
</style>
