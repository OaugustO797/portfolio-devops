import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';

const root = path.resolve(process.argv[2]);
const origin = 'https://portfolio.invalid';
const base = '/portfolio-devops/';
const documents = new Map();
const remoteChecks = new Map();

function* elements(node) {
  if (node.tagName) yield node;
  for (const child of node.childNodes ?? []) yield* elements(child);
  if (node.content) yield* elements(node.content);
}

async function listHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return listHtml(file);
    return entry.isFile() && /\.html?$/i.test(file) ? [file] : [];
  }));
  return files.flat();
}

async function checkRemote(url) {
  url.hash = '';
  if (!remoteChecks.has(url.href)) {
    remoteChecks.set(url.href, (async () => {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      await response.body?.cancel();
      if (!response.ok) throw new Error('HTTP ' + response.status);
    })());
  }
  await remoteChecks.get(url.href);
}

async function check(value, file) {
  if (!value.trim()) throw new Error('referência vazia');
  const relative = path.relative(root, file).split(path.sep).map(encodeURIComponent).join('/');
  const url = new URL(value, origin + base + relative);
  if (url.protocol === 'mailto:' || url.protocol === 'tel:') {
    if (!url.pathname) throw new Error('destino vazio');
    return;
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocolo inválido');
  if (url.origin !== origin) return checkRemote(url);

  const pathname = decodeURIComponent(url.pathname);
  if (!pathname.startsWith(base)) throw new Error('caminho fora do site');
  let target = path.resolve(root, pathname.slice(base.length));
  if (target !== root && !target.startsWith(root + path.sep)) throw new Error('caminho fora do site');
  if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
  if (!(await stat(target)).isFile()) throw new Error('destino não é um arquivo');

  if (url.hash && documents.has(target)) {
    const anchor = decodeURIComponent(url.hash.slice(1));
    const found = documents.get(target).some((node) => node.attrs.some(
      ({ name, value: attr }) => attr === anchor && (name === 'id' || (name === 'name' && node.tagName === 'a')),
    ));
    if (!found) throw new Error('âncora inexistente');
  }
}

for (const file of await listHtml(root)) {
  documents.set(file, [...elements(parse(await readFile(file, 'utf8'), { sourceCodeLocationInfo: true }))]);
}

const attributes = { a: ['href'], area: ['href'], link: ['href', 'imagesrcset'], img: ['src', 'srcset'], source: ['src', 'srcset'] };
const checks = [];
for (const [file, nodes] of documents) {
  for (const node of nodes) {
    for (const name of attributes[node.tagName] ?? []) {
      const attr = node.attrs.find((entry) => entry.name === name);
      if (!attr && !(name === 'src' && node.tagName === 'img' && !node.attrs.some((entry) => entry.name === 'srcset'))) continue;
      const value = attr?.value ?? '';
      const candidates = name.endsWith('srcset')
        ? value.split(',').map((candidate) => candidate.trim().split(/\s+/)[0])
        : [value];
      for (const candidate of candidates) {
        checks.push(check(candidate, file).catch((error) => {
          const line = node.sourceCodeLocation?.startLine ?? 1;
          console.error(path.relative(root, file) + ':' + line, name, JSON.stringify(candidate), error.message);
          process.exitCode = 1;
        }));
      }
    }
  }
}
await Promise.all(checks);
if (!process.exitCode) console.log('Referências HTML verificadas:', checks.length);
