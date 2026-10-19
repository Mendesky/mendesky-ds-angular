// DS 互動原則（正本）：補齊「元件長什麼樣」之外的「什麼情境用什麼、為什麼這樣選」。
// 實作「DS 沒有的元件」或「擴充既有元件」前，先查這裡的情境原則；
// 任務觸及 dismissal / empty / error / confirm / loading 任一類時必查。
//
// 命名規則：領域.主題（小寫＋點），如 modal.dismissal。
import type { PatternDoc } from './pattern-doc';

export const DS_PATTERNS: Record<string, PatternDoc> = {
  // KEY: modal.dismissal — Modal 關閉行為的情境分流（編輯 / 檢視 / 儲存中）
  'modal.dismissal': {
    name: 'Modal 關閉行為',
    principle: '有資料損失風險 → 強制確認出口（X + 二次確認，鎖 backdrop）；無風險 → 最低退出成本（backdrop 即可關）；儲存中 → 全鎖，避免 race condition',
    when: '設計或擴充 modal / dialog 類 dismissable surface 時；討論 X 按鈕 / ESC / backdrop 三出口策略時（drawer 的關閉行為見 drawer-shell 元件說明）',
    scenarios: [
      {
        type: 'readOnlyDismissible',
        description: '唯讀檢視 modal（展示資訊、無互動成本）',
        rule: [
          '大面積 backdrop 可點擊關閉',
          'ESC 可關閉',
          'X 按鈕可選（不強制；有 X 較明顯但也增加視覺噪音）',
        ],
        rationale: '誤關代價 = 再開一次（2 秒），應降低退出成本',
      },
      {
        type: 'readOnlyBlocking',
        description: '唯讀但強制閱讀（如條款同意前的聲明 modal）',
        rule: [
          '必須顯示明確的「我已閱讀」或「確認」按鈕作為唯一出口',
          'backdrop 不可關閉',
          'ESC 不可關閉（防止習慣性按 ESC 跳過閱讀）',
          'X 按鈕不出現',
        ],
        rationale: '關閉代價 = 法律 / 合規風險；必須強制閱讀互動',
      },
      {
        type: 'editingDirty',
        description: '編輯型且含未儲存變動（dirty=true）',
        rule: [
          '右上角 X 按鈕必須顯示（明確出口）— 用共用 app-modal-close-btn（No-X-Cancel + propClass="Modal"）',
          'backdrop 不可直接關閉（app-modal-shell [canDismiss]="!isDirty()" 擋；ESC 不受此 gate）',
          'X / ESC 行為依填寫成本分層：大型 / 多步驟 wizard（如多頁設定精靈、新增資料精靈）→ 二次確認（保留 / 捨棄）；小型單一用途 modal（如重新命名、封存、合併、拆分）→ X / ESC 直接關（backdrop 鎖已足夠防誤觸）',
        ],
        rationale: '誤觸 backdrop 代價 = 整份表單資料遺失 → 一律鎖 backdrop。但 X / ESC 是明確意圖：大 wizard 填寫成本高，二次確認把成本從「重填」降到「多一次 click」；小 modal 成本低，二次確認反而過度打擾（見 antiPattern「空白表單也被打擾」之對偶），故僅大 wizard 二次確認',
      },
      {
        type: 'editingClean',
        description: '編輯型但內容未變動（dirty=false，含表單有驗證錯誤但尚未 dirty）',
        rule: [
          'backdrop 可關閉（視同 readOnlyDismissible）',
          'ESC 可關閉',
          '無二次確認',
        ],
        rationale: '沒有資料可失 → 不該強加額外摩擦',
      },
      {
        type: 'savingLocked',
        description: '儲存中 / 非同步操作進行中',
        rule: [
          'X / ESC / backdrop 全鎖',
          '按鈕顯示 loading 狀態',
          '必要時顯示「正在儲存…」提示',
        ],
        rationale: '關閉中途 = 資料狀態未知（race condition）；避免使用者以為已儲存但其實失敗',
      },
    ],
    antiPatterns: [
      '唯讀 modal 同時放 X 與允許 backdrop 關閉 → 兩個出口、視覺噪音',
      '編輯 modal 不管 dirty 狀態一律二次確認 → 空白表單也被打擾',
      '小型單一用途 modal（重新命名、封存等）也強制二次確認 → 過度打擾（X/ESC 直接關即可，backdrop 鎖已防誤觸）',
      'backdrop 關閉前沒檢查 dirty → 資料靜默遺失',
      '儲存中仍允許 ESC 關閉 → 儲存結果不明、資料狀態 race',
      '強制閱讀聲明 modal 給 backdrop 關閉 → 使用者繞過合規互動',
      'nested modal 開啟時，下層 disabled-tooltip portal 未關閉 → tooltip 穿透到上層 modal（修法：tooltip portal 監聽 ModalStackService.stackSize，開啟時 snapshot 深度，stack 增層時主動 close portal）',
    ],
    a11y: {
      keyboard: [
        'ESC closes when type !== readOnlyBlocking && type !== savingLocked',
        'Tab trap inside modal（焦點不逸散到底層頁面）',
        'Shift+Tab 同樣 trap',
      ],
      focus: [
        'Open → 焦點移至第一個 focusable 元素（X 按鈕或首個輸入欄位）',
        'Close → 焦點回到觸發 modal 的按鈕',
      ],
      aria: [
        'role="dialog"',
        'aria-modal="true"',
        'aria-labelledby 指向 modal 標題 id',
        'savingLocked 時加 aria-busy="true"',
      ],
    },
    relatedComponents: [
      '#modal-shell',
      '#modal-close-btn',
      '#dialog',
    ],
    relatedPatterns: [
      'interaction.overlay-archetypes',
    ],
    references: [
      {
        source: 'Atlassian Design System — Modal dialog',
        url: 'https://atlassian.design/components/modal-dialog/usage',
        status: 'adopt',
        note: '編輯型二次確認、dismissible 出口設計邏輯直接沿用',
      },
      {
        source: 'IBM Carbon — Modal',
        url: 'https://carbondesignsystem.com/components/modal/usage',
        status: 'diverge',
        note: 'Carbon 建議一律顯示 X；本 DS 檢視型 X 可選（減少視覺噪音）',
      },
    ],
  },

  // KEY: action.confirm-destructive — 破壞性 / 高重建成本動作的確認策略
  'action.confirm-destructive': {
    name: '破壞性動作確認策略',
    principle: '系統保留每一次變更紀錄（如 Event Sourcing）時，「不可復原」的真實意涵是「重建成本」不是資料遺失。確認策略按「重建成本 + 中斷必要性 + 前提依賴性」分三層：可快速重建 → toast + undo；逆流程 / 高重建成本 → dialog 強制中斷；有前提依賴 → inline 讓使用者主動宣告前提為真',
    when: '設計刪除 / 封存 / 撤回 / 解散 / 跨單位協調 / 高價值設定送出等動作，需決定要用 toast、dialog 還是 inline confirm 時',
    scenarios: [
      {
        type: 'reversibleToast',
        description: '輕量可還原操作：事件可 replay、重建成本低、無下游副作用（刪除清單項、移除欄位、取消標記、解散組合等）',
        rule: [
          '操作立即執行（不先問）且 API 同步寫入；成功才顯示 success toast，失敗顯示 error toast',
          '執行後顯示 app-process-toast，含「復原」action',
          '復原視窗預設 5 秒（可延長至 10 秒，視操作成本）',
          'toast 消失 = UI 計時結束，動作早已寫入；期間按「復原」= 呼叫還原 API 反轉（非取消 pending 寫入）',
          '同一操作連續觸發 → 以最新的 toast 取代，不堆疊（避免累積一排已失效的「復原」鈕）',
          '⚠️ 本條**限帶 undo action 的可還原操作**，不涵蓋自動存檔的 per-field toast——那類一欄一顆、依序堆疊，見 mutation.feedback.optimisticAtomic 的自動存檔例外',
          '不中斷使用者主流程（不開 dialog）',
        ],
        rationale: '過度中斷是 UX 最大浪費。事件系統天然支援 replay，undo 視窗只是把「心理保險」外顯化；有 undo 的 toast 心理成本 ≈ 0，但打斷流程的 dialog 每次都多花 2–3 秒專注力',
      },
      {
        type: 'destructiveBlocking',
        description: '逆流程 / 高重建成本操作：技術可追溯但使用者重做成本高，且常帶下游副作用（封存項目、撤回已送出的申請）',
        rule: [
          '點擊觸發按鈕 → 開 app-dialog（propClass: Warning）',
          'Dialog 內容必須寫出「會發生什麼 + 重建需要的步驟」，不只寫「確定嗎？」',
          'backdrop 鎖死（不可點擊關閉）',
          'ESC 可關閉 = 取消；唯一推進路徑是點「確認」按鈕',
          '確認按鈕文案具體化（「封存此項目」而非「確認」）',
          '高風險操作建議加 app-process-modal 顯示後續處理進度',
        ],
        rationale: 'Dialog 的用意是「打斷 + 警告後果 + 強制聚焦」。backdrop 可關 = 使用者以手滑為由略過警告；按鈕文案寫「確認」= 使用者不知在確認什麼。這兩個細節任一鬆開，dialog 就退化成 toast 的劣化版',
      },
    ],
    antiPatterns: [
      '刪除單一清單項也彈 dialog → 過度中斷，使用者疲勞 → 改用 toast + undo',
      '封存項目用 toast + undo → 5 秒窗口太短決定高成本重建；dialog 才夠份量',
      'Dialog backdrop 可點擊關閉 → 使用者手滑略過警告，等同沒確認',
      'Dialog 按鈕文案寫「確認 / 取消」→ 看不出確認什麼；應寫「封存此項目 / 保留」',
      '高重建成本操作僅用 toast（如封存項目僅顯示 toast）→ 等同沒確認，5 秒 undo 不足以承載重建成本',
    ],
    a11y: {
      keyboard: [
        'Dialog：ESC = 取消（不推進）；Enter 不自動觸發「確認」按鈕（避免誤按）',
        'Toast：Tab 可聚焦到「復原」action；ESC 關閉 toast（等同放棄復原）',
      ],
      focus: [
        'Dialog 打開 → 焦點移到「取消」按鈕（預防誤按確認）',
        'Dialog 關閉 → 焦點回到觸發按鈕',
        'Toast 出現 → 焦點不搶，使用者若要 undo 主動 Tab 過去',
      ],
      aria: [
        'Dialog：role="alertdialog" aria-modal="true" aria-labelledby=title-id aria-describedby=body-id',
        'Toast：role="status" aria-live="polite"（undo action 用 button 讓螢幕閱讀器可達）',
      ],
    },
    relatedComponents: [
      '#dialog',
      '#process-toast',
      '#button',
      '#process-modal',
    ],
    references: [
      {
        source: 'Atlassian Design System — Confirmation modal',
        url: 'https://atlassian.design/components/modal-dialog/examples#warning',
        status: 'adopt',
        note: 'destructiveBlocking 的 backdrop-lock + 具體按鈕文案規則沿用',
      },
      {
        source: 'Material Design — Snackbar with action',
        url: 'https://m3.material.io/components/snackbar/guidelines',
        status: 'adopt',
        note: 'reversibleToast 的 5 秒 undo 視窗 + 單 action 設計沿用',
      },
      {
        source: 'GitHub — Dangerous actions pattern',
        url: 'https://primer.style/product/components/dialog/react/beta#danger-dialog',
        status: 'diverge',
        note: 'GitHub 要求使用者輸入 repo 名才能刪除；Mendesky 採按鈕文案具體化 + backdrop lock，不要求打字確認（平台動作頻率較高，打字摩擦過重）',
      },
    ],
  },

  // KEY: action.precondition-acknowledge — 前提依賴型確認：動作需要使用者主動宣告某個前提為真
  'action.precondition-acknowledge': {
    name: '前提聲明確認',
    principle: '動作本身風險低，但需要使用者主動宣告某個前提為真（發布前確認內容已經過審核、送出前再看一次金額與條款）。設計目標不是「阻止使用者誤操作」，而是讓使用者多看一眼並正式簽名，避免「容易忘記前提」的情境。',
    when: '設計任何「動作可執行，但執行前需要使用者確認某個外部前提為真」的互動——如合規聲明、資料前提確認、送出前複核等。對應元件：app-inline-confirm。',
    scenarios: [
      {
        type: 'preconditionAck',
        description: '前提依賴型確認：動作本身風險低，但需要使用者主動宣告某個前提為真（發布前確認內容已經過審核、送出前再看一次設定）',
        rule: [
          '使用 app-inline-confirm 元件',
          '元件由四個區塊組成：label（前提聲明主訴）+ description / bullets（補充說明或列點）+ check（勾選控制）+ 外部 app-button（由消費者控制 disabled）',
          '前提聲明用宣告句式（「我已確認 XXX」），不用問句（「XXX 嗎？」）',
          'requirement 分兩級：required（高後果，如正式發布）→ 視覺較強、消費者以 [disabled]="!confirmed()" 鎖主按鈕；optional（低後果，如送出前設定複核）→ 視覺中性、checkLabel 自動附加「（選填）」，主按鈕常 enabled',
          '不組合 dialog（重複摩擦）',
          '離開頁面再回來，confirmed 由父層清空（不保留 stale state）',
        ],
        rationale: '這類情境不是「動作會出事」而是「使用者容易忘記前提」。dialog 打斷流程過重；純提醒文字容易被略過。inline-confirm 的心理作用是「我正式簽過名」，讓使用者多看一眼但不中斷節奏。元件不負責控制主按鈕，讓「簽名」與「動作」職責分開，符合展示櫃而非保險箱的 DS 元件哲學',
      },
    ],
    antiPatterns: [
      'contextualInline 勾了 inline-confirm 還再彈 dialog → 雙層摩擦，使用者開始跳讀',
      'contextualInline 用問句文案（「已確認？」）→ 比宣告句式弱，使用者感受不到「我正式簽過名」',
      'contextualInline 跨 session 保留勾選狀態 → 使用者以為上次勾過就代表這次也驗證過',
      'inline-confirm 內部自帶按鈕或控制外部 disabled → 違反展示櫃原則，消費者無法組合複雜流程',
      '此情境誤歸入 action.confirm-destructive → 前提聲明不是破壞性動作，命名會誤導設計意圖',
    ],
    a11y: {
      keyboard: [
        'Inline：Space 切換 inline-confirm 的 check；Tab 循序 check → 主按鈕',
      ],
      focus: [
        'Inline 勾選後 → 焦點不自動跳（讓使用者自己決定下一步；元件不侵入流程）',
      ],
      aria: [
        'Inline：外層 role="group" aria-labelledby 指向 label；check 關聯 aria-describedby 指向 description / bullets',
      ],
    },
    relatedComponents: [
      '#inline-confirm',
      '#button',
    ],
    relatedPatterns: [
      'action.confirm-destructive',
    ],
    references: [
      {
        source: 'Material Design — Terms of service / checkbox agreement',
        url: 'https://m3.material.io/components/checkbox/guidelines',
        status: 'adopt',
        note: 'contextualInline 的「宣告句式 + checkbox + 外部 CTA」組合 pattern 沿用 Material agreement',
      },
    ],
  },

  // KEY: form.inline-custom-add — chip 群組 / 清單尾端「新增自訂項」的 inline 輸入互動（取代 native prompt）
  'form.inline-custom-add': {
    name: 'Inline 新增自訂項',
    principle: '在既有選項清單（chip 群組 / tag 列）尾端讓使用者新增「自訂項」時，用 inline 輸入（觸發鈕原地變輸入框）而非 native window.prompt、也不在 modal 內疊 dialog。單行自由文字的新增應就地完成、不打斷流程；committed 後即生效（optimistic）。',
    when: '設計任何「預設選項 + 可新增自訂項」的多選 chip / tag / 清單尾端新增。對應元件：app-inline-add。',
    scenarios: [
      {
        type: 'inlineCustomAdd',
        description: 'chip 群組尾端新增自訂 chip：點 ghost 觸發鈕 → 原地變 inline app-input → Enter 提交成一顆已勾選 chip',
        rule: [
          '使用 app-inline-add 元件',
          '僅 Enter 提交（trim 後非空才 emit）；Esc / blur 一律取消丟棄（最不意外）',
          '元件只管「輸入 affordance」，不持有清單 / 勾選；去重、加入清單、勾選由父層 (add) handler 處理（展示櫃原則）',
          'committed 後自動勾選 + 立即送後端（對應 mutation.feedback.optimisticAtomic）',
          '輸入態 keydown stopPropagation，避免方向鍵被 chip 群組 roving focus（wizard.keyboard）攔截',
          'reopen / 換頁回來：自訂項需由 read-path 併回渲染清單（後端回傳的非預設條目 union 進預設清單），否則 checked 但不渲染',
        ],
        rationale: 'native prompt 不可樣式化、無法測、跨瀏覽器不一致；dialog 疊在多頁 modal 上是 modal-on-modal、打斷 wizard。inline 輸入延續「清單尾端就地新增」的慣例，單行文字最省力。',
      },
    ],
    antiPatterns: [
      'inlineCustomAdd 用 native window.prompt → 不可樣式化 / 無法 e2e 測 / 跨平台外觀不一',
      'inlineCustomAdd 在已是 modal 的 surface 內再開 dialog 輸入單行文字 → modal-on-modal 過重',
      'inlineCustomAdd 元件自己持有清單 / 勾選 → 違反展示櫃原則，父層無法控制去重與後端同步',
      'inlineCustomAdd 新增後不自動勾選 → 使用者以為已生效，實際未送後端（混淆 + 漏存）',
      'inlineCustomAdd reopen 只還原 checked 不併回清單 → 自訂 chip 不渲染（checked 卻看不到）',
    ],
    a11y: {
      keyboard: [
        'Enter 提交、Esc 取消；輸入態方向鍵留在輸入框內（不觸發 chip 群組 roving focus）',
        '觸發鈕 → 進編輯態後焦點自動移入 input',
      ],
      focus: [
        'blur 離開輸入框 → 取消編輯態並還原為觸發鈕',
      ],
      aria: [
        '輸入框沿用 app-input 標準語意；外層 chip 群組維持 role="group"',
      ],
    },
    relatedComponents: [
      '#inline-add',
      '#check-chip',
      '#input',
    ],
    relatedPatterns: [
      'mutation.feedback',
      'wizard.keyboard',
    ],
    references: [],
  },

  // KEY: wizard.keyboard — Wizard / 表單 Modal 的鍵盤導航與 Enter 兩段式行為
  'wizard.keyboard': {
    name: 'Wizard 鍵盤導航',
    principle: 'Wizard 的 Enter 鍵分兩段：第一次 Enter（焦點在表單欄位）→ 焦點跳到當頁主要 action 按鈕；第二次 Enter（焦點已在按鈕）→ 真正觸發動作。設計目的是避免誤觸直接換頁，同時讓鍵盤使用者不必離開鍵盤就能完成整個 wizard 流程。',
    when: '設計 wizard、多步驟表單 modal、或任何含「下一步 / 送出」最終 action button 的互動 surface 時。',
    scenarios: [
      {
        type: 'textInput',
        description: '焦點在 <input> 一般文字欄位',
        rule: [
          '按 Enter → preventDefault，焦點跳到當頁主要 action 按鈕（下一步 / 送出）',
          '若該按鈕 disabled → 不跳焦（或保持焦點不動）',
        ],
        rationale: '符合使用者「打完這格就完成了」的心流預期；兩段式 Enter 保留誤觸緩衝',
      },
      {
        type: 'buttonGroup',
        description: '焦點在 app-button-group 的選項按鈕',
        rule: [
          '第一次 Enter（選項未選中）→ preventDefault，切換為該選項',
          '第二次 Enter（焦點在已選中的選項）→ 不 preventDefault，事件冒泡給外層 wizard 的 onFormEnter，由 wizard 把焦點丟到下一步按鈕',
          'Space 鍵一律只做「切換選項」，不冒泡（a11y 慣例：Space = 切換 control，Enter = 預設動作）',
          '方向鍵 ← → ↑ ↓ 仍僅在 button-group 內循環移動焦點',
        ],
        rationale: '保留「用 Enter 切換選項」的鍵盤能力，同時讓「已確認選擇」的使用者能用第二次 Enter 離開 button-group；符合使用者「再按一次 Enter」的直覺語意',
      },
      {
        type: 'textarea',
        description: '焦點在 <textarea>',
        rule: [
          'Enter 保留原生換行，不冒泡、不觸發跳焦',
        ],
        rationale: '多行文字欄位的 Enter 必須保留換行語意，Ctrl/Cmd+Enter 才是「完成」',
      },
      {
        type: 'actionButton',
        description: '焦點在非 button-group 的一般按鈕（如「新增聯絡窗口」、footer 取消鍵等）',
        rule: [
          'Enter 保留原生 click 行為，不觸發跳焦',
          'onFormEnter 以 closest("app-button-group") 判斷是否為 button-group 子按鈕',
        ],
        rationale: '一般按鈕的 Enter = 按下該按鈕，不該被攔截到其他地方',
      },
      {
        type: 'composingIME',
        description: '輸入法選字視窗開著（中文注音、日文假名等）',
        rule: [
          '一律不攔截 Enter（event.isComposing === true 或 keyCode === 229）',
          '使用者的 Enter 是選字確認，不是 submit',
        ],
        rationale: 'IME composing 中按 Enter 若被攔截 → 選字不完成 + 焦點飛走 = 災難體驗',
      },
      {
        type: 'subModalOpen',
        description: 'wizard 內開著更上層的 sub-modal（例如編輯 modal 內再開的 dialog）',
        rule: [
          'wizard 的 onFormEnter 檢查 sub-modal 開啟旗標 → 早退，避免跨層跳焦',
        ],
        rationale: '子 modal 的 Enter 由子 modal 自己處理；父層不應攔截',
      },
    ],
    antiPatterns: [
      'button-group 的 Enter 無條件 preventDefault → 使用者無法用 Enter 離開 button-group，必須鼠標 / Tab 輔助',
      'onFormEnter 把所有 <button> 一律 skip → button-group 子按鈕永遠不冒泡',
      'Enter 直接 click 下一步按鈕（不經過「焦點中繼站」）→ 誤觸率高，使用者無法取消',
      'checkbox / radio 的 Enter 觸發 submit → 打破原生切換語意',
      '不檢查 event.isComposing → 中文輸入法使用者大量誤觸',
    ],
    a11y: {
      keyboard: [
        'Tab / Shift+Tab：正常進 / 出 wizard 各欄位',
        'Enter：兩段式（欄位 → 按鈕 → 送出）',
        'Space：在 button-group 上純切換，不觸發跳焦',
        '← → ↑ ↓：僅在 roving tabindex 元件內移動焦點（button-group、radio-chip 等）',
        'ESC：關閉 wizard（或叫出「要儲存嗎」二次確認，視 dismissal pattern）',
      ],
      focus: [
        'Wizard 開啟 → 焦點落在第一個 enabled input / select',
        '切換步驟 → 焦點回到該步的第一個欄位',
        '下一步按鈕 disabled 時 → 不把焦點丟上去，避免視覺「卡住」',
      ],
      aria: [
        'app-button-group 使用 role="group" + aria-pressed',
        '下一步 / 送出按鈕使用 type="button"（wizard 不靠原生 form submit）',
        '目前有驗證錯誤時，錯誤訊息透過 aria-describedby 連結到欄位',
      ],
    },
    relatedComponents: [
      '#button-group',
      '#button',
      '#input',
      '#select',
      '#modal-shell',
    ],
    relatedPatterns: [
      'interaction.overlay-archetypes',
    ],
    references: [
      {
        source: 'Atlassian Design System — Modal dialog, Button, Radio',
        url: 'https://atlassian.design/components/modal-dialog/usage',
        status: 'adopt',
        note: 'Enter 作為預設動作、Space 切換 control 的區分沿用 WCAG APG / Atlassian 慣例',
      },
      {
        source: 'WAI-ARIA Authoring Practices — Radio Group',
        url: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
        status: 'adopt',
        note: 'roving tabindex + 方向鍵循環的鍵盤規格照抄；Enter 觸發預設動作的語意沿用',
      },
    ],
  },

  // KEY: loading.api-hydration-skeleton — API 水合期間用 skeleton 遮罩 race window，避免 blur/select 寫入覆蓋尚未載入的後端值
  'loading.api-hydration-skeleton': {
    name: 'API 水合 Skeleton',
    principle: 'Section 同時具備「開啟瞬間打 GET API 取得預填值」與「欄位 blur/select 觸發寫入 API」時，GET 未回 + 使用者先操作 = 寫入會把 null/空字串送回後端覆蓋真值。用 Loading Signal 驅動 skeleton 遮罩整段 section 在 race window 內不可互動，API 回來才切換到真實表單。禁止用反向 hydrated 旗標（雙重否定、可讀性差）。',
    when: 'Section 內同時有「讀取 API 預填」與「寫入 API（blur/select/debounce 觸發）」；或任何 signal 在 API 回來前被使用者互動讀走會造成資料損失的情境。',
    scenarios: [
      {
        type: 'apiHydratedReadWrite',
        description: 'Section 同時讀 API（GET 填 signals）且寫 API（blur/select 觸發 edit）',
        rule: [
          'loadingSignal = signal(true)；loadFromApi 第一行 set(true)',
          '對應的套用函式（apply*）尾端、把完整狀態 emit 給父層之後 set(false)',
          'loadFromApi 的 .catch 必 set(false)，否則 API 失敗 → skeleton 永卡',
          'HTML 用 @if (loadingSignal()) { <skeleton> } @else { <real form> }，不可並存',
          'ngOnChanges initialState restore 分支 set(false)（snapshot 已含值、不必等 GET）',
          'ngOnChanges reset 分支用 loadFromApiFiring 判斷：若本輪會觸發 loadFromApi，set(false) 交給 loadFromApi；否則主動 set(false)',
          '清單型 section 同理：GET 回來用 set(...) 整份覆寫清單，會把使用者剛上傳或新增的項目沖掉，同樣要用 skeleton 遮住 race window',
        ],
        rationale: '四個同步點（init true / loadFromApi set(true) / apply set(false) / catch set(false)）缺一就會造成卡死或 race；消費者單點（@if）避免散落的 computed 洩漏中間態',
      },
      {
        type: 'apiHydratedReadOnly',
        description: 'Section 只讀 API、沒有寫入 API（例如純展示或只 emit 給父層）',
        rule: [
          '不必裝 skeleton；沒有 race window 可遮',
          '若 UX 希望有 loading 視覺 → 再考慮 skeleton，但不屬於此 pattern 範疇',
        ],
        rationale: '沒有寫入 API 就不會有「被覆蓋」的資料損失；裝 skeleton 只是 UX 偏好，不是正確性需求',
      },
      {
        type: 'localSnapshotOnly',
        description: 'Section 從 parent 的 initialState 快照還原，整段不打 API',
        rule: [
          'ngOnChanges 偵測到 initialState 存在 → 直接從 snapshot set signals + Loading set(false)',
          '若 snapshot 不完整仍需 GET 補 → 走 apiHydratedReadWrite，snapshot 分支也要 set(false)（因為 UI 可立即顯示，GET 只補背景資料）',
        ],
        rationale: 'Snapshot 是 UI 草稿，不是後端真值；但 UI 可立即顯示，skeleton 沒有存在理由',
      },
      {
        type: 'failSilent',
        description: 'API 失敗 / 離線 / timeout',
        rule: [
          '.catch callback 內第一件事：loadingSignal.set(false)',
          '接著 console.error 記錄失敗原因',
          'UI 顯示空白表單（使用者可手動輸入、blur 會觸發重試）',
          '不彈 toast / dialog（避免打斷；parent 層若需 retry UI 再另外處理）',
        ],
        rationale: '永久 skeleton 是比錯誤訊息更糟的 UX；讓使用者能填表單 > 顯示錯誤',
      },
      {
        type: 'raceRetryRead',
        description: 'Read API 對應 CQRS aggregate，剛 POST 建立後 read model 尚未就緒（race window < 1s），會回 503',
        rule: [
          'Service 層 read pipe 套 retry(RACE_RETRY)；RACE_RETRY 是使用端共用的 retry 設定常數，由使用端自行提供、不在 DS 套件內（它綁定的是後端的 retry 約定與 503 語意，屬於 app 與後端之間的協定而非 UI 行為）',
          'HttpContext 同時帶「抑制錯誤 UI」旗標（抑制 retry 期間的 503 dialog）＋「抑制 404 UI」旗標（保留 404 → null fallback 行為）',
          'pipe 順序：retry(RACE_RETRY) 在前、catchError 在後（404 不 retry、其他 status 跑完 retry 才落到 catchError）',
          'retry 用盡仍 503 → 拋給呼叫端 → 元件 catch 走 failSilent（console.error + skeleton 收起 + 不彈 dialog）',
          '不適用 PATCH / POST — 只適用 GET read model；寫入端的並行撞擊要用 serialize（concatMap）而非 retry',
        ],
        rationale: '對齊後端 API 規格「呼叫端應有 retry 策略」的約定；指數退避讓 projection 提前就緒時更快結束，總上限約 1.4s（200×2^(n-1) 退避三次加總）對後端 race window < 1s 規格留約 40% margin。實際值以共用 const（RACE_RETRY）為準，避免每個 service 重抄 delay 數字',
      },
    ],
    antiPatterns: [
      '用反向旗標 `hydrated = signal(false)` → 雙重否定；@if (!hydrated()) 易讀性差，ngOnChanges 分支容易忘記翻轉',
      '忘記在 catch 內 set(false) → 網路一掉使用者看到永恆 skeleton，只能重整頁面',
      'Loading signal 被散落消費（多處 computed / 多個 @if 分散判斷）→ 中間態洩漏，skeleton 閃爍',
      'Skeleton 畫太細（1:1 對應每個欄位）→ 表單類型切換時 skeleton 欄位數不對，比真實表單還難維護',
      'apply* 的 set(false) 放在「emit 完整狀態給父層」之前 → 先關 skeleton 再 emit，中間一瞬間 @if 切到 @else 但 signals 還沒寫完，使用者看到空表單',
      'ngOnChanges reset 分支無條件 set(false) → 覆蓋後置的 loadFromApi set(true)，skeleton 根本不會亮',
    ],
    a11y: {
      keyboard: [
        'Skeleton DOM 內無 tabindex / focusable 元素 → Tab 自動跳過該 section',
        'API 回來 skeleton 銷毀 → 焦點管理交給父層（wizard 有自己的 focus-first-field 邏輯）',
      ],
      aria: [
        'Skeleton 容器可選 aria-busy="true"（若整段 section 有 labelled 區塊），但本 pattern 不強制 —— 短於 500ms 的 hydration 不值得通知螢幕閱讀器',
        '超過 1 秒的 hydration 才考慮 aria-live="polite"；GET API 普遍 < 500ms 時不必加',
      ],
      motion: [
        'Shimmer 動畫使用全域 .sk-shimmer（linear-gradient + 1.4s loop）',
        'prefers-reduced-motion 由全域 .sk-shimmer 處理，pattern 層不重複定義',
      ],
    },
    relatedComponents: [
      '#input',
      '#select',
      '#button-group',
      '#number-input',
    ],
    references: [
      {
        source: 'IBM Carbon Design System — SkeletonPlaceholder',
        url: 'https://carbondesignsystem.com/components/skeleton/usage/',
        status: 'adopt',
        note: 'shimmer 動畫 + 形狀佔位的視覺語言沿用；Carbon 強調 skeleton 不取代 spinner 而是取代「已知結構」的載入中狀態，與本 pattern 一致',
      },
      {
        source: 'Atlassian Design System — Skeleton',
        url: 'https://atlassian.design/components/skeleton/examples',
        status: 'adopt',
        note: '「不遮原 layout、用形狀塊暗示最終內容」的原則沿用；但 Atlassian 沒討論寫入 API 的 race，本 pattern 補齊這塊',
      },
    ],
  },

  // KEY: modal.footer-buttons — 明確提交型 Modal / Dialog 的 Footer Button 位置與錯誤回饋策略
  'modal.footer-buttons': {
    name: 'Modal Footer Button 位置與錯誤回饋',
    principle: '明確提交型 modal 的 footer：左側放退出流程的被動動作（取消／返回／上一步），右側放推進流程的主動作（確認／送出／下一步）；主動作在條件不足時保持 disabled 外觀但允許點擊，點擊後以 tooltip 就地顯示原因，不以常駐警示文字佔用 footer 版面',
    when: '設計或審查 dialog、wizard、modal 的 footer button（含明確完成/送出 CTA）排版與送出前驗證機制時。連續自動儲存型 modal 無 per-field save/cancel，但其最後一頁的完成 CTA（如「送出」）仍適用本 pattern——見 continuousSaveException scenario 與 interaction.overlay-archetypes。',
    scenarios: [
      {
        type: 'footerLayout',
        description: 'Footer 左右分區原則',
        rule: [
          '左側：取消、關閉、返回、上一步（退出或回退流程）',
          '右側：確認、送出、下一步、發布（推進流程的主動作）',
          '多步驟 wizard：上一步在左，下一步在右；取消在左與上一步並列',
          '單一主動作 dialog（如刪除確認）：左側取消，右側破壞性動作',
          '左側群組與右側群組必須以 display:flex + align-items:center 包裹，不可讓 app-button 以 inline-flex 散排 — inline-flex 的 baseline 由各按鈕第一個 inline-level 子元素決定（有 icon 的與無 icon 的 baseline 不同），必然錯位',
        ],
        rationale: '對齊 Material / Atlassian / Apple HIG：右側是視覺重心與拇指熱區，放主動作降低操作成本；左側被動動作符合「往左＝退出」的空間語意；flex container 規則來自實測：wizard 的上一步（有 icon）與取消（無 icon）以 inline-flex 排列時文字基線錯位，加 flex 包裹後消除',
      },
      {
        type: 'disabledWithFeedback',
        description: '主動作條件不足時的 disabled 狀態與回饋',
        rule: [
          '主動作按鈕使用 app-button [clickableWhenDisabled]="true" [disabledMessage]="..." (disabledClick)="..."',
          '外觀仍顯示 disabled（灰底灰字），但 click / tap 可穿透',
          '點擊後觸發兩層回饋：全域錯誤顯示在按鈕正上方 tooltip；欄位級錯誤預設顯示在該欄位下方（欄位元件 errorPosition 預設 bottom；版面放不下時才改 top，2026-10-14 定案）+ scroll 到第一個欄位錯誤',
          '多個錯誤同時存在：全部 tooltip 同時顯示，scroll 到第一個欄位級錯誤',
          'tooltip 持續顯示直到對應條件滿足才消失，不自動 dismiss',
        ],
        rationale: '使用者點了主動作才需要知道為什麼不能送：點擊觸發的就地回饋成本最低，不必用常駐的引導提示佔版面；觸控裝置可 tap，不依賴 hover',
      },
      {
        type: 'noFooterWarningText',
        description: '不在 footer 放常駐警示文字',
        rule: [
          'footer 版面只放 button，不放說明文字或 inline 警示',
          '錯誤訊息改為 tooltip，點擊觸發、就地顯示',
        ],
        rationale: '常駐文字讓 footer 高度不穩定；tooltip 佔用零版面、語意更精確（「你點了才需要知道為什麼不能送」）',
      },
      {
        type: 'continuousSaveException',
        description: '連續自動儲存型 modal — 部分適用',
        rule: [
          '典型情境：多頁編輯 modal，欄位 blur 即逐步寫後端',
          '無 per-field save 按鈕、無「取消」按鈕——資料已逐步寫入，「取消」語意模糊',
          '但最後一頁仍有明確完成 CTA（如「送出」）：該 CTA 套右側主動作 + disabledWithFeedback（disabled 外觀可點 + tooltip + scroll），本 pattern 適用於它',
          '每頁「下一頁」為純導航 CTA（不擋驗證）；驗證在各頁即時 + 最後一頁完成 CTA',
          '原型歸屬：modal（連續自動儲存），見 interaction.overlay-archetypes',
        ],
        rationale: '連續自動儲存 ≠ 無完成點：這類 modal 仍可能有明確的完成閘門（例如最後一頁預覽底部的「送出」），該完成 CTA 與一般送出 CTA 一樣套 footer-buttons；只是「無 per-field save / 無 cancel」（資料已逐步寫入，強套取消會讓人以為能「不儲存離開」）。',
      },
      {
        type: 'unifiedSizeAndVariant',
        description: 'Footer 按鈕統一 size，群組內 variant 一致',
        rule: [
          'Footer 內所有 app-button 使用相同的 size prop（推薦全部 size="M"）',
          '左側退出群組（取消／返回／上一步）內所有按鈕使用同一個 variant',
          '左右兩群組之間的 variant 應在 default 狀態下視覺重心對等；避免一邊 default 透明、一邊 default 重色背景',
          '推薦組合：左群組 elevated（白底+陰影 hover）+ 右側 filled；或左群組 outlined（default 即帶邊框）+ 右側 filled',
          'elevated variant 的 hover 才出現 box-shadow，相鄰按鈕只 hover 其中一顆時會視覺跳動 — 若體感過於明顯，改用 outlined 讓 default 即帶邊框',
        ],
        rationale: 'app-button size 直接控制 height（btn--m=36px、btn--l=40px）—混用 size 必然文字基線錯位；同 size 但群組內混用 variant、或左右群組視覺重心差異過大，相鄰 hover 切換時會出現視覺跳動，使用者會抱怨「看起來高度不齊」即使 CSS height 完全相同',
      },
      {
        type: 'adjacentSameSideDivider',
        description: '同側相鄰按鈕之間加 vertical divider 避免誤觸',
        rule: [
          '同一側群組有 ≥ 2 顆 button 時，相鄰 button 之間插入 <app-divider display="Column" propClass="Grey20">',
          'divider 由 flex 容器的 gap 自然隔開兩側（gap: 8px），不需手動設定 divider margin',
          '右側群組若有 ≥ 2 顆 button（如「另存草稿」+ 「送出」），同樣適用本規則',
          'disabled 狀態的相鄰 button 之間 divider 仍需保留，不因 disabled 移除',
        ],
        rationale: '使用者實測回饋：同側緊鄰兩顆按鈕（如上一步、取消）沒有視覺分隔時容易誤觸，特別是在觸控裝置；1px vertical divider 明確傳達「這是兩個獨立操作」，降低誤觸率，同時不佔 footer 高度',
      },
    ],
    antiPatterns: [
      'footer 右側同時放取消 + 確認 → 取消應移至左側',
      'disabled 按鈕不可點擊、沒有任何錯誤回饋 → 使用者不知道為什麼不能送出',
      'footer 放常駐警示文字（如「請至少選取一個項目」）→ 改用點擊觸發 tooltip',
      '連續儲存型 modal 強加取消按鈕 → 語意混淆，使用者誤以為可以「不儲存離開」',
      'hover tooltip 作為唯一錯誤回饋 → 觸控裝置看不到',
      'footer 內 app-button 用不同 size（如左 size="S" 右 size="M"）→ 文字基線錯位',
      '左群組混用 variant（如上一步用 ghost、取消用 elevated）→ 視覺重心不一致；hover 其一時視覺差異更明顯',
      '左/右群組的 button container 沒有 display:flex + align-items:center → 有 leftIcon 的按鈕與沒 icon 的按鈕 inline-flex baseline 不同，default 狀態就對不齊',
      '同側相鄰兩顆 button 直接緊貼、無 divider 分隔 → 誤觸率高，觸控裝置尤甚',
    ],
    a11y: {
      keyboard: [
        'disabled 按鈕使用 aria-disabled="true" 而非原生 disabled，讓鍵盤仍可 Tab 到按鈕並觸發 Enter 回饋',
        'tooltip 出現時不搶 focus，使用者可繼續 Tab 至錯誤欄位修正',
      ],
      touch: [
        'tap on clickableWhenDisabled 按鈕同樣觸發 disabledClick 與 tooltip',
      ],
      aria: [
        'aria-disabled="true" 告知輔助技術按鈕目前無法完成主動作',
        'tooltip 文字應以 role="tooltip" 標記，id 與 aria-describedby 對應',
      ],
    },
    relatedComponents: [
      '#button',
      '#dialog',
    ],
    relatedPatterns: [
      'interaction.overlay-archetypes',
      'modal.dismissal',
      'modal.nonlinear-completion',
    ],
    references: [
      {
        source: 'Apple HIG — Buttons',
        url: 'https://developer.apple.com/design/human-interface-guidelines/buttons',
        status: 'adopt',
        note: '主動作在右、破壞性動作在左（但 Apple 全用 text button；本 DS 沿用其空間語意，視覺沿用 DS 規格）',
      },
      {
        source: 'Material Design 3 — Dialogs',
        url: 'https://m3.material.io/components/dialogs/guidelines',
        status: 'adopt',
        note: '取消在左、確認在右；disabled feedback 由本 DS 自行擴充（MD 沒有 clickableWhenDisabled 對應規範）',
      },
    ],
  },

  // KEY: modal.nonlinear-completion — modal「實體正交切換器」結構（每實體重複整套頁）的完成 CTA 位置與跨頁/跨實體驗證錯誤呈現
  'modal.nonlinear-completion': {
    name: 'Modal 正交多實體的 sidebar 完成驗證',
    principle: '本 pattern 是 interaction.overlay-archetypes「modal」原型下，**實體維度為「正交切換器」（每個實體重複整套頁，如：成員切換器 × 每位成員 4 頁）** 的完成規則。因為沒有「單一最後一頁」，完成 CTA 放 sidebar 底部常駐、與當前頁/實體脫鉤；跨頁/跨實體錯誤無法在當前 DOM 直接 scroll，改用「導航樹紅框 + 實體切換器徽章」兩層錯誤地圖呈現，點 CTA 自動鑽取到第一個未完成實體的第一個未完成頁再 scroll。對照：實體「摺進頁序」（by-實體頁 + 共用頁，一條頁序，完成鈕在最後一頁）→ 完成 CTA 在最後一頁底，**不套本 pattern**。disabled+tooltip+scroll 基礎機制沿用 modal.footer-buttons.disabledWithFeedback。',
    when: '設計「實體正交切換器」結構的多頁 modal（每實體重複整套頁）的完成送出點與跨頁/跨實體驗證錯誤呈現時，如一份申請含 N 位成員、每位成員 4 頁。不適用於：摺進頁序型 modal（完成在最後一頁）、wizard（完成才 fire API）、Y/N dialog。',
    scenarios: [
      {
        type: 'sidebarCompletionCta',
        description: '完成 CTA 放 sidebar 底部，與當前頁脫鉤',
        rule: [
          '單一完成動作（如「完成建立資料」）放左側 sidebar 導航最底部，常駐顯示',
          '不綁在任一頁的內容區 footer——頁面可自由切換，送出點不該隨「當前在第幾頁」變動',
          'disabled 外觀但可點（app-button [clickableWhenDisabled]="true" + [disabledMessage] + (disabledClick)），沿用 modal.footer-buttons.disabledWithFeedback 的就地回饋機制',
          'CTA 身上只掛「一個」總結 tooltip（如「尚有 N 位成員未完成」/「尚有 N 個頁面待完成」），不在每個導航項各掛 tooltip',
        ],
        rationale: '非循序表單沒有「最後一頁」的概念，完成動作是跨所有頁/實體的單一閘門；放 sidebar 底部讓它與當前位置脫鉤、隨時可送。單一總結 tooltip 對齊 footer-buttons「不放常駐警示文字」原則。',
      },
      {
        type: 'twoLevelErrorMap',
        description: '跨頁/跨實體錯誤用兩層導航地圖呈現，而非單一錯誤清單',
        rule: [
          '頁層級：導航樹（app-stepper）未完成頁的 pill 顯示紅框 warning 狀態',
          '實體層級（多位成員）：實體切換器（成員面板）每個實體顯示完成綠勾 / 「缺 N 項」徽章（app-label，純文字不加 icon）',
          '點完成 CTA 時把所有未完成頁/實體一次點亮（常駐、可掃視），不靠暫態 tooltip 列舉',
          '徽章用文字 + 顏色雙重編碼（不只用顏色），色盲友善',
        ],
        rationale: 'tooltip 一次只能優雅顯示一個，多個導航項各掛 tooltip 會重疊且為暫態，不適合當常駐錯誤地圖；導航樹紅框 + 實體徽章本就是常駐可掃視的結構。對標 GOV.UK error summary「每條錯誤可定位」精神，但用既有導航樹取代獨立 summary 元件，省版面又貼合非循序結構。',
      },
      {
        type: 'autoDrillToFirstIncomplete',
        description: '點未通過 CTA 自動鑽取到第一個錯誤',
        rule: [
          '點 disabled 完成 CTA → 觸發驗證（唯一入口）',
          '鑽取順序：第一個未完成實體 → 切到該實體 → 其第一個未完成頁 → 切到該頁 → smooth scroll 到第一個錯誤欄位',
          '跨實體/跨頁切換後需等 DOM render（雙 requestAnimationFrame）再 query 錯誤欄位 scroll，避免抓到舊實體/舊頁 DOM',
          '使用者亦可自行點任何紅框 pill / 紅點徽章直接導航過去（兩層地圖皆可點）',
        ],
        rationale: '延伸 modal.footer-buttons 的「scroll 到第一個錯誤」動線到二維（實體 × 頁）；給使用者明確下一步，不必在多個紅點間自己摸索。',
      },
      {
        type: 'reuseDisabledFeedback',
        description: '就地回饋機制沿用 footer-buttons，不重造',
        rule: [
          'disabled 外觀 + 可點 + 點擊後 tooltip 就地顯示原因 + scroll 到錯誤——直接沿用 modal.footer-buttons.disabledWithFeedback',
          '本 pattern 只擴充「跨頁/跨實體」部分（兩層地圖 + 鑽取），不重新定義 disabled feedback 的基礎行為',
          'tooltip 持續顯示直到對應條件滿足才消失（同 footer-buttons）',
        ],
        rationale: '避免知識重複：disabled-but-clickable + tooltip + scroll 的基礎機制在 footer-buttons 已定義；本 pattern 與它是同域（modal）的版面變體（footer vs sidebar），引用而非複製。',
      },
    ],
    antiPatterns: [
      '把多個 tooltip 同時掛在各導航項上 → 重疊、暫態，不適合常駐錯誤地圖；改用導航樹紅框 + 實體徽章',
      '完成 CTA 綁在某一頁的內容區 footer → 非循序表單會讓使用者以為「只驗這一頁」',
      '多成員錯誤只用單層導航紅框（pill）→ 只反映當前實體，看不到其他未完成實體；需補實體切換器徽章',
      '把「摺進頁序」結構（by-實體頁＋共用頁）硬套 sidebar 完成 CTA → 它有單一最後一頁，完成應在最後一頁底，不套本 pattern',
      '把連續自動儲存的多頁 modal 命名/設計成 wizard → 它逐步寫 API，是 modal，見 interaction.overlay-archetypes',
      '徽章只用顏色（紅點）不加文字 → 色盲不友善；用 app-label 文字「缺 N 項」',
    ],
    a11y: 'disabled CTA 用 aria-disabled="true"（非原生 disabled），鍵盤仍可 Tab/Enter 觸發回饋；tooltip 出現不搶焦點；自動鑽取切換實體/頁後焦點與 scroll 目標移至第一個錯誤欄位；導航徽章文字 + 顏色雙重編碼。',
    relatedComponents: [
      '#modal-shell',
      '#stepper',
      '#button',
      '#label',
    ],
    relatedPatterns: [
      'interaction.overlay-archetypes',
      'modal.footer-buttons',
      'modal.dismissal',
    ],
    references: [
      {
        source: 'GOV.UK Design System — Error summary',
        url: 'https://design-system.service.gov.uk/components/error-summary/',
        status: 'diverge',
        note: 'adopt「每條錯誤可定位跳轉」精神；diverge：用既有導航樹（stepper pill + 實體切換器徽章）兩層地圖取代頂部獨立 error-summary 元件，貼合非循序多頁結構、省版面。',
      },
      {
        source: 'Salesforce / Atlassian / Carbon — Progress indicator（invalid step state）',
        url: 'https://carbondesignsystem.com/components/progress-indicator/usage/',
        status: 'adopt',
        note: 'adopt 兩層完成/錯誤狀態（step 可帶 complete / current / invalid）；本 pattern 擴充為「實體 × 頁」二維。',
      },
    ],
  },

  // KEY: interaction.overlay-archetypes — 彈窗三原型（dialog / wizard / modal）的分界與命名 SSOT（主幹）
  'interaction.overlay-archetypes': {
    name: '彈窗三原型：Dialog / Wizard / Modal',
    principle: '所有覆蓋層分三種原型，用一組軸區分；這是串接 modal.dismissal / mutation.feedback / wizard.keyboard / modal.nonlinear-completion 的主幹。 ── Dialog：目的是打斷使用者（高風險/需專注）、要求明確表態（典型不給 backdrop 出口）。 ── Wizard：modal 的變體、聚焦設定一件事、常搭 stepper（非必備）；關鍵特徵＝中間不 fire write model API、完成 action 才一次 fire（放棄成本低，傾向可關）。 ── Modal：最通用、連續自動儲存（編輯即逐步寫後端/草稿）、多頁時有導航（sidebar/stepper）。 【wizard vs modal 硬判準】中間有沒有 fire write model API：有（逐步寫）→ modal；沒有、完成才寫 → wizard。導航是否自由跳轉不是判準。例如多頁 modal 開啟前的「前導設定頁」是 wizard；進入後逐步儲存的本體是 modal。 【dismissal 權威】backdrop/ESC/X 何時可關、何時二次確認，一律以 modal.dismissal 為準（依 dirty/風險：editingClean 可關、editingDirty 二次確認、readOnlyBlocking 不可關、savingLocked 全鎖）；本原型矩陣只標各原型的「典型傾向」，不是絕對規則。',
    when: '命名或設計任何覆蓋層元件時；判斷某互動屬 dialog / wizard / modal 哪一種；code review 發現命名與行為不符時。',
    scenarios: [
      {
        type: 'useDialog',
        description: 'Dialog：打斷 + 強制表態（app-dialog DS 元件）',
        rule: [
          '典型傾向：不給 backdrop 出口、必須 confirm/dismiss/完成 required action 才關（精確規則依 modal.dismissal.readOnlyBlocking）',
          '破壞性動作二次確認（刪除/封存/撤回）、強制閱讀（法律聲明）、系統事件通知（逾時/斷線）',
          '單步驟、明確 Y/N，流程本身不需多步',
          '對應 DS 元件：app-dialog（Warning / Confirm / Info variant）',
          '行為細節 → modal.dismissal.readOnlyBlocking；破壞性確認 → action.confirm-destructive',
        ],
        rationale: '核心是「中斷」與「確認」：使用者主要動作被暫停，必須先表態。干擾性最高，用於高風險或需專注的場合。',
      },
      {
        type: 'useWizard',
        description: 'Wizard：聚焦引導設定，完成才寫 API（modal 變體）',
        rule: [
          '典型傾向：放棄成本低（中間未寫任何 write API），常可 backdrop 關＝放棄；但已填較多資料時仍依 modal.dismissal（editingDirty 二次確認、savingLocked 提交中全鎖）',
          '常搭 stepper（非必備）；引導使用者設定/收集資料，中間值可跳回修改但不 fire write API',
          '只有最後完成 action 才 fire write model API（一次性提交）',
          '例子：新增資料精靈、開啟多頁 modal 前的前導設定頁、範本編輯精靈',
          '對應命名：*WizardComponent；提交策略 → mutation.feedback.pessimisticWizard；鍵盤 → wizard.keyboard',
        ],
        rationale: '核心是「聚焦一件事直到關閉」+「資料暫存於前端、完成才落地」。失敗保留表單、重試成本低（見 mutation.feedback）。',
      },
      {
        type: 'useModal',
        description: 'Modal：最通用，連續自動儲存的多頁編輯（app-modal-shell）',
        rule: [
          '連續自動儲存：編輯即逐步寫後端 / 自動存草稿（與 wizard 最大差別）',
          'backdrop/ESC/X 關閉行為一律依 modal.dismissal：editingClean 可關、editingDirty 跳二次確認 bar、savingLocked 全鎖（不是「一律二次確認」）',
          '多頁 → 有導航（sidebar 自由跳轉 / stepper）；每頁底部可有「下一頁」CTA',
          '明確完成 CTA（送出/發布）放置依「實體維度結構」：',
          '  · 無實體維度 或 實體摺進頁序（by-實體頁 + 共用頁，一條頁序）→ 完成 CTA 在最後一頁底。例：每位成員各一頁＋共用頁排成一條頁序，送出鈕在最後一頁的預覽底部',
          '  · 實體為正交切換器（每實體重複整套頁）→ 完成 CTA 在左側欄底。例：每位成員各有整套頁、用切換器切換（見 modal.nonlinear-completion）',
          '簡單 modal（純展示/無完成閘門）→ close = 完成，無 completion CTA',
          '對應命名：*ModalComponent',
        ],
        rationale: '最廣的原型，可單純可複雜。連續自動儲存是通則；完成 CTA 的位置由「實體維度如何長進頁面結構」決定，而非維度數量。',
      },
      {
        type: 'howToTell',
        description: '三者最快判別法',
        rule: [
          '目的傾向：強制表態不給出口 → dialog；低風險可放棄 → wizard；連續編輯 → modal（精確 dismissal 一律見 modal.dismissal，不靠這條當絕對規則）',
          '中間有沒有 fire write model API？沒有、完成才寫 → wizard；逐步寫（自動儲存）→ modal（最可靠的判準）',
          '目的是打斷確認還是設定資料？打斷/高風險 → dialog；專注設定 → wizard/modal',
          '前導頁（開主流程前的資料收集）→ wizard；主流程本體（多頁編輯）→ modal',
        ],
        rationale: '單看「有沒有 CTA」「有沒有 stepper」「modal 多大」都會誤判；用 dismissal + API 時機 + 目的三軸交叉判斷。',
      },
      {
        type: 'ambiguousCase',
        description: '容易誤判的邊界情況',
        rule: [
          '「只有一步的資料收集」→ 看目的：引導完成任務 → wizard；確認已知動作 → dialog',
          '「有 OK / Cancel 兩顆按鈕」→ 不能以此判斷；wizard 最後一步也有確認按鈕',
          '「多頁 + 可自由切換」→ 仍要看 API 時機：連續自動儲存 → modal；完成才寫 → wizard',
          '「系統自動觸發」→ 系統事件通知用 dialog；引導設定流程即使自動觸發也是 wizard',
        ],
        rationale: '常見錯誤是把「有 CTA 的多頁 modal」都叫 wizard、或把「有確認按鈕的」都叫 dialog；應以三軸語意判斷。',
      },
    ],
    antiPatterns: [
      '把多步驟資料收集命名為 *DialogComponent → 應為 *WizardComponent',
      '把破壞性動作確認命名為 *WizardComponent → 應為 app-dialog + action.confirm-destructive',
      '用 app-dialog 承載多欄位表單 → dialog 不是表單容器，改用 wizard 或 modal-shell',
      '把「連續自動儲存的多頁編輯本體」叫 *WizardComponent → 它逐步寫 API，是 modal，應為 *ModalComponent',
      '把「中間不寫、完成才一次寫」的前導收集叫 modal → 它是 wizard',
      '以導航是否自由跳轉判斷 wizard/modal → 判準是 write API 時機，不是導航自由度',
      '以 modal 大小或「有沒有 CTA」判斷原型 → 應以 dismissal + API 時機 + 目的三軸判斷',
    ],
    a11y: 'Dialog：焦點 trap，關閉後焦點回觸發按鈕；ESC 行為見 modal.dismissal.readOnlyBlocking。Wizard：Tab trap；每步驟切換焦點移至步驟標題/第一欄位；提交中全鎖（mutation.feedback）。Modal：Tab trap；多頁切換焦點移至頁標題；dirty 關閉二次確認。三者皆 aria-modal="true" + aria-labelledby。',
    relatedComponents: [
      '#dialog',
      '#modal-shell',
      '#button',
      '#stepper',
    ],
    relatedPatterns: [
      'modal.dismissal',
      'modal.footer-buttons',
      'modal.nonlinear-completion',
      'mutation.feedback',
      'wizard.keyboard',
      'action.confirm-destructive',
    ],
    references: [],
  },

  // KEY: mutation.feedback — 使用者觸發 mutation（建立 / 修改 / 刪除）時的 API 反饋策略：pessimistic（wizard / 多欄位表單）vs optimistic（原子互動）
  'mutation.feedback': {
    name: 'Mutation API 反饋策略',
    principle: '依「操作代價」決定策略：多欄位表單 / wizard confirm → pessimistic（await 後才更新 UI）；原子互動（單一 toggle / select）→ optimistic（UI 先動，失敗 rollback）。原子互動若連動後續 wizard，視同 wizard pessimistic 流程——原子階段不 fire API。',
    when: '任何 component 觸發後端 mutation 時；設計 wizard confirm handler / toggle change / inline edit 的 API 呼叫時機與失敗反饋策略時。',
    scenarios: [
      {
        type: 'pessimisticWizard',
        description: 'Wizard / dialog / 多欄位表單的確認按鈕觸發 mutation',
        rule: [
          '按下「確認建立」→ button 進入 [loading] 狀態（app-button loading prop，自動阻擋重複 click）',
          'await API call（不先更新前端 state）',
          '成功 → 關 wizard / dialog；插入新資料（含後端回傳的 id）；顯示 success toast（文案：「已新增」）',
          '失敗 → 保留 wizard / dialog 開啟；保留表單所有欄位值；顯示 error toast（文案：「建立失敗，請重試」）；button 退出 loading',
          '提交進行中：wizard 的 X / ESC / backdrop 全鎖（modal.dismissal.savingLocked）',
          '以 wizardSubmitting signal 驅動 [isSubmitting] → button loading；cancel guard；父元件 try/await/finally 控制',
        ],
        rationale: '多欄位收集代表使用者有明確意圖；失敗後看不到表單 = 必須重填所有欄位（代價高）。pessimistic 把「狀態一致性」拉到 API 確認後，failure path 保留表單讓重試成本趨近於 0。',
      },
      {
        type: 'optimisticAtomic',
        description: '單一 toggle / select / inline edit 觸發 mutation（無後續 wizard）',
        rule: [
          'UI 立刻反映新值（不等 API）',
          '背景 fire-and-await API',
          '失敗 → rollback UI 回舊值；顯示 error toast',
          '成功 → 通常不需 toast（除非是高重建成本操作，例如某個開關要實際寫入後才算生效）',
          '**例外：自動存檔介面（無存檔按鈕、逐欄 blur/選取即存後端）成功必發 per-field toast**——這類介面沒有「送出」動作，toast 是使用者唯一能知道「資料真的存進去了」的訊號。文案「<欄位名稱> 已儲存」。清空欄位也一律發 toast，否則使用者以為清空沒生效',
          '同上例外的兩個實作紀律：(1) toast 必貼在 API `await` 之後、同一個 `try` 內——多數 handler 的 early-return（`if (!id) return`）在 try 之外，放錯位置會對「根本沒打 API」的路徑發假回饋；(2) **一欄一顆、依序堆疊**（`ToastService.show()`），不得取代——「存了電話」與「存了地址」是兩件事。逐欄存檔 toast 的封裝（例如 SaveToastService）由使用端實作，不在 DS 套件內',
          '逐欄存檔的 toast 不套用「取代不堆疊」：(a) `reversibleToast` 的「同一操作連續觸發 → 取代不堆疊」限定在**帶「復原」action 的可還原操作**，取代是為了不累積一排失效的復原鈕；(b) `ToastService.update()` 的用途是**同一件事的「進行中→完成」原地轉場**（例如產生 PDF：生成中→已開始下載），那是一件事的兩個階段、不是兩件事',
          'duration 由型別決定，呼叫端不自帶：success / loading → 3000ms、error → 5000ms、有 action → 5000ms（由元件統一決定，避免各呼叫點手打、漏帶就退回 3 秒）。實作於 `ToastService` 的 `resolveDuration()`，`show()` 與 `update()` 共用——`update()` 會改 type（loading→error），只改一處會讓轉場後的 error 只停 3 秒',
          '文案長度：`.toast__msg` 有 `-webkit-line-clamp: 2`，過長**不報錯、直接靜默截斷**；硬截斷點約 29 全形寬（size S 桌機兩行）。插值的 runtime 長度必須有界——不定長清單（`join`）、名稱、檔名不得塞進 toast，改用「N 個／N 筆」計數，明細改 dialog 或頁面內呈現。各類型的字數上限（例如 success/loading 16 全形寬、error 24、有 action 18）與是否用腳本守門由使用端自訂、不在 DS 套件內——DS 交付的是「兩行截斷」這個視覺約束事實，上限幾字取決於各產品的語言與語境（中英文容忍度不同）。參考：Ant Design 有文案規範頁但只有定性建議、無字數上限、無工具；Bootstrap 完全不提文案；Atlassian 的 ESLint plugin 明文「並非內容或文案規範」——三個主流 DS 都不用工具管文案長度',
          '進行中可選：spinner 覆蓋原子元件（如 select）或維持 optimistic 無 spinner',
        ],
        rationale: '單一欄位操作密集、低風險；pessimistic 每次都卡 spinner 阻礙流暢操作。UI 立即反映給使用者「你的操作被接受了」的感知，失敗時 rollback 並 toast 提示即可補救。',
      },
      {
        type: 'pessimisticTriggersWizard',
        description: '原子互動（toggle / select）選到特定值後需要開 wizard 補資料',
        rule: [
          '原子操作階段：不 fire 任何後端 API（哪怕 sig 已變更）',
          '開 wizard 收集缺少的欄位',
          'Wizard confirm 才是唯一的 API fire 時機（視同 pessimisticWizard）',
          '使用者取消 wizard → 將原子元件值 rollback 到觸發前的狀態',
          '技術實作：若同一次互動同時冒泡「同步到後端」與「欄位設定變更」兩個事件，同步 handler 必須過濾會觸發 wizard 的那個 key（early return），由開 wizard 的 handler 獨立控制流程',
        ],
        rationale: '若原子 change 同時 fire API + 開 wizard，wizard 收集到的補充欄位「後端先拿到 null 版本」→ 422；設計意圖是 wizard 確認後才算一次完整 mutation。分離兩條路徑才能保證資料完整性。',
        example: '某張設定卡片的開關從 `no` 切到 `yes` 後要開 wizard 補資料：同一次 change 同時冒泡觸發「同步到後端」與「開 wizard」。修法：同步 handler 過濾這個 key；只有 wizard confirm 才呼叫建立 API。',
      },
      {
        type: 'savingLockedSurface',
        description: 'Wizard / dialog 的 loading 中斷保護（與 modal.dismissal.savingLocked 對齊）',
        rule: [
          'wizardSubmitting = true 時：X 按鈕、ESC、backdrop 點擊全部 no-op（見 modal.dismissal.savingLocked）',
          'ng-content 的「取消」按鈕也需 guard：if (this.wizardSubmitting()) return;',
          '保護範圍：整個 try/await/finally 區間，不只是 API call 本身',
        ],
        rationale: '使用者在 API in-flight 時關掉 wizard 會導致「後端建立成功但前端不知道」的 ghost state；全鎖比允許部分互動更可預測。',
      },
    ],
    antiPatterns: [
      '原子 toggle 直接 fire 後端，但該 toggle 會觸發後續 wizard → 後端先拿到不完整資料（422）；正確：原子階段不 fire，wizard confirm 才是 mutation 時機',
      'Wizard confirm 不 await API 直接關 wizard → 使用者以為完成，但 API 可能失敗，前後端狀態不一致',
      'Optimistic update 有 fire API 卻沒寫 rollback → API 失敗後 UI 顯示不存在的狀態，無告知',
      '成功或失敗都不給 toast → 使用者無法確認「動作有沒有成功」，需回頁面驗證',
      'API 失敗時清空 wizard 表單值 → 使用者必須重填所有欄位，重試成本高',
      'Pessimistic wizard 但 wizardSubmitting guard 未覆蓋 X / ESC / backdrop → API in-flight 時可關掉 wizard，產生 ghost state',
      '用文字切換 button text 代替 [loading] prop → 缺少 spinner 視覺、缺少自動 click 阻擋、語意不明確',
    ],
    a11y: {
      keyboard: [
        '按鈕 loading 中：aria-disabled="true"（仍可被 Tab 聚焦）+ aria-busy="true"；native disabled 改用 aria 方式',
        'Success / error toast：aria-live="polite"（success）/ aria-live="assertive"（error）；不搶焦點',
        'Wizard loading 中 ESC 不關閉（modal.dismissal.savingLocked）',
        '失敗保留 wizard：焦點回到第一個 invalid 欄位（若能定位），或維持在確認按鈕上',
      ],
      aria: [
        'Loading button：aria-busy="true"',
        'Toast：role="status"（success）/ role="alert"（error）',
        'Wizard 全鎖中：wizard 容器加 aria-busy="true"',
      ],
    },
    relatedComponents: [
      '#button',
      '#process-toast',
      '#modal-shell',
      '#dialog',
    ],
    relatedPatterns: [
      'interaction.overlay-archetypes',
      'modal.dismissal（savingLocked type）',
      'action.confirm-destructive',
    ],
    references: [
      {
        source: 'Salesforce Lightning Design System — Form Submission',
        url: 'https://www.lightningdesignsystem.com/guidelines/loading/#form-submission',
        status: 'adopt',
        note: '確認 wizard / 多步驟表單 → loading button + inline error / toast；不 blur 後端更新前 UI state。',
      },
    ],
  },

  // KEY: interaction.contextual-selection-toolbar — 結構化區塊（表格列/欄）邊緣 hover/tap 浮出情境把手，點開得「只與該區塊相關」的操作選單 + 範圍高亮
  'interaction.contextual-selection-toolbar': {
    name: '情境選取工具列（邊緣把手）',
    principle: '對表格列/欄這類「結構化重複區塊」，在其邊緣 hover（桌面）或 tap/鍵盤進入（觸控）浮出情境把手；點把手得到「只與該列/欄相關」的操作選單（非一次全出）；選單開啟時以整塊外框 + 淡底高亮該列/欄，讓使用者清楚知道操作範圍。把手是就地、非破壞的 affordance——不佔版面、不改內容，收合靠 hover-intent。',
    when: '設計「就地對某個重複結構單元（表格列/欄、清單項、看板欄）施加一組情境操作」的互動；尤其在 rich-text / 畫布類元件內。對應：app-rich-text-editor 的 tableStructureEditing、app-rte-table-grip。',
    scenarios: [
      {
        type: 'edgeGripReveal',
        description: '雙軌觸發浮出把手：桌面 hover cell → 於列左緣 / 欄上緣浮出把手；觸控 tap 或鍵盤移入 cell（selectionUpdate）→ 同樣浮出（觸控無 hover）',
        rule: [
          '桌面 mousemove + 觸控/鍵盤 selectionUpdate 雙軌，兩者都導向同一 showGripsForCell',
          '收把手用 hover-intent 延遲（~250ms），讓滑鼠來得及移到浮出的把手/選單；把手 mouseenter 取消收起',
          '選單開啟中鎖住把手（不被 hover-intent 收）——否則滑鼠移向浮出選單離開把手 button 時把手被收、選單秒關',
          '把手 portal 到 document.body（避免被 overflow / transform 祖先裁切），命令式 createComponent；zone 外掛載必須 changeDetectorRef.detectChanges() 才 render',
          '把手 host :host{display:block}（不可 display:contents，否則 portal 定位失效）',
        ],
        rationale: 'Notion 式邊緣把手是「就地、不佔版面」的情境操作入口；雙軌確保觸控裝置（無 hover）也能觸發。portal + detectChanges + display:block 三者是 zone 外命令式掛載浮層的固定坑。',
      },
      {
        type: 'scopedMenu',
        description: '把手選單只出「與該列/欄相關」的操作，且依情境裁剪：表頭列（第一列）不出「上方插入列」；危險的整表操作不放選單',
        rule: [
          '列把手 / 欄把手各出各自的增刪 + 建立複本 + 清除內容 + 刪除該列/欄',
          '表頭列（第一列）選單不顯示「上方插入列」（已在最上、往上插無意義）',
          '「刪除整個表格」刻意不放選單（危險易誤觸）→ 改由使用者選取整表原生刪除',
          '刪除該列/欄靠 undo 復原、不彈確認 dialog（低成本、可逆）；若操作不可逆才升級為 dialog（見 action.confirm-destructive）',
        ],
        rationale: '「只出相關操作」降低選單認知負擔；表頭 gate 對齊 Notion；把不可逆的整表刪除排除在易誤觸的浮出選單外，是 action.confirm-destructive 的具體落地。',
      },
      {
        type: 'rangeHighlight',
        description: '選單開啟時高亮該列/欄的操作範圍：整塊外框（box-shadow inset 逐邊組合）+ 淡底，內部分隔線維持原色',
        rule: [
          '高亮存在區間 = 選單開啟中；選單關 / 把手收 / 執行指令後即清（choke-point 統一清）',
          'PM（ProseMirror）管理的 cell DOM 上做此暫態高亮必須用 ProseMirror Decoration，不可用 classList——classList 會被 wrapper plugin（如 %% autocomplete）在 blur 觸發的 PM 重繪連 nodeview 一起抹掉（實證：class 加 5 次結束 0、無 remove ＝節點被替換）',
          'border-collapse 表格用 box-shadow inset 逐邊組合畫外框（border-color 會被鄰格搶邊而斷裂）；只描外框、欄間分隔線維持灰',
          '切換把手（列選單開→欄選單開）用方向守衛，只有「正在高亮的方向」關閉才清，避免誤清剛套上的另一方向高亮',
        ],
        rationale: '操作前先看清「會影響哪一整塊」是 Notion 式表格編輯的關鍵回饋。Decoration 由 PM 每次 render 重套、重繪抹不掉，是唯一可靠做法。',
      },
    ],
    antiPatterns: [
      'edgeGripReveal 只掛 mousemove（無 selectionUpdate）→ 觸控裝置永遠看不到把手',
      'edgeGripReveal 選單開啟時仍照常 hover-intent 收把手 → 滑鼠移向選單即秒關',
      'edgeGripReveal 把手 display:contents 或 zone 外掛載不 detectChanges → 把手掛了卻不顯示 / 定位失效',
      'scopedMenu 把整表操作 + 全部列欄操作塞同一選單 → 認知負擔高、危險操作易誤觸',
      'scopedMenu 把「刪除整個表格」放進浮出選單 → 不可逆操作放在易誤觸入口',
      'rangeHighlight 用 classList / inline style 直接改 PM 管理的 cell DOM → 被 PM 重繪抹掉，真實 app 完全不顯示（unit test 無 wrapper 測不出）',
      'rangeHighlight 用 border-color 在 border-collapse 表格描外框 → 被鄰格 border 搶邊而斷裂',
    ],
    a11y: {
      keyboard: [
        'selectionUpdate 觸發把手 → 鍵盤移入 cell 也能喚出把手（不只 hover）',
        '把手是 <button>（aria-haspopup="menu" + aria-expanded），可 Tab 聚焦、Enter/Space 開選單',
        '選單項為 role="menuitem"',
      ],
      focus: [
        '選單開啟中把手不被收起（focus / 互動不中斷）',
      ],
      aria: [
        '危險操作（刪除列/欄）選單項以顏色 + 文字雙重標示，非僅靠顏色',
      ],
    },
    relatedComponents: [
      '#rich-text-editor',
      '#action-menu',
    ],
    relatedPatterns: [
      'interaction.overlay-archetypes',
      'action.confirm-destructive',
    ],
    references: [
      {
        source: 'Notion — 表格列/欄 handle',
        url: 'https://www.notion.so',
        status: 'diverge',
        note: '借「邊緣把手 + 情境選單 + 範圍高亮」的互動骨架；divergence：整表刪除不放選單（改原生選取刪除）、視覺用 Mendesky token。',
      },
    ],
  },
};
