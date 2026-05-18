const fs = require('fs');

function patchFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // 1. Add skipBlurRef after savedRangeRef
  content = content.replace(
    /const savedRangeRef = useRef<Range \| null>\(null\);/g,
    'const savedRangeRef = useRef<Range | null>(null);\n  const skipBlurRef = useRef(false);'
  );

  // 2. Add linkModalTarget state after linkModalRel
  content = content.replace(
    /const \[linkModalRel, setLinkModalRel\] = useState\(''\);/g,
    "const [linkModalRel, setLinkModalRel] = useState('');\n  const [linkModalTarget, setLinkModalTarget] = useState('');"
  );

  // 3. Add refModalTarget state after refModalStyle
  content = content.replace(
    /const \[refModalStyle, setRefModalStyle\] = useState<'numeric' \| 'alphabetic' \| 'greek' \| 'abjad'>\('numeric'\);/g,
    "const [refModalStyle, setRefModalStyle] = useState<'numeric' | 'alphabetic' | 'greek' | 'abjad'>('numeric');\n  const [refModalTarget, setRefModalTarget] = useState('');"
  );

  // 4. Update existingLinkRef type
  content = content.replace(
    /const existingLinkRef = useRef<\{ text: string; url: string; rel: string \} \| null>\(null\);/g,
    "const existingLinkRef = useRef<{ text: string; url: string; rel: string; target: string } | null>(null);"
  );

  // 5. Update existingRefRef type
  content = content.replace(
    /const existingRefRef = useRef<\{ url\?: string; text\?: string; style: 'numeric' \| 'alphabetic' \| 'greek' \| 'abjad' \} \| null>\(null\);/g,
    "const existingRefRef = useRef<{ url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string } | null>(null);"
  );

  // 6. Update contextMenu type
  content = content.replace(
    /const \[contextMenu, setContextMenu\] = useState<\{ x: number; y: number; link: \{ text: string; url: string; rel: string \} \} \| null>\(null\);/g,
    "const [contextMenu, setContextMenu] = useState<{ x: number; y: number; link: { text: string; url: string; rel: string; target: string } } | null>(null);"
  );

  // 7. Update refContextMenu type
  content = content.replace(
    /const \[refContextMenu, setRefContextMenu\] = useState<\{ x: number; y: number; ref: \{ url\?: string; text\?: string; style: 'numeric' \| 'alphabetic' \| 'greek' \| 'abjad' \} \} \| null>\(null\);/g,
    "const [refContextMenu, setRefContextMenu] = useState<{ x: number; y: number; ref: { url?: string; text?: string; style: 'numeric' | 'alphabetic' | 'greek' | 'abjad'; target?: string } } | null>(null);"
  );

  // 8. Update openLinkModal - set skipBlurRef and target
  content = content.replace(
    /const openLinkModal = \(\) => \{\n    const el = (\w+)Ref\.current;\n    if \(!el\) return;\n\n    const existingLink = getLinkAtCursor\(el\);\n    if \(existingLink\) \{\n      setLinkModalText\(existingLink\.text\);\n      setLinkModalUrl\(existingLink\.url\);\n      setLinkModalRel\(existingLink\.rel\);\n      existingLinkRef\.current = existingLink;\n      savedRangeRef\.current = null;\n      setLinkModalOpen\(true\);\n      return;\n    \}\n\n    const selection = window\.getSelection\(\);\n    const selectedText = selection\?\.toString\(\)\.trim\(\);\n    if \(!selectedText\) return;\n    \/\/ Save the selection range before modal steals focus\n    if \(selection && selection\.rangeCount > 0\) \{\n      savedRangeRef\.current = selection\.getRangeAt\(0\)\.cloneRange\(\);\n    \}\n    existingLinkRef\.current = null;\n    setLinkModalText\(selectedText\);\n    setLinkModalUrl\(''\);\n    setLinkModalRel\(''\);\n    setLinkModalOpen\(true\);\n  \};/g,
    "const openLinkModal = () => {\n    skipBlurRef.current = true;\n    const el = $1Ref.current;\n    if (!el) return;\n\n    const existingLink = getLinkAtCursor(el);\n    if (existingLink) {\n      setLinkModalText(existingLink.text);\n      setLinkModalUrl(existingLink.url);\n      setLinkModalRel(existingLink.rel);\n      setLinkModalTarget(existingLink.target);\n      existingLinkRef.current = existingLink;\n      savedRangeRef.current = null;\n      setLinkModalOpen(true);\n      return;\n    }\n\n    const selection = window.getSelection();\n    const selectedText = selection?.toString().trim();\n    if (!selectedText) return;\n    // Save the selection range before modal steals focus\n    if (selection && selection.rangeCount > 0) {\n      savedRangeRef.current = selection.getRangeAt(0).cloneRange();\n    }\n    existingLinkRef.current = null;\n    setLinkModalText(selectedText);\n    setLinkModalUrl('');\n    setLinkModalRel('');\n    setLinkModalTarget('');\n    setLinkModalOpen(true);\n  };"
  );

  // 9. Update openRefModal - set skipBlurRef and target
  content = content.replace(
    /const openRefModal = \(\) => \{\n    const el = (\w+)Ref\.current;\n    if \(!el\) return;\n    const existingRef = getRefAtCursor\(el\);\n    if \(existingRef\) \{\n      setRefModalUrl\(existingRef\.url \|\| ''\);\n      setRefModalText\(existingRef\.text \|\| ''\);\n      setRefModalStyle\(existingRef\.style\);\n      existingRefRef\.current = existingRef;\n      savedRangeRef\.current = null;\n      setRefModalOpen\(true\);\n      return;\n    \}\n    const selection = window\.getSelection\(\);\n    const selectedText = selection\?\.toString\(\)\.trim\(\);\n    if \(!selectedText\) return;\n    if \(selection && selection\.rangeCount > 0\) \{\n      savedRangeRef\.current = selection\.getRangeAt\(0\)\.cloneRange\(\);\n    \}\n    existingRefRef\.current = null;\n    setRefModalText\(selectedText\);\n    setRefModalUrl\(''\);\n    setRefModalStyle\('numeric'\);\n    setRefModalOpen\(true\);\n  \};/g,
    "const openRefModal = () => {\n    skipBlurRef.current = true;\n    const el = $1Ref.current;\n    if (!el) return;\n    const existingRef = getRefAtCursor(el);\n    if (existingRef) {\n      setRefModalUrl(existingRef.url || '');\n      setRefModalText(existingRef.text || '');\n      setRefModalStyle(existingRef.style);\n      setRefModalTarget(existingRef.target || '');\n      existingRefRef.current = existingRef;\n      savedRangeRef.current = null;\n      setRefModalOpen(true);\n      return;\n    }\n    const selection = window.getSelection();\n    const selectedText = selection?.toString().trim();\n    if (!selectedText) return;\n    if (selection && selection.rangeCount > 0) {\n      savedRangeRef.current = selection.getRangeAt(0).cloneRange();\n    }\n    existingRefRef.current = null;\n    setRefModalText(selectedText);\n    setRefModalUrl('');\n    setRefModalStyle('numeric');\n    setRefModalTarget('');\n    setRefModalOpen(true);\n  };"
  );

  // 10. Update handleLinkConfirm signature and body
  content = content.replace(
    /const handleLinkConfirm = \(url: string, rel: string\) => \{\n    const el = (\w+)Ref\.current;\n    if \(!el\) return;\n    const relPart = rel \? `\{rel="\$\{rel\}"\}` : '';\n    const markdownText = `\[\$\{linkModalText\}\]\(\$\{url\}\)\$\{relPart\}`;/g,
    "const handleLinkConfirm = (url: string, rel: string, target: string) => {\n    const el = $1Ref.current;\n    if (!el) return;\n    const parts: string[] = [];\n    if (rel) parts.push(`rel=\"${rel}\"`);\n    if (target) parts.push(`target=\"${target}\"`);\n    const attrs = parts.length > 0 ? `{${parts.join(' ')}}` : '';\n    const markdownText = `[${linkModalText}](${url})${attrs}`;"
  );

  // Add skipBlurRef.current = false before setLinkModalOpen(false) in handleLinkConfirm
  content = content.replace(
    /(const handleLinkConfirm = \(url: string, rel: string, target: string\) => \{[\s\S]*?)    setLinkModalOpen\(false\);/g,
    "$1    skipBlurRef.current = false;\n    setLinkModalOpen(false);"
  );

  // 11. Update handleLinkRemove - add skipBlurRef reset
  content = content.replace(
    /(const handleLinkRemove = \(\) => \{[\s\S]*?)    setLinkModalOpen\(false\);/g,
    "$1    skipBlurRef.current = false;\n    setLinkModalOpen(false);"
  );

  // 12. Update handleRefConfirm signature and body
  content = content.replace(
    /const handleRefConfirm = \(url: string, text: string, style: 'numeric' \| 'alphabetic' \| 'greek' \| 'abjad'\) => \{\n    const el = (\w+)Ref\.current;\n    if \(!el\) return;\n    const markdownText = `\[ref\]\(\$\{url\}\)\{text="\$\{text\}" style="\$\{style\}"\}`;/g,
    "const handleRefConfirm = (url: string, text: string, style: 'numeric' | 'alphabetic' | 'greek' | 'abjad', target: string) => {\n    const el = $1Ref.current;\n    if (!el) return;\n    const targetPart = target ? ` target=\"${target}\"` : '';\n    const markdownText = `[ref](${url}){text=\"${text}\" style=\"${style}\"${targetPart}}`;"
  );

  // Add skipBlurRef.current = false before setRefModalOpen(false) in handleRefConfirm
  content = content.replace(
    /(const handleRefConfirm = \(url: string, text: string, style: 'numeric' \| 'alphabetic' \| 'greek' \| 'abjad', target: string\) => \{[\s\S]*?)    setRefModalOpen\(false\);/g,
    "$1    skipBlurRef.current = false;\n    setRefModalOpen(false);"
  );

  // 13. Update handleRefRemove - add skipBlurRef reset
  content = content.replace(
    /(const handleRefRemove = \(\) => \{[\s\S]*?)    setRefModalOpen\(false\);/g,
    "$1    skipBlurRef.current = false;\n    setRefModalOpen(false);"
  );

  // 14. Update onBlur handlers
  content = content.replace(
    /onBlur=\{\(e\) => \{\n            const markdown = htmlToMarkdown\(e\.currentTarget\.innerHTML\);/g,
    "onBlur={(e) => {\n            if (skipBlurRef.current) return;\n            const markdown = htmlToMarkdown(e.currentTarget.innerHTML);"
  );

  // 15. Update LinkModal calls
  content = content.replace(
    /<LinkModal\n        isOpen=\{linkModalOpen\}\n        onClose=\{\(\) => setLinkModalOpen\(false\)\}\n        onConfirm=\{handleLinkConfirm\}\n        onRemove=\{linkModalUrl \? handleLinkRemove : undefined\}\n        defaultText=\{linkModalText\}\n        defaultUrl=\{linkModalUrl\}\n        defaultRel=\{linkModalRel\}\n      \/>/g,
    '<LinkModal\n        isOpen={linkModalOpen}\n        onClose={() => { skipBlurRef.current = false; setLinkModalOpen(false); }}\n        onConfirm={handleLinkConfirm}\n        onRemove={linkModalUrl ? handleLinkRemove : undefined}\n        defaultText={linkModalText}\n        defaultUrl={linkModalUrl}\n        defaultRel={linkModalRel}\n        defaultTarget={linkModalTarget}\n      />'
  );

  // 16. Update RefModal calls
  content = content.replace(
    /<RefModal\n        isOpen=\{refModalOpen\}\n        onClose=\{\(\) => setRefModalOpen\(false\)\}\n        onConfirm=\{handleRefConfirm\}\n        onRemove=\{existingRefRef\.current \? handleRefRemove : undefined\}\n        defaultUrl=\{refModalUrl\}\n        defaultText=\{refModalText\}\n        defaultStyle=\{refModalStyle\}\n      \/>/g,
    '<RefModal\n        isOpen={refModalOpen}\n        onClose={() => { skipBlurRef.current = false; setRefModalOpen(false); }}\n        onConfirm={handleRefConfirm}\n        onRemove={existingRefRef.current ? handleRefRemove : undefined}\n        defaultUrl={refModalUrl}\n        defaultText={refModalText}\n        defaultStyle={refModalStyle}\n        defaultTarget={refModalTarget}\n      />'
  );

  // 17. Update LinkContextMenu onEdit
  content = content.replace(
    /onEdit=\{\(\) => \{\n            setLinkModalText\(contextMenu\.link\.text\);\n            setLinkModalUrl\(contextMenu\.link\.url\);\n            setLinkModalRel\(contextMenu\.link\.rel\);\n            existingLinkRef\.current = contextMenu\.link;/g,
    'onEdit={() => {\n            setLinkModalText(contextMenu.link.text);\n            setLinkModalUrl(contextMenu.link.url);\n            setLinkModalRel(contextMenu.link.rel);\n            setLinkModalTarget(contextMenu.link.target);\n            existingLinkRef.current = contextMenu.link;'
  );

  // 18. Update RefContextMenu onEdit
  content = content.replace(
    /onEdit=\{\(\) => \{\n            setRefModalUrl\(refContextMenu\.ref\.url \|\| ''\);\n            setRefModalText\(refContextMenu\.ref\.text \|\| ''\);\n            setRefModalStyle\(refContextMenu\.ref\.style\);\n            existingRefRef\.current = refContextMenu\.ref;/g,
    'onEdit={() => {\n            setRefModalUrl(refContextMenu.ref.url || \'\');\n            setRefModalText(refContextMenu.ref.text || \'\');\n            setRefModalStyle(refContextMenu.ref.style);\n            setRefModalTarget(refContextMenu.ref.target || \'\');\n            existingRefRef.current = refContextMenu.ref;'
  );

  fs.writeFileSync(path, content);
}

patchFile('C:/Users/z0512/Desktop/pulse/apps/website/app/components/StudioBlockCanvas.tsx');
patchFile('C:/Users/z0512/Desktop/pulse/apps/website/app/demo/PulseDemoEditor.tsx');
console.log('Done patching canvas and demo files.');
