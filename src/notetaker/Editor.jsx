import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Highlighter, List, ListOrdered,
  Quote, Code, Code2, Link2, Eraser, Heading1, Heading2, Heading3, Pilcrow, Sigma,
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { renderMathInHtml } from './ai';

const exec = (cmd, val) => {
  try {
    document.execCommand('styleWithCSS', false, false);
    document.execCommand(cmd, false, val);
  } catch { }
};

const wrapSelection = (tag) => {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;
  const anchor = range.commonAncestorContainer.nodeType === 1
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement;
  const existing = anchor?.closest?.(tag);
  if (existing) {

    exec('insertText', sel.toString());
    return;
  }
  const el = document.createElement(tag);
  try {
    range.surroundContents(el);
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(el);
    sel.addRange(r);
  } catch {

    exec('formatBlock', 'pre');
  }
};

const cleanPaste = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((n) => {
    [...n.attributes].forEach((a) => {
      const name = a.name.toLowerCase();
      if (name.startsWith('on') || name === 'style' || name === 'class') n.removeAttribute(a.name);
      if (name === 'href' && !/^(https?:|mailto:|\/)/i.test(a.value)) n.removeAttribute(a.name);
    });
  });
  return doc.body.innerHTML;
};

const Btn = ({ onRun, title, children, active }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onRun(); }}
    className={'nt-tool' + (active ? ' is-active' : '')}
  >
    {children}
  </button>
);

const Editor = ({ noteId, initialHtml, onSave, onInsertHtml }) => {
  const ref = useRef(null);
  const liveBlockRef = useRef(null);
  const [savedAt, setSavedAt] = useState(0);
  const [empty, setEmpty] = useState(!initialHtml);
  const loadedFor = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (loadedFor.current === noteId) return;
    loadedFor.current = noteId;
    liveBlockRef.current = null;
    const source = initialHtml || '';
    const withMath = source && /\\\(|\\\[|\$/.test(source) ? renderMathInHtml(source) : source;
    ref.current.innerHTML = withMath;
    if (withMath !== source) onSave(withMath);
    setEmpty(!initialHtml);

    try {
      const r = document.createRange();
      r.selectNodeContents(ref.current);
      r.collapse(false);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    } catch { }
  }, [noteId, initialHtml]);

  const handleInput = useCallback(() => {
    const html = ref.current?.innerHTML || '';

    onSave(html);
    setEmpty(!(ref.current?.textContent || '').trim());
    setSavedAt(Date.now());
  }, [onSave]);

  const run = (fn) => () => {
    ref.current?.focus();
    fn();
    handleInput();
  };

  const formatBlock = (tag) => {
    exec('formatBlock', `<${tag}>`);

    if (tag !== 'pre' && tag !== 'blockquote') return;
    const root = ref.current;
    const sel = window.getSelection();
    if (!root || !sel?.rangeCount) return;
    let node = sel.getRangeAt(0).startContainer;
    if (node.nodeType !== 1) node = node.parentElement;
    const block = node?.closest?.(tag);
    if (!block || !root.contains(block)) return;
    const next = block.nextElementSibling;
    if (next && ['P', 'DIV'].includes(next.tagName)) return;
    const exit = document.createElement('p');
    exit.innerHTML = '<br>';
    block.after(exit);
  };

  const insertMath = () => {
    const source = window.prompt('LaTeX, for example: e^{i\pi} + 1 = 0');
    if (!source) return;
    const el = ref.current;
    if (!el) return;
    let html = '';
    try {
      html = katex.renderToString(source, { throwOnError: false, displayMode: false });
    } catch {
      return;
    }
    const safe = source.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    el.focus();
    exec('insertHTML', `<span class="nt-math" contenteditable="false" data-latex="${safe}">${html}</span>&nbsp;`);
    handleInput();
  };

  const openEditorLink = (e) => {
    const link = e.target?.closest?.('a[href]');
    if (!link || !ref.current?.contains(link)) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      const url = new URL(link.getAttribute('href'), window.location.href);
      if (['http:', 'https:', 'mailto:'].includes(url.protocol)) {
        window.open(url.href, '_blank', 'noopener,noreferrer');
      }
    } catch { }
  };

  const addLink = () => {
    const url = window.prompt('Link URL');
    if (!url) return;
    const safe = /^(https?:|mailto:|\/)/i.test(url) ? url : `https://${url}`;
    exec('createLink', safe);
  };

  const clearFormatting = () => {
    const sel = window.getSelection();
    const root = ref.current;
    if (!root) return;

    const range = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    if (!range) return;
    const blockSelector = 'p,h1,h2,h3,h4,h5,h6,blockquote,pre,li';
    let blocks = range
      ? Array.from(root.querySelectorAll(blockSelector)).filter((el) => {
          try { return range.intersectsNode(el); } catch { return false; }
        })
      : [];

    if (!blocks.length && range) {
      let el = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
      const block = el?.closest?.(blockSelector);
      if (block && root.contains(block)) blocks = [block];
    }
    if (!blocks.length) blocks = Array.from(root.querySelectorAll(blockSelector));

    const replaceBlock = (el) => {
      if (!['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'].includes(el.tagName)) return el;
      const p = document.createElement('p');
      while (el.firstChild) p.appendChild(el.firstChild);
      el.replaceWith(p);
      return p;
    };

    blocks.forEach((original) => {
      if (!root.contains(original)) return;
      const block = replaceBlock(original);
      Array.from(block.querySelectorAll('strong,b,em,i,u,s,strike,del,mark,code,a,span')).forEach((el) => {
        if (!el.parentNode) return;
        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
        el.remove();
      });
    });

    try {
      root.focus();
      const caret = document.createRange();
      caret.selectNodeContents(root);
      caret.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(caret);
    } catch { }
  };

  useEffect(() => {
    if (!onInsertHtml) return undefined;

    const moveCaretToEnd = () => {
      const el = ref.current;
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    };

    const scrollDown = () => {
      const scroller = ref.current?.closest('.nt-canvas-scroll');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    };

    onInsertHtml.current = {
      beginTranscript: () => {
        const el = ref.current;
        if (!el) return false;
        const block = document.createElement('p');
        block.setAttribute('data-nt-live', '1');
        el.appendChild(block);
        liveBlockRef.current = block;
        handleInput();
        return true;
      },
      setTranscript: (text) => {
        const el = ref.current;
        if (!el) return false;
        let block = liveBlockRef.current;
        if (!block || !el.contains(block)) {
          block = document.createElement('p');
          block.setAttribute('data-nt-live', '1');
          el.appendChild(block);
          liveBlockRef.current = block;
        }
        block.textContent = String(text || '');
        handleInput();
        scrollDown();
        return true;
      },
      insertHtml: (html) => {
        const el = ref.current;
        if (!el) return false;
        el.focus();
        try { moveCaretToEnd(); } catch { }
        exec('insertHTML', renderMathInHtml(html));
        handleInput();
        scrollDown();
        return true;
      },
      appendTranscript: (text) => {
        const el = ref.current;
        if (!el) return false;
        const t = String(text || '').trim();
        if (!t) return true;
        let block = liveBlockRef.current;
        if (!block || !el.contains(block)) block = null;
        if (!block) {
          block = document.createElement('p');
          block.setAttribute('data-nt-live', '1');
          el.appendChild(block);
          liveBlockRef.current = block;
        }
        block.textContent = block.textContent ? `${block.textContent} ${t}` : t;
        handleInput();
        scrollDown();
        return true;
      },
      replaceAll: (html) => {
        const el = ref.current;
        if (!el) return false;
        el.innerHTML = renderMathInHtml(html);
        liveBlockRef.current = null;
        handleInput();
        scrollDown();
        return true;
      },
      replaceTranscript: (html) => {
        const el = ref.current;
        if (!el) return false;
        const block = liveBlockRef.current;
        if (block) block.remove();
        liveBlockRef.current = null;
        el.focus();
        try { moveCaretToEnd(); } catch { }
        exec('insertHTML', renderMathInHtml(html));
        handleInput();
        scrollDown();
        return true;
      },
      getText: () => ref.current?.innerText || '',
    };

    return () => { onInsertHtml.current = null; };
  }, [onInsertHtml, handleInput]);

  const savedLabel = savedAt ? 'Saved' : '';

  return (
    <div className="nt-editor">
      <div className="nt-toolbar">
        <Btn title="Paragraph" onRun={run(() => exec('formatBlock', '<p>'))}><Pilcrow size={15} /></Btn>
        <Btn title="Heading 1" onRun={run(() => exec('formatBlock', '<h1>'))}><Heading1 size={15} /></Btn>
        <Btn title="Heading 2" onRun={run(() => exec('formatBlock', '<h2>'))}><Heading2 size={15} /></Btn>
        <Btn title="Heading 3" onRun={run(() => exec('formatBlock', '<h3>'))}><Heading3 size={15} /></Btn>
        <span className="nt-sep" />
        <Btn title="Bold" onRun={run(() => exec('bold'))}><Bold size={15} /></Btn>
        <Btn title="Italic" onRun={run(() => exec('italic'))}><Italic size={15} /></Btn>
        <Btn title="Underline" onRun={run(() => exec('underline'))}><Underline size={15} /></Btn>
        <Btn title="Strikethrough" onRun={run(() => exec('strikeThrough'))}><Strikethrough size={15} /></Btn>
        <Btn title="Highlight" onRun={run(() => wrapSelection('mark'))}><Highlighter size={15} /></Btn>
        <span className="nt-sep" />
        <Btn title="Bullet list" onRun={run(() => exec('insertUnorderedList'))}><List size={15} /></Btn>
        <Btn title="Numbered list" onRun={run(() => exec('insertOrderedList'))}><ListOrdered size={15} /></Btn>
        <Btn title="Quote" onRun={run(() => formatBlock('blockquote'))}><Quote size={15} /></Btn>
        <Btn title="Code block" onRun={run(() => formatBlock('pre'))}><Code2 size={15} /></Btn>
        <Btn title="Inline code" onRun={run(() => wrapSelection('code'))}><Code size={15} /></Btn>
        <Btn title="Link" onRun={run(addLink)}><Link2 size={15} /></Btn>
        <Btn title="Equation (LaTeX)" onRun={run(insertMath)}><Sigma size={15} /></Btn>
        <span className="nt-sep" />
        <Btn title="Clear formatting" onRun={run(clearFormatting)}><Eraser size={15} /></Btn>
        <span className="nt-grow" />
        {savedLabel && <span className="nt-saved">{savedLabel}</span>}
      </div>

      <div className="nt-canvas-scroll">
        <div
          ref={ref}
          className="nt-canvas"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onClick={openEditorLink}
          onInput={handleInput}
          onPaste={(e) => {
            const html = e.clipboardData?.getData('text/html');
            const text = e.clipboardData?.getData('text/plain');
            if (html) {
              e.preventDefault();
              exec('insertHTML', cleanPaste(html));
              handleInput();
            } else if (text) {
              e.preventDefault();
              exec('insertText', text);
              handleInput();
            }
          }}
          onDrop={(e) => e.preventDefault()}
        />
        {empty && (
          <div className="nt-placeholder">
            Start typing. Use the toolbar for headings, lists and highlights. Everything saves as you type.
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
