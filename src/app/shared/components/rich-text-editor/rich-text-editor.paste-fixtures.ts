/**
 * 貼上（clipboard）測試 fixture — 全部取自**真實**剪貼簿擷取，不是手寫合成。
 *
 * 來源與擷取日期：
 * - `WORD_WIN_HTML` / `WORD_MAC_SAFARI_HTML` / `WORD_EMAIL_HTML`：CKEditor5 paste-from-office
 *   測試語料（Word 2016 Win / Word 2016 macOS+Safari / Word 產生的 email body）。
 * - `EXCEL_MAC_HTML` / `MAC_MAIL_HTML`：2026-08-03 使用者實機以 DevTools
 *   `clipboardData.getData('text/html')` 擷取（macOS，Excel 15 / Mail.app）。
 *
 * ⚠️ 修改 fixture 前先讀這段：**引號的有無是規格的一部分，不得「順手統一」**。
 * 實測方言差異（改壞會讓測試在某個平台假綠）：
 * - Word Win / Excel：屬性**無引號**（`class=MsoNormal`、`content=Excel.Sheet`）
 * - Word macOS+Safari：屬性**有引號**，且**完全沒有任何 `<meta>`**
 * - Excel 同一份 HTML 內兩種並存：`content=Excel.Sheet`（無引號）＋
 *   `content="Microsoft Excel 15"`（有引號）→ sniffer 正則必須 quote-agnostic
 * - Word email：`Generator` 帶 `(filtered medium)` 後綴、**無 ProgId**、
 *   且宣告了 `xmlns:x="urn:schemas-microsoft-com:office:excel"`
 *   → 這是「Excel 判準不得用 xmlns」的實證來源
 */

/**
 * Word 2016 (Windows / Chrome)：有 ProgId + Generator，屬性無引號。
 * 內含 Word 的**假清單**：`<p class=MsoListParagraph*>` + `mso-list:` style，
 * 項目符號被 `<![if !supportLists]>…<![endif]>` 包住（HTML5 視為 bogus comment，
 * 只有標記本身變註解，中間的 `mso-list:Ignore` span 仍是活的 DOM → 符號會外洩成字面文字）。
 * 無 `<table>`（＝現行 `isExcelHtml` 誤判後 `extractAndCleanExcelTable` 回 null 的死貼上路徑）。
 */
export const WORD_WIN_HTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15">
<meta name=Originator content="Microsoft Word 15">
<link rel=File-List href="file:///C:/Users/x/AppData/Local/Temp/msohtmlclip1/01/clip_filelist.xml">
<!--[if gte mso 9]><xml>
 <o:OfficeDocumentSettings>
  <o:AllowPNG/>
 </o:OfficeDocumentSettings>
</xml><![endif]-->
<style>
<!--
p.MsoNormal, li.MsoNormal, div.MsoNormal
\t{margin:0cm;
\tfont-size:11.0pt;
\tfont-family:"Calibri",sans-serif;}
p.MsoListParagraph, li.MsoListParagraph, div.MsoListParagraph
\t{margin-left:36.0pt;
\tfont-size:11.0pt;}
-->
</style>
</head>
<body lang=EN-US style='tab-interval:36.0pt'>
<!--StartFragment-->

<p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l1 level1 lfo1'><![if !supportLists]><span
lang=PL style='mso-fareast-font-family:Calibri;mso-ansi-language:PL'><span style='mso-list:Ignore'>1.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]><span lang=PL style='mso-ansi-language:PL'>Item1<o:p></o:p></span></p>

<p class=MsoListParagraphCxSpLast style='text-indent:-18.0pt;mso-list:l1 level1 lfo1'><![if !supportLists]><span
lang=PL style='mso-fareast-font-family:Calibri;mso-ansi-language:PL'><span style='mso-list:Ignore'>2.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]><span lang=PL style='mso-ansi-language:PL'>Item
2<o:p></o:p></span></p>

<p class=MsoNormal><span lang=PL style='mso-ansi-language:PL'>Some text<o:p></o:p></span></p>

<p class=MsoListParagraph style='text-indent:-18.0pt;mso-list:l0 level1 lfo2'><![if !supportLists]><span
lang=PL style='font-family:Symbol;mso-ansi-language:PL'><span style='mso-list:Ignore'>&middot;<span
style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]><span lang=PL style='mso-ansi-language:PL'>Bullet
1<o:p></o:p></span></p>

<!--EndFragment-->
</body>
</html>`;

/**
 * Word 2016 (macOS / Safari)：**完全沒有任何 `<meta>`**（無 ProgId、無 Generator），
 * 屬性有引號，靠 `<style class="WebKit-mso-list-quirks-style">` 與 `xmlns:w` 才辨識得出是 Word。
 * → 這是「Word 判定不能只認 meta」的實證來源。
 */
export const WORD_MAC_SAFARI_HTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
xmlns="http://www.w3.org/TR/REC-html40"><head><style class="WebKit-mso-list-quirks-style">
<!--
/* Style Definitions */
p.MsoNormal, li.MsoNormal, div.MsoNormal
\t{mso-style-unhide:no;
\t\tmargin-bottom:8.0pt;
\t\tfont-size:12.0pt;}
-->
</style></head><body>
<!--StartFragment--><p class="MsoListParagraphCxSpFirst" style="text-indent:-18.0pt;mso-list:l0 level1 lfo1"><!--[if !supportLists]--><span style="mso-list:Ignore">1.<span style="font:7.0pt &quot;Times New Roman&quot;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span><!--[endif]-->Item1<o:p></o:p></p>
<p class="MsoNormal">Some text<o:p></o:p></p><!--EndFragment-->
</body></html>`;

/**
 * Word 產生的 email body（`Microsoft Word 15 (filtered medium)`）：
 * - `Generator` 帶 `(filtered medium)` 後綴 → 正則必須容忍後綴
 * - **無 ProgId**
 * - 宣告了 `xmlns:x="urn:schemas-microsoft-com:office:excel"`
 *   → **這份是 Word，卻含 Excel 命名空間**。現行 `isExcelHtml` 的
 *   `urn:schemas-microsoft-com:office:excel` 條件因此對它也誤判 → Excel 判準不得用 xmlns
 * - 清單是**真的** `<ol>/<li>`（不同於 clipboard 版的假清單）→ 假清單重組**不得**再處理它
 */
export const WORD_EMAIL_HTML = `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="Generator" content="Microsoft Word 15 (filtered medium)">
<style><!--
p.MsoNormal, li.MsoNormal, div.MsoNormal
\t{margin:0cm;
\tfont-size:11.0pt;}
--></style>
</head>
<body lang="EN-US" link="#0563C1" vlink="#954F72">
<div class="WordSection1">
<p class="MsoNormal">\u524d\u8a00\u6bb5\u843d<o:p></o:p></p>
<ol start="1" type="1">
 <li class="MsoListParagraph" style="mso-list:l0 level1 lfo3">Item1<o:p></o:p></li>
 <li class="MsoListParagraph" style="mso-list:l0 level1 lfo3">Item 2<o:p></o:p></li>
</ol>
<p class="MsoNormal">\u5f8c\u8a18\u6bb5\u843d<o:p></o:p></p>
</div>
</body>
</html>`;

/**
 * Excel 15 (macOS)，2026-08-03 實機擷取。關鍵事實：
 * - `<meta name=ProgId content=Excel.Sheet>`（**無引號**）
 *   ＋ `<meta name=Generator content="Microsoft Excel 15">`（**有引號**）→ 同份並存
 * - **沒有** `class=xl##`（實測 quote-agnostic 兩種寫法皆不命中）
 *   → 樣式靠 `<style>` 的 class 規則承載，命名不可假設
 * - 標題列是 `color:white`（深藍底白字）→ **照原樣保留顏色會在白底編輯器隱形**
 * - 另有 `color:windowtext`（CSS 系統色關鍵字）＝「預設文字色」
 * - 裸 `<col>`（HTML tree builder 會自動補 `<colgroup>`）→ TipTap 會回填 colwidth
 *
 * 內容對應使用者截圖：客戶／項目／酬金 三欄、111 記帳 12000 等三列。
 */
export const EXCEL_MAC_HTML = `<html xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=ProgId content=Excel.Sheet>
<meta name=Generator content="Microsoft Excel 15">
<style>
<!--table
\t{mso-displayed-decimal-separator:"\\.";}
.font5
\t{color:windowtext;
\tfont-size:12.0pt;
\tfont-family:\u65b0\u7d30\u660e\u9ad4;}
.head0
\t{mso-style-parent:style0;
\tcolor:white;
\tfont-weight:700;
\tbackground:#1F4E79;
\ttext-align:center;}
.cell0
\t{mso-style-parent:style0;
\tcolor:black;
\ttext-align:right;}
-->
</style>
</head>
<body link="#0563C1" vlink="#954F72">
<table border=0 cellpadding=0 cellspacing=0 width=360 style='border-collapse:collapse;width:270pt'>
<!--StartFragment-->
 <col width=120 style='width:90pt'>
 <col width=120 style='width:90pt'>
 <col width=120 style='width:90pt'>
 <tr height=40 style='height:30.0pt'>
  <td height=40 class=head0 width=120 style='height:30.0pt;width:90pt'>\u5ba2\u6236</td>
  <td class=head0 width=120 style='width:90pt'>\u9805\u76ee</td>
  <td class=head0 width=120 style='width:90pt'>\u916c\u91d1</td>
 </tr>
 <tr height=30 style='height:22.0pt'>
  <td height=30 class=cell0 style='height:22.0pt'>111</td>
  <td class=font5>\u8a18\u5e33</td>
  <td class=cell0>12000</td>
 </tr>
 <tr height=30 style='height:22.0pt'>
  <td height=30 class=cell0 style='height:22.0pt'>222</td>
  <td class=font5>\u7a05\u7c3d</td>
  <td class=cell0>20000</td>
 </tr>
<!--EndFragment-->
</table>
</body>
</html>`;

/**
 * macOS Mail.app，2026-08-03 實機擷取。**WebKit inline-style 序列化**，不是 Word HTML：
 * 無 `xmlns:o`、無 meta、`items` 無 `image/*`。
 *
 * 實測現行分支＝`PM預設解析（正常）` → **這是不得回歸的 baseline**。
 * 兩個必須被解析器處理的方言：
 * - `color: rgb(0, 0, 0)`（帶空格，與 Excel 的緊湊寫法不同）
 * - `color: rgb(238, 0, 0) !important`（帶 `!important` 後綴，解析前必須 strip）
 *
 * 另注意：整份**沒有** `<table|ul|ol|strong|em|b|i|h1-6>` 任何一個
 * → 現行 `isRichHtml` 為 false，只因 `isMarkdownLike(text/plain)` 也是 false 才逃過
 * markdown 劫持。此 fixture 是「放寬 isRichHtml」的實證來源。
 */
export const MAC_MAIL_HTML = `<head><meta charset="UTF-8"></head><p style="caret-color: rgb(0, 0, 0); color: rgb(0, 0, 0); font-family: MingLiU; font-size: 16px; font-style: normal; font-weight: 400; letter-spacing: normal; text-align: start; text-indent: 0px; white-space: normal;">\u70ba\u89e3\u6c7a<span style="color: rgb(238, 0, 0) !important;">\u5947\u52dd\u7cfb\u7d71</span>\u3001<span style="color: rgb(238, 0, 0) !important;">JWMIS</span> \u53ca<span style="color: rgb(238, 0, 0) !important;">\u8ca1\u6703 TACS</span> \u7cfb\u7d71\u9593\u7f55\u898b\u5b57\u7121\u6cd5\u986f\u793a\u4e4b\u554f\u984c\uff0c\u8cc7\u8a0a\u90e8\u5df2\u5b8c\u6210\u5efa\u7f6e\u3002</p><p style="color: rgb(0, 0, 0); font-family: MingLiU; font-size: 16px;">\u76ee\u524d\u5df2\u5efa\u7acb 166 \u500b\u7f55\u898b\u5b57(\u5982\u9644\u4ef6)</p>`;

/**
 * Google Docs：用 `<b style="font-weight:normal">` 包住整段內容。
 * TipTap Bold 有兩道防線（`tag:'b'` 的 getAttrs 在 `font-weight:normal` 時回 false、
 * 另一條 `font-weight=400` 的 clearMark 規則）靠的就是那個宣告。
 * → **任何清洗步驟不得移除 `font-weight:normal` / `400` 宣告**，否則整段變粗體。
 */
export const GOOGLE_DOCS_HTML = `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-abc123"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial;color:#000000;font-weight:400;">\u666e\u901a\u6bb5\u843d</span></p><p dir="ltr" style="line-height:1.38;"><span style="font-size:11pt;font-family:Arial;font-weight:700;">\u771f\u6b63\u7684\u7c97\u9ad4</span></p></b>`;
