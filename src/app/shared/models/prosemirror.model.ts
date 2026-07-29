// 自 mendesky-web features/quoting-cases/models/p4-contract.model.ts 抽出的 ProseMirror doc 形狀
export interface ProseMirrorJSON {
  type: string;
  content?: ProseMirrorJSON[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}
