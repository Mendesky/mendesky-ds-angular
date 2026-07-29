#!/bin/bash
cd "$(dirname "$0")/.."
{
  echo '// AUTO-GENERATED — regenerate with scripts/gen-index.sh'
  find src/app -name '*.ts' ! -name '*.spec.ts' | sort | sed -E "s|^src/(.*)\.ts$|export * from './\1';|"
} > src/index.ts
