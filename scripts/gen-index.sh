#!/bin/bash
cd "$(dirname "$0")/.."
{
  echo '// AUTO-GENERATED — regenerate with scripts/gen-index.sh'
  # 排除項（不是公開 API，掃進 barrel 會把測試用的全域符號與大塊 fixture 變成對外介面）：
  #   *.spec.ts        單元測試
  #   *.stories.ts     Storybook
  #   shared/testing/  測試輔助（裡面用 jasmine 的全域 expect，消費端編譯會找不到）
  #   *.paste-fixtures 剪貼簿測試資料（十幾 KB 的 HTML 字串）
  find src/app -name '*.ts' \
    ! -name '*.spec.ts' \
    ! -name '*.stories.ts' \
    ! -name '*.paste-fixtures.ts' \
    ! -path 'src/app/shared/testing/*' \
    | sort | sed -E "s|^src/(.*)\.ts$|export * from './\1';|"
} > src/index.ts
