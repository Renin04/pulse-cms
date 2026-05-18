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

const regex = /const openLinkModal = \(\) => \{\n    const el = (\w+)Ref\.current;\n    if \(!el\) return;\n\n    const existingLink = getLinkAtCursor\(el\);\n    if \(existingLink\) \{\n      setLinkModalText\(existingLink\.text\);\n      setLinkModalUrl\(existingLink\.url\);\n      setLinkModalRel\(existingLink\.rel\);\n      existingLinkRef\.current = existingLink;\n      savedRangeRef\.current = null;\n      setLinkModalOpen\(true\);\n      return;\n    \}\n\n    const selection = window\.getSelection\(\);\n    const selectedText = selection\?\.toString\(\)\.trim\(\);\n    if \(!selectedText\) return;\n    \/\/ Save the selection range before modal steals focus\n    if \(selection && selection\.rangeCount > 0\) \{\n      savedRangeRef\.current = selection\.getRangeAt\(0\)\.cloneRange\(\);\n    \}\n    existingLinkRef\.current = null;\n    setLinkModalText\(selectedText\);\n    setLinkModalUrl\(''\);\n    setLinkModalRel\(''\);\n    setLinkModalOpen\(true\);\n  \};/;
console.log('matches text:', regex.test(s));
