// ProseMirror（Tiptap）文件 JSON 的形狀
export interface ProseMirrorJSON {
  type: string;
  content?: ProseMirrorJSON[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}
