const s = `  const openLinkModal = () => {
    const el = textRef.current;
    if (!el) return;

    // Check if cursor is inside an existing link
    const existingLink = getLinkAtCursor(el);
    if (existingLink) {
      setLinkModalText(existingLink.text);
      setLinkModalUrl(existingLink.url);
      setLinkModalRel(existingLink.rel);
      existingLinkRef.current = existingLink;
      savedRangeRef.current = null;
      setLinkModalOpen(true);
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;
    // Save the selection range before modal steals focus
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    existingLinkRef.current = null;
    setLinkModalText(selectedText);
    setLinkModalUrl('');
    setLinkModalRel('');
    setLinkModalOpen(true);
  };`;

const regex = /const openLinkModal = \(\) => \{\n    const el = (\w+)Ref\.current;\n    if \(!el\) return;\n\n    const existingLink = getLinkAtCursor\(el\);/;
console.log('matches:', regex.test(s));
