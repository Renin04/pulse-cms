const fs = require('fs');
const path = 'apps/website/app/components/StudioBlockEditors.tsx';
let content = fs.readFileSync(path, 'utf8');
const old = 'export function EditableVideo({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {';
const insert = `\nexport function EditableCodeSandbox({ block, adapter }: { block: Block<BlockData>; adapter: EditorStateAdapter<Block<BlockData>> }) {
  const data = block.data as { code: string; language: string; title?: string };
  return (
    <div className="space-y-2">
      <Input value={data.title || ''} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, title: e.target.value } }))} placeholder="Sandbox title (optional)" />
      <TextArea value={data.code} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, code: e.target.value } }))} placeholder="// code" rows={4} className="font-mono text-xs" />
      <Input value={data.language} onChange={(e) => adapter.updateBlock(block.id, (b) => ({ ...b, data: { ...data, language: e.target.value } }))} placeholder="Language" />
    </div>
  );
}
\n` + old;

if (!content.includes(old)) {
  console.log('OLD NOT FOUND');
  process.exit(1);
}

content = content.replace(old, insert);
fs.writeFileSync(path, content, 'utf8');
console.log('OK');
