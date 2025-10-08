import { useEffect } from "react";
import { registerCodeHighlighting } from "@lexical/code-shiki";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const CodeHighlightShikiPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  return null;
};

export default CodeHighlightShikiPlugin;
