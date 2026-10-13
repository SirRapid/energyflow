<script lang="ts">
  import FilePreview from './FilePreview.svelte';
  import NodeShell from './NodeShell.svelte';
  import { tick } from 'svelte';
  import { fileBankActions as actions } from '../fileBankContext';
  import { NodeResizer, useSvelteFlow, type NodeProps } from '@xyflow/svelte';
  import type { BankFile, BankFolder } from '../types';

  let { id, data, selected }: NodeProps = $props();
  const { getNode, updateNodeData } = useSvelteFlow();
  const bankFileDragType = 'application/x-energy-flow-bank-file';
  let picker: HTMLInputElement;
  let folderPicker: HTMLInputElement;
  let folderDialog: HTMLDialogElement;
  let folderName = $state('');
  let currentFolderId = $state<string | null>(null);
  let menu: HTMLDivElement;
  let transferDialog: HTMLDialogElement;
  let menuFileId = $state<string | null>(null);
  let focusedId = $state<string | null>(null);
  let destinationId = $state('');
  let message = $state('');
  let menuX = $state(0);
  let menuY = $state(0);
  let dragDepth = $state(0);
  let files = $derived((data.files ?? []) as BankFile[]);
  let folders = $derived((data.folders ?? []) as BankFolder[]);
  let visibleFiles = $derived(files.filter(entry => (entry.folderId ?? null) === currentFolderId));
  let visibleFolders = $derived(folders.filter(folder => folder.parentId === currentFolderId));
  let focusedIndex = $derived(visibleFiles.findIndex(entry => entry.id === focusedId));
  let openedFile = $derived(focusedIndex >= 0 ? visibleFiles[focusedIndex] : null);
  let breadcrumbs = $derived.by(() => {
    const path: BankFolder[] = [];
    let folder = folders.find(folder => folder.id === currentFolderId);
    const seen = new Set<string>();
    while (folder && !seen.has(folder.id)) {
      seen.add(folder.id); path.unshift(folder);
      const parentId: string | null = folder.parentId;
      folder = folders.find(item => item.id === parentId);
    }
    return path;
  });

  function openFolder(folderId: string | null) {
    currentFolderId = folderId;
    focusedId = null;
    message = '';
  }

  function createFolder() {
    const name = folderName.trim();
    if (!name) return;
    if (visibleFolders.some(folder => folder.name.toLowerCase() === name.toLowerCase())) {
      message = 'A folder with that name already exists here.';
      folderDialog.close();
      return;
    }
    updateNodeData(id, node => ({ folders: [...((node.data.folders ?? []) as BankFolder[]), {
      id: crypto.randomUUID(), name, parentId: currentFolderId, addedAt: new Date().toISOString(),
    }] }));
    folderDialog.close();
    message = '';
  }

  function importFolder(incoming: FileList | null) {
    if (!incoming?.length) { message = 'No files were selected.'; return; }
    const addedFolders: BankFolder[] = [];
    const addedFiles: BankFile[] = [];
    const paths = new Map<string, string>();
    const addedAt = new Date().toISOString();
    for (const file of Array.from(incoming)) {
      const parts = file.webkitRelativePath.split('/').filter(Boolean);
      parts.pop();
      let parentId = currentFolderId;
      let path = '';
      for (const name of parts) {
        path += '/' + name;
        let folderId = paths.get(path);
        if (!folderId) {
          folderId = crypto.randomUUID();
          paths.set(path, folderId);
          addedFolders.push({ id: folderId, name, parentId, addedAt });
        }
        parentId = folderId;
      }
      addedFiles.push({ id: crypto.randomUUID(), file, addedAt, folderId: parentId });
    }
    updateNodeData(id, node => ({
      folders: [...((node.data.folders ?? []) as BankFolder[]), ...addedFolders],
      files: [...((node.data.files ?? []) as BankFile[]), ...addedFiles],
    }));
    focusedId = null;
    message = '';
  }
  let menuFile = $derived(files.find(entry => entry.id === menuFileId));
  let destinations = $derived(actions.destinations());

  function appendFile(file: File) {
    const entry: BankFile = { id: crypto.randomUUID(), file, addedAt: new Date().toISOString(), folderId: currentFolderId };
    updateNodeData(id, node => ({ files: [...((node.data.files ?? []) as BankFile[]), entry] }));
  }

  function deleteFile(entry: BankFile) {
    updateNodeData(id, node => ({ files: ((node.data.files ?? []) as BankFile[]).filter(file => file.id !== entry.id) }));
    if (focusedId === entry.id) focusedId = null;
  }

  async function openMenu(event: MouseEvent, entry: BankFile) {
    menuFileId = entry.id;
    const bounds = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
    menuX = Math.max(8, Math.min(bounds.right - 240, window.innerWidth - 248));
    menuY = Math.max(8, Math.min(bounds.bottom + 4, window.innerHeight - 330));
    await tick();
    menu.showPopover();
    menu.querySelector('button')?.focus();
  }

  function closeMenu() { menu.hidePopover(); }

  function navigate(offset: number) {
    const entry = visibleFiles[focusedIndex + offset];
    if (entry) focusedId = entry.id;
  }

  function pasteFile() {
    if (!actions.clipboard) return;
    appendFile(actions.clipboard);
    focusedId = null;
    message = 'File pasted.';
  }

  function transferFile() {
    if (!menuFile) return;
    if (!actions.transfer(destinationId, { ...menuFile, folderId: null })) {
      message = 'Choose an available property.';
      return;
    }
    deleteFile(menuFile);
    transferDialog.close();
    message = 'File moved to the selected property.';
  }

  function addFiles(incoming: FileList | null, folderId = currentFolderId) {
    if (!incoming?.length) return;
    message = '';
    const addedAt = new Date().toISOString();
    const added = Array.from(incoming, file => ({ id: crypto.randomUUID(), file, addedAt, folderId }));
    updateNodeData(id, node => ({ files: [...((node.data.files ?? []) as BankFile[]), ...added] }));
  }

  function startFileDrag(event: DragEvent, entry: BankFile) {
    if (!event.dataTransfer) return;
    event.stopPropagation();
    event.dataTransfer.setData(bankFileDragType, JSON.stringify({ bankId: id, fileId: entry.id }));
    event.dataTransfer.effectAllowed = 'move';
  }

  function hasFiles(event: DragEvent) {
    const types = event.dataTransfer?.types ?? [];
    return types.includes('Files') || types.includes(bankFileDragType);
  }

  function moveBankFile(payload: string, folderId = currentFolderId) {
    let source: { bankId?: string; fileId?: string };
    try { source = JSON.parse(payload); } catch { return; }
    if (!source || typeof source.bankId !== 'string' || typeof source.fileId !== 'string') return;
    const sourceBank = getNode(source.bankId);
    if (sourceBank?.type !== 'fileBank') return;
    const entry = ((sourceBank.data.files ?? []) as BankFile[]).find(file => file.id === source.fileId);
    if (!entry) return;
    if (source.bankId === id) {
      if ((entry.folderId ?? null) === folderId) return;
      updateNodeData(id, node => ({ files: ((node.data.files ?? []) as BankFile[])
        .map(file => file.id === entry.id ? { ...file, folderId } : file) }));
      focusedId = null;
      message = 'File moved to folder.';
      return;
    }

    // Keep the file's original date; give the destination entry a fresh ID.
    updateNodeData(id, node => ({ files: [
      ...((node.data.files ?? []) as BankFile[]),
      { ...entry, id: crypto.randomUUID(), folderId },
    ] }));
    updateNodeData(source.bankId, node => ({
      files: ((node.data.files ?? []) as BankFile[]).filter(file => file.id !== entry.id),
    }));
    focusedId = null;
    message = `Moved ${entry.file.name} into this bank.`;
  }

  function dragEnter(event: DragEvent) {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dragDepth += 1;
  }

  function dragOver(event: DragEvent) {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = event.dataTransfer.types.includes(bankFileDragType) ? 'move' : 'copy';
    }
  }

  function dragLeave(event: DragEvent) {
    event.stopPropagation();
    dragDepth = Math.max(0, dragDepth - 1);
  }

  function dropFiles(event: DragEvent, folderId = currentFolderId) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth = 0;
    const payload = event.dataTransfer?.getData(bankFileDragType);
    if (payload) moveBankFile(payload, folderId);
    else {
      const hasDirectory = Array.from(event.dataTransfer?.items ?? []).some(item => item.webkitGetAsEntry?.()?.isDirectory);
      if (hasDirectory) { message = 'Use Import folder to include folders and their contents.'; return; }
      addFiles(event.dataTransfer?.files ?? null, folderId);
    }
  }

  function fileType(file: File) {
    const dot = file.name.lastIndexOf('.');
    return dot > 0 && dot < file.name.length - 1
      ? file.name.slice(dot + 1).toUpperCase()
      : file.type || 'File';
  }

  function fileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KiB', 'MiB', 'GiB', 'TiB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)) - 1, units.length - 1);
    return `${(bytes / 1024 ** (index + 1)).toFixed(1)} ${units[index]}`;
  }

  function download(entry: BankFile) {
    const url = URL.createObjectURL(entry.file);
    const link = document.createElement('a');
    link.href = url;
    link.download = entry.file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
</script>

<NodeResizer minWidth={420} minHeight={400} isVisible={selected} color="var(--accent)" />

<NodeShell {id} label={String(data.label ?? 'File Bank')}>
<section
  class="file-bank"
  class:drag-over={dragDepth > 0}
  aria-label="File Bank"
  ondragenter={dragEnter}
  ondragover={dragOver}
  ondragleave={dragLeave}
  ondrop={event => dropFiles(event)}
>
  <header class="file-bank-header">
    <div class="file-bank-heading">
      <span class="file-bank-kind">File Bank</span>
      <input
        class="file-bank-name nodrag nopan"
        aria-label="File Bank name"
        value={String(data.label ?? 'File Bank')}
        placeholder="File Bank"
        oninput={event => updateNodeData(id, { label: event.currentTarget.value })}
        onblur={event => updateNodeData(id, { label: event.currentTarget.value.trim() || 'File Bank' })}
      />
    </div>
    {#if actions.clipboard}
      <button class="nodrag nopan file-bank-paste" title="Paste copied file into this bank" onclick={pasteFile}>Paste</button>
    {/if}
    <button class="file-bank-add nodrag nopan" aria-label="Add files" title="Add files" onclick={() => picker.click()}>+</button>
    <input
      bind:this={picker}
      class="file-bank-picker"
      type="file"
      multiple
      aria-label="Choose files"
      onchange={event => {
        addFiles(event.currentTarget.files);
        event.currentTarget.value = '';
      }}
    />
  </header>

  <div class="folder-tools nodrag nopan">
    <button onclick={() => { folderName = ''; folderDialog.showModal(); }}>New folder</button>
    <button onclick={() => folderPicker.click()}>Import folder</button>
    <input bind:this={folderPicker} class="file-bank-picker" type="file" webkitdirectory multiple aria-label="Choose folder" onchange={event => { importFolder(event.currentTarget.files); event.currentTarget.value = ''; }} />
  </div>
  <nav class="breadcrumbs nodrag nopan" aria-label="Folder path">
    <button onclick={() => openFolder(null)} ondragover={dragOver} ondrop={event => dropFiles(event, null)}>File Bank</button>
    {#each breadcrumbs as folder (folder.id)}
      <span>/</span><button onclick={() => openFolder(folder.id)} ondragover={dragOver} ondrop={event => dropFiles(event, folder.id)}>{folder.name}</button>
    {/each}
  </nav>

  {#if openedFile}
    <nav class="file-bank-navigation nodrag nopan" aria-label="File navigation">
      <button onclick={() => focusedId = null}>Back to folder</button>
      {#if visibleFiles.length > 1}
        <span>{focusedIndex + 1} of {visibleFiles.length}</span>
        <button aria-label="Previous file" disabled={focusedIndex === 0} onclick={() => navigate(-1)}>←</button>
        <button aria-label="Next file" disabled={focusedIndex === visibleFiles.length - 1} onclick={() => navigate(1)}>→</button>
      {/if}
      <button class="file-bank-menu-button" aria-label={`Options for ${openedFile.file.name}`} onclick={event => openMenu(event, openedFile!)}>☰</button>
    </nav>
    <div class="file-view nodrag nopan nowheel">
      <FilePreview file={openedFile.file} />
    </div>
  {:else}
  <div class="file-bank-list nodrag nopan nowheel">
    <table class="file-bank-table">
      <thead><tr><th scope="col">Name</th><th scope="col">File type</th><th scope="col">Date added</th><th scope="col">Size</th><th scope="col" class="file-bank-actions-heading"><span class="sr-only">Actions</span></th></tr></thead>
      <tbody>
        {#each visibleFolders as folder (folder.id)}
          <tr>
            <td><button class="folder-link" onclick={() => openFolder(folder.id)} ondragover={dragOver} ondrop={event => dropFiles(event, folder.id)}>{folder.name}</button></td>
            <td>Folder</td>
            <td>{new Date(folder.addedAt).toLocaleDateString()}</td>
            <td>—</td><td></td>
          </tr>
        {/each}
        {#each visibleFiles as entry (entry.id)}
          <tr>
            <td><button class="file-bank-file" draggable="true" ondragstart={event => startFileDrag(event, entry)} title={`Click to view ${entry.file.name}; drag to another File Bank`} onclick={() => { focusedId = entry.id; message = ''; }}>{entry.file.name}</button></td>
            <td title={entry.file.type}>{fileType(entry.file)}</td>
            <td><time datetime={entry.addedAt} title={new Date(entry.addedAt).toLocaleString()}>{new Date(entry.addedAt).toLocaleDateString()}</time></td>
            <td>{fileSize(entry.file.size)}</td>
            <td><button class="file-bank-menu-button" aria-label={`Options for ${entry.file.name}`} aria-haspopup="true" onclick={event => openMenu(event, entry)}>☰</button></td>
          </tr>
        {/each}
        {#if !visibleFiles.length && !visibleFolders.length}
          <tr><td colspan="5" class="file-bank-empty">Drop files here or use + to choose files.</td></tr>
        {/if}
      </tbody>
    </table>
  </div>

  {/if}

  <footer class="file-bank-footer" aria-live="polite">
    {dragDepth > 0 ? 'Drop to add files' : message || `${visibleFolders.length} folders · ${visibleFiles.length} files`}
  </footer>
</section>
</NodeShell>


<div bind:this={menu} popover="auto" class="file-actions nodrag nopan nowheel" style:left={`${menuX}px`} style:top={`${menuY}px`} aria-label="File actions">
  {#if menuFile}
    <strong class="file-actions-title">{menuFile.file.name}</strong>
    <button onclick={() => { if (menuFile) appendFile(menuFile.file); closeMenu(); focusedId = null; message = 'File duplicated.'; }}>Duplicate</button>
    <button onclick={() => { if (menuFile) actions.copy(menuFile.file); closeMenu(); message = 'Copied. Use Paste in any File Bank.'; }}>Copy</button>
    <button onclick={() => { if (menuFile) download(menuFile); closeMenu(); }}>Download</button>
    <button disabled title="Browsers cannot reveal the original path of an uploaded file.">Open in File Explorer</button>
    <button onclick={() => { closeMenu(); destinationId = ''; transferDialog.showModal(); }}>Transfer to another property</button>
    <button class="danger" onclick={() => { if (menuFile) deleteFile(menuFile); closeMenu(); message = 'File removed from this bank.'; }}>Delete</button>
  {/if}
</div>

<dialog bind:this={transferDialog} class="file-transfer nodrag nopan nowheel" aria-labelledby={`transfer-title-${id}`}>
  <h2 id={`transfer-title-${id}`}>Transfer file</h2>
  <p>Move this file to the selected property's first File Bank. A bank is created if needed.</p>
  {#if destinations.length}
    <label>Property
      <select bind:value={destinationId}>
        <option value="">Choose a property</option>
        {#each destinations as destination (destination.id)}
          <option value={destination.id}>{destination.name}</option>
        {/each}
      </select>
    </label>
  {:else}
    <p>Create another property first.</p>
  {/if}
  <div class="file-transfer-buttons">
    <button onclick={() => transferDialog.close()}>Cancel</button>
    <button class="primary" disabled={!destinationId} onclick={transferFile}>Move file</button>
  </div>
</dialog>

<dialog bind:this={folderDialog} class="file-transfer nodrag nopan nowheel" aria-labelledby={`folder-title-${id}`}>
  <form onsubmit={event => { event.preventDefault(); createFolder(); }}>
    <h2 id={`folder-title-${id}`}>New folder</h2>
    <label>Folder name<input bind:value={folderName} required /></label>
    <div class="file-transfer-buttons">
      <button type="button" onclick={() => folderDialog.close()}>Cancel</button>
      <button type="submit" class="primary" disabled={!folderName.trim()}>Create folder</button>
    </div>
  </form>
</dialog>

<style>

:global(.svelte-flow__node-fileBank) { min-width: 420px; min-height: 400px; }
.file-bank { display: flex; flex-direction: column; width: 100%; height: 100%; border-radius: inherit; }
.file-bank.drag-over { background: #eaf6f2; box-shadow: inset 0 0 0 2px var(--accent); }
.file-bank-header { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--border); }
.file-bank-heading { flex: 1; min-width: 0; }
.file-bank-kind { display: block; margin-bottom: 4px; color: #526575; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
.file-bank-name { width: 100%; min-height: 0; padding: 4px 6px; border: 1px solid transparent; border-radius: 5px; background: transparent; color: inherit; font-size: 16px; font-weight: 600; }
.file-bank-name:hover { border-color: var(--border); }
.file-bank-name:focus { border-color: var(--accent); outline: 2px solid #bde2d8; }
.file-bank-add { flex-shrink: 0; width: 36px; height: 36px; padding: 0; border: 1px solid var(--border); border-radius: 8px; background: #eaf6f2; color: var(--accent); font-size: 22px; }
.file-bank-picker { display: none; }
.file-bank-list { flex: 1; min-height: 0; overflow: auto; border-radius: 0; }
.file-bank-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 12px; }
.file-bank-table th { position: sticky; top: 0; z-index: 1; background: #f7f9fb; color: #526575; font-weight: 600; }
.file-bank-table th, .file-bank-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); text-align: left; overflow-wrap: anywhere; }
.file-bank-table th:first-child { width: 34%; }
.file-bank-table th:nth-child(2) { width: 16%; }
.file-bank-table th:nth-child(3) { width: 24%; }
.file-bank-table th:nth-child(4) { width: 16%; }
.file-bank-table th:last-child { width: 10%; }
.file-bank-file { display: block; max-width: 100%; padding: 0; border: 0; border-radius: 2px; background: transparent; color: var(--accent); font: inherit; text-align: left; overflow-wrap: anywhere; cursor: grab; }
.file-bank-file:active { cursor: grabbing; }
.file-bank-file:hover { text-decoration: underline; background: transparent; }
.file-bank-table .file-bank-empty { padding: 32px 16px; color: #526575; text-align: center; }
.file-bank-footer { flex-shrink: 0; padding: 10px 18px; border-top: 1px solid var(--border); color: #526575; font-size: 11px; }

  .file-bank-navigation { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border); }
  .file-bank-navigation span { flex: 1; text-align: right; font-size: 12px; color: #526575; }
  .file-bank-navigation button, .file-bank-paste { padding: 6px 8px; font-size: 12px; }
  .file-bank-menu-button { padding: 3px 6px; border: 0; background: transparent; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .file-actions { position: fixed; margin: 0; width: 240px; max-height: min(320px, 90vh); overflow: auto; padding: 8px; border: 1px solid var(--border); border-radius: 10px; background: white; color: #193344; box-shadow: 0 8px 32px #19334426; }
  .file-actions-title { display: block; padding: 8px; font-size: 12px; overflow-wrap: anywhere; }
  .file-actions button { display: block; width: 100%; padding: 9px 10px; border: 0; text-align: left; font-size: 13px; }
  .file-actions .danger { color: #b42318; }
  .file-transfer { width: min(420px, calc(100vw - 32px)); padding: 24px; border: 1px solid var(--border); border-radius: 14px; color: #193344; }
  .file-transfer::backdrop { background: #19334455; }
  .file-transfer select { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font: inherit; }
  .file-transfer-buttons { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
  .folder-tools { display: flex; gap: 8px; padding: 0 16px 8px; }
  .folder-tools button { padding: 5px 8px; font-size: 12px; }
  .breadcrumbs { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 6px 12px; border-block: 1px solid var(--border); }
  .breadcrumbs button { padding: 4px; border: 0; background: transparent; color: var(--accent); font-size: 12px; overflow-wrap: anywhere; }
  .breadcrumbs span { color: #526575; }
  .folder-link { padding: 0; border: 0; background: transparent; text-align: left; font: inherit; font-weight: 600; color: var(--accent); overflow-wrap: anywhere; }
  .file-view { flex: 1; min-height: 0; overflow: hidden; }
</style>
