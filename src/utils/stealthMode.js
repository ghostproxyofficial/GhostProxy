const charMap = {
  a: ['а', 'ɑ', 'α'], b: ['Ь', 'ḃ'], c: ['с', 'ϲ', 'ᴄ'], d: ['ԁ', 'ⅾ', 'ժ'],
  e: ['е', 'ҽ', '℮'], f: ['f', 'ẝ'], g: ['ɡ', 'ց'], h: ['һ', 'հ'],
  i: ['і', 'i', 'ӏ'], j: ['ј', 'ϳ'], k: ['κ', 'k'], l: ['ӏ', 'l', 'ⅼ'],
  m: ['м', 'm'], n: ['ո', 'n'], o: ['о', 'ο', 'օ'], p: ['р', 'p', 'ρ'],
  q: ['q', 'ԛ'], r: ['г', 'r'], s: ['ѕ', 's'], t: ['т', 't'],
  u: ['u', 'υ', 'ս'], v: ['v', 'ν'], w: ['w', 'ԝ'], x: ['х', 'x'],
  y: ['у', 'y', 'ү'], z: ['z', 'ʐ'],
  A: ['А', 'Α'], B: ['В', 'Β'], C: ['С', 'Ϲ'], D: ['D', 'Ⅾ'],
  E: ['Е', 'Ꭼ', 'Ε'], F: ['F'], G: ['G', 'Ԍ'], H: ['Н', 'Η'],
  I: ['І', 'Ι'], J: ['Ј'], K: ['Κ', 'K'], L: ['L', 'Ⅼ'],
  M: ['М', 'Μ'], N: ['Ν', 'N'], O: ['О', 'Ο'], P: ['Р', 'Ρ'],
  Q: ['Q', 'Ԛ'], R: ['Ꮢ', 'R'], S: ['Ѕ', 'S'], T: ['Т', 'Ꭲ', 'Τ'],
  U: ['U'], V: ['V', 'Ⅴ'], W: ['W', 'Ԝ'], X: ['Х', 'Χ'],
  Y: ['Υ', 'Y'], Z: ['Z', 'Ζ']
};

const reverseMap = {};
Object.entries(charMap).forEach(([k, arr]) => {
  arr.forEach(v => {
    reverseMap[v] = k;
  });
});

export const obfuscateStr = (str, level) => {
  if (!str || level === 0) return str;
  let res = '';
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    // convert back to the original first in case its already obfuscated, stops double mapping
    const baseChar = reverseMap[char] || char;

    if (charMap[baseChar]) {
      const choices = charMap[baseChar];
      const randChar = choices[Math.floor(Math.random() * choices.length)];
      if (level === 2) {
        res += randChar;
      } else if (level === 1) {
        count++;
        res += count % 2 === 0 ? randChar : baseChar;
      }
    } else {
      res += baseChar;
    }
  }
  return res;
};

export const deobfuscateStr = (str) => {
  if (!str) return str;
  let res = '';
  for (let i = 0; i < str.length; i++) {
    res += reverseMap[str[i]] || str[i];
  }
  return res;
};

let stealthObserver = null;
let currentLevel = 0;
let isMutating = false;

const processNode = (node) => {
  if (!node.nodeValue || node.nodeValue.trim() === '') return;
  if (window.location.pathname.startsWith('/code')) return;
  const parentTag = node.parentElement?.tagName;
  if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'TITLE'].includes(parentTag)) return;
  if (node.parentElement?.isContentEditable) return;
  if (node.parentElement?.dataset?.ghostOmnibox) return;

  if (node._originalText === undefined) {
    node._originalText = deobfuscateStr(node.nodeValue);
  }

  const targetText = currentLevel === 0 ? node._originalText : obfuscateStr(node._originalText, currentLevel);
  
  if (node.nodeValue !== targetText) {
    node.nodeValue = targetText;
  }
};

const processTree = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function(node) {
      if (window.location.pathname.startsWith('/code')) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (p && ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'TITLE'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p && p.isContentEditable) return NodeFilter.FILTER_REJECT;
      if (p && p.dataset?.ghostOmnibox) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }
  
  nodes.forEach(processNode);
};

export const applyStealthMode = (level) => {
  currentLevel = level;

  if (stealthObserver) {
    stealthObserver.disconnect();
    stealthObserver = null;
  }

  isMutating = true;
  processTree(document.body);
  isMutating = false;

  stealthObserver = new MutationObserver((mutations) => {
    if (isMutating) return;
    isMutating = true;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'characterData') {
        // if react or something changes text, update our original reference
        // wait, if it changed, we should deobfuscate it to get the real new text
        mutation.target._originalText = deobfuscateStr(mutation.target.nodeValue);
        processNode(mutation.target);
      } else if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            processNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            processTree(node);
          }
        });
      }
    });

    isMutating = false;
  });

  stealthObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
};
