import { useMemo, useState, useEffect } from 'react';
import { Play, Plus, FileCode, Trash2, FolderPlus, Pencil, Save, X } from 'lucide-react';
import { useOptions } from '/src/utils/optionsContext';
import { useLocation } from 'react-router-dom';
import { createId } from '/src/utils/id';

const STORAGE_KEY = 'ghostCodeRunnerProjects';
const RUN_DOC_KEY = 'ghostCodeRunnerRunDoc';

const createDefaultProject = () => ({
  id: createId(),
  name: 'My Project',
  files: [
    {
      id: createId(),
      name: 'index.html',
      type: 'html',
      content: '<div class="app">\n  <h1>Hello Code Runner</h1>\n  <p>Edit files and run preview.</p>\n</div>',
    },
    {
      id: createId(),
      name: 'styles.css',
      type: 'css',
      content: 'body { font-family: Inter, system-ui, sans-serif; padding: 24px; }\n.app { border: 1px solid #ddd; border-radius: 10px; padding: 16px; }',
    },
    {
      id: createId(),
      name: 'script.js',
      type: 'js',
      content: 'console.log("Code Runner ready");',
    },
  ],
});

const getStoredProjects = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch { }
  return [createDefaultProject()];
};

const CodeRunner = () => {
  const { options } = useOptions();
  const location = useLocation();
  const [projects, setProjects] = useState(() => getStoredProjects());
  const [activeProjectId, setActiveProjectId] = useState('');
  const [activeFileId, setActiveFileId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [renameDraft, setRenameDraft] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('html');
  const [refreshTick, setRefreshTick] = useState(0);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);

  useEffect(() => {
    if (!projects.length) return;
    if (!activeProjectId || !projects.some((p) => p.id === activeProjectId)) {
      setActiveProjectId(projects[0].id);
      setActiveFileId(projects[0].files?.[0]?.id || '');
    }
  }, [projects, activeProjectId]);

  const persistProjects = (next) => {
    setProjects(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch { }
  };

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId],
  );

  const activeFile = useMemo(
    () => activeProject?.files?.find((f) => f.id === activeFileId) || activeProject?.files?.[0],
    [activeProject, activeFileId],
  );

  const updateActiveProject = (updater) => {
    if (!activeProject) return;
    const next = projects.map((project) =>
      project.id === activeProject.id ? updater(project) : project,
    );
    persistProjects(next);
  };

  const createProject = () => {
    const project = createDefaultProject();
    project.name = newProjectName.trim() || `Project ${projects.length + 1}`;
    const next = [...projects, project];
    persistProjects(next);
    setActiveProjectId(project.id);
    setActiveFileId(project.files[0]?.id || '');
    setRenameDraft('');
    setNewProjectName('');
  };

  const saveProject = () => {
    persistProjects([...projects]);
  };

  const renameProject = () => {
    const nextName = renameDraft.trim();
    if (!nextName || !activeProject) return;
    updateActiveProject((project) => ({ ...project, name: nextName }));
    setRenameDraft('');
  };

  const deleteProject = (id) => {
    if (!id) return;
    const next = projects.filter((project) => project.id !== id);
    if (!next.length) {
      const fallbackProject = createDefaultProject();
      persistProjects([fallbackProject]);
      setActiveProjectId(fallbackProject.id);
      setActiveFileId(fallbackProject.files[0]?.id || '');
      setRenameDraft('');
      return;
    }

    persistProjects(next);
    if (activeProjectId === id) {
      setActiveProjectId(next[0].id);
      setActiveFileId(next[0].files?.[0]?.id || '');
      setRenameDraft('');
    }
  };

  const setFileContent = (id, content) => {
    updateActiveProject((project) => ({
      ...project,
      files: project.files.map((f) => (f.id === id ? { ...f, content } : f)),
    }));
  };

  const createFile = () => {
    if (!activeProject) return;
    const type = ['html', 'css', 'js'].includes(newFileType) ? newFileType : 'html';
    const baseName = (newFileName || `new-file.${type}`).trim();
    const finalName = baseName.includes('.') ? baseName : `${baseName}.${type}`;
    const nextFile = { id: createId(), name: finalName, type, content: '' };

    updateActiveProject((project) => ({ ...project, files: [...project.files, nextFile] }));
    setActiveFileId(nextFile.id);
    setNewFileName('');
  };

  const deleteFile = (id) => {
    if (!activeProject || activeProject.files.length <= 1) return;
    const nextFiles = activeProject.files.filter((f) => f.id !== id);
    updateActiveProject((project) => ({ ...project, files: nextFiles }));
    if (activeFileId === id) setActiveFileId(nextFiles[0]?.id || '');
  };

  const html = (activeProject?.files || []).filter((f) => f.type === 'html').map((f) => f.content).join('\n');
  const css = (activeProject?.files || []).filter((f) => f.type === 'css').map((f) => f.content).join('\n');
  const js = (activeProject?.files || []).filter((f) => f.type === 'js').map((f) => f.content).join('\n');

  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>html,body{margin:0;min-height:100%;background:#fff;}*{box-sizing:border-box;}${css}</style></head><body>${html}<script>${js}<\/script></body></html>`;
  const params = new URLSearchParams(location.search);
  const fullscreenRun = params.get('run') === '1' && params.get('ghost') === '1';

  if (fullscreenRun) {
    const runDoc = sessionStorage.getItem(RUN_DOC_KEY) || srcDoc;
    return (
      <div className="h-full w-full bg-black overflow-hidden">
        <iframe
          title="Code Runner Fullscreen"
          sandbox="allow-scripts allow-forms allow-modals"
          srcDoc={runDoc}
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  const runInNewGhostTab = () => {
    try {
      sessionStorage.setItem(RUN_DOC_KEY, srcDoc);
    } catch { }

    const blob = new Blob([srcDoc], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

    try {
      const opener = window.top && window.top !== window ? window.top.__ghostOpenBrowserTab : null;
      if (typeof opener === 'function') {
        const opened = opener(blobUrl);
        if (opened) {
          return;
        }
      }
    } catch { }

    const popup = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!popup) {
      window.location.href = blobUrl;
    }
  };

  const pageBg = options.bgColor || '#0c131d';
  const panelBg = options.quickModalBgColor || '#121c2a';
  const subtleBg = options.omninputColor || '#0d1725';
  const textColor = options.siteTextColor || '#ffffff';

  return (
    <div className="h-full w-full overflow-hidden" style={{ backgroundColor: pageBg, color: textColor }}>
      <div className="h-full grid grid-rows-[auto_1fr] gap-3 p-3">
        <div className="rounded-xl border border-white/10 px-3 py-2.5 flex items-center justify-between" style={{ backgroundColor: panelBg }}>
          <div>
            <p className="text-sm font-semibold">Code Runner</p>
            <p className="text-xs opacity-70">Build and preview HTML, CSS, and JavaScript projects</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProjectModalOpen(true)}
              className="h-9 px-3 rounded-lg bg-[#ffffff14] hover:bg-[#ffffff22] text-sm flex items-center gap-2"
            >
              <FolderPlus size={14} /> Projects
            </button>
            <button
              onClick={() => setLoadModalOpen(true)}
              className="h-9 px-3 rounded-lg bg-[#ffffff14] hover:bg-[#ffffff22] text-sm flex items-center gap-2"
            >
              <FolderPlus size={14} /> Load Project
            </button>
            <button
              onClick={() => setFileModalOpen(true)}
              className="h-9 px-3 rounded-lg bg-[#ffffff14] hover:bg-[#ffffff22] text-sm flex items-center gap-2"
            >
              <Plus size={14} /> New File
            </button>
            <button onClick={saveProject} className="h-9 px-3 rounded-lg bg-[#ffffff14] hover:bg-[#ffffff22] text-sm flex items-center gap-2">
              <Save size={14} /> Save
            </button>
            <button onClick={() => setRefreshTick((v) => v + 1)} className="h-9 px-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold flex items-center gap-2">
              <Play size={13} /> Run
            </button>
            <button onClick={runInNewGhostTab} className="h-9 px-3 rounded-lg bg-[#26384d] hover:bg-[#324b68] text-sm">
              Run in New Tab
            </button>
          </div>
        </div>

        <div className="h-full grid grid-cols-2 gap-3 min-h-0">
          <div className="rounded-xl border border-white/10 overflow-hidden flex flex-col" style={{ backgroundColor: panelBg }}>
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/10 overflow-x-auto">
              {(activeProject?.files || []).map((file) => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`h-8 px-2.5 rounded-md text-xs border flex items-center gap-2 ${activeFileId === file.id ? 'bg-[#ffffff20] border-white/25' : 'bg-[#ffffff0f] border-white/10 hover:bg-[#ffffff16]'}`}
                >
                  <FileCode size={12} />
                  <span className="max-w-[180px] truncate">{file.name}</span>
                  <Trash2
                    size={11}
                    className="opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file.id);
                    }}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={activeFile?.content || ''}
              onChange={(e) => activeFile && setFileContent(activeFile.id, e.target.value)}
              className="flex-1 w-full border-0 p-3 text-sm outline-none"
              style={{ backgroundColor: subtleBg }}
            />
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden flex flex-col" style={{ backgroundColor: panelBg }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <p className="text-sm font-semibold">Preview</p>
              <span className="text-xs opacity-70">{activeProject?.name || 'Project'}</span>
            </div>
            <iframe
              key={refreshTick}
              title="Code Runner Preview"
              sandbox="allow-scripts allow-forms allow-modals"
              srcDoc={srcDoc}
              className="flex-1 w-full bg-white"
            />
          </div>
        </div>
      </div>

      {projectModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55" onClick={() => setProjectModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-white/10 p-4 space-y-3" style={{ backgroundColor: panelBg }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Project Manager</h3>
              <button className="p-1 rounded hover:bg-white/10" onClick={() => setProjectModalOpen(false)}><X size={16} /></button>
            </div>
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name"
              className="w-full h-10 rounded-md border border-white/10 px-3 text-sm"
              style={{ backgroundColor: subtleBg }}
            />
            <button
              onClick={() => {
                createProject();
                setProjectModalOpen(false);
              }}
              className="w-full h-10 rounded-md bg-[#ffffff14] hover:bg-[#ffffff22] text-sm flex items-center justify-center gap-2"
            >
              <FolderPlus size={14} /> Create Project
            </button>

            <input
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              placeholder="Rename active project"
              className="w-full h-10 rounded-md border border-white/10 px-3 text-sm"
              style={{ backgroundColor: subtleBg }}
            />
            <button
              onClick={() => {
                renameProject();
                setProjectModalOpen(false);
              }}
              className="w-full h-10 rounded-md bg-[#ffffff14] hover:bg-[#ffffff22] text-sm flex items-center justify-center gap-2"
            >
              <Pencil size={14} /> Rename Active Project
            </button>
          </div>
        </div>
      )}

      {loadModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55" onClick={() => setLoadModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-white/10 p-4 space-y-3" style={{ backgroundColor: panelBg }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Load Saved Project</h3>
              <button className="p-1 rounded hover:bg-white/10" onClick={() => setLoadModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="max-h-[52vh] overflow-y-auto space-y-2 pr-1">
              {projects.map((project) => {
                const isActive = project.id === activeProjectId;
                return (
                  <div key={project.id} className="rounded-lg border border-white/10 px-3 py-2 flex items-center justify-between gap-3" style={{ backgroundColor: subtleBg }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs opacity-70">{project.files?.length || 0} file(s)</p>
                    </div>
                    <button
                      disabled={isActive}
                      onClick={() => {
                        setActiveProjectId(project.id);
                        setActiveFileId(project.files?.[0]?.id || '');
                        setLoadModalOpen(false);
                      }}
                      className={`h-8 px-3 rounded-md text-xs ${isActive ? 'bg-[#ffffff15] opacity-60 cursor-not-allowed' : 'bg-[#ffffff14] hover:bg-[#ffffff22]'}`}
                    >
                      {isActive ? 'Loaded' : 'Load'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {fileModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55" onClick={() => setFileModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-white/10 p-4 space-y-3" style={{ backgroundColor: panelBg }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Create File</h3>
              <button className="p-1 rounded hover:bg-white/10" onClick={() => setFileModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="New file name"
                className="w-full h-10 rounded-md border border-white/10 px-3 text-sm"
                style={{ backgroundColor: subtleBg }}
              />
              <select
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value)}
                className="w-full h-10 rounded-md border border-white/10 px-2 text-sm outline-none"
                style={{ backgroundColor: subtleBg }}
              >
                <option value="html">html</option>
                <option value="css">css</option>
                <option value="js">js</option>
              </select>
            </div>
            <button
              onClick={() => {
                createFile();
                setFileModalOpen(false);
              }}
              className="w-full h-10 rounded-md bg-[#ffffff14] hover:bg-[#ffffff22] text-sm flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Create File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeRunner;
