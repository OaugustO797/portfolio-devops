#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f index.html ]]; then
  echo '::error file=index.html::O arquivo index.html deve existir na raiz.'
  exit 1
fi

oversized=$(find . \( -path './.git' -o -path './node_modules' -o -path './_site' \) -prune -o -type f -size +500000c -print)
if [[ -n "$oversized" ]]; then
  echo '::error::Arquivos acima de 500 KB:'
  printf '%s\n' "$oversized"
  exit 1
fi

mkdir -p _site
cp -R index.html style.css images _site/
if grep -rIniwE 'TODO|FIXME|senha|password' _site; then
  echo '::error::O conteúdo publicável contém termos proibidos.'
  exit 1
else
  status=$?
  if [[ "$status" -ne 1 ]]; then exit "$status"; fi
fi
