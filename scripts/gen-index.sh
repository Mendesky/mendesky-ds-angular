#!/bin/bash
cd "$(dirname "$0")/.."
{
  echo '// AUTO-GENERATED — regenerate with scripts/gen-index.sh'
  # 排除項（不是公開 API，掃進 barrel 會把測試用的全域符號與大塊 fixture 變成對外介面）：
  #   *.spec.ts        單元測試
  #   *.stories.ts     Storybook
  #   *.docs.ts        元件說明檔（文件網站與 AI 協作索引的資料來源）
  #   shared/testing/  測試輔助（裡面用 jasmine 的全域 expect，消費端編譯會找不到）
  #   *.paste-fixtures 剪貼簿測試資料（十幾 KB 的 HTML 字串）
  find src/app -name '*.ts' \
    ! -name '*.spec.ts' \
    ! -name '*.stories.ts' \
    ! -name '*.docs.ts' \
    ! -name '*.paste-fixtures.ts' \
    ! -path 'src/app/shared/testing/*' \
    | sort | sed -E "s|^src/(.*)\.ts$|export * from './\1';|"
  # 說明檔的型別（ComponentDoc 等）：讓使用端也能用同一格式寫自己的元件說明。只匯出型別檔，不匯出說明資料。
  find src/docs -maxdepth 1 -name '*-doc.ts' \
    | sort | sed -E "s|^src/(.*)\.ts$|export type * from './\1';|"
  # 本體 @mendesky/ds（圖示資料、跟框架無關的工具程式與資料格式、元件規格）：
  # 原本在本套件內，拆到本體後照樣從這裡轉出，使用端 import '@mendesky/ds-angular' 的寫法不用改。
  echo "export * from '@mendesky/ds';"
} > src/index.ts
