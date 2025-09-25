import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {
  CHECK_LIST,
  HEADING,
  UNORDERED_LIST,
  ORDERED_LIST,
} from "@lexical/markdown";
const MarkDownShortcutPlugin = () => {
  return (
    <MarkdownShortcutPlugin
      transformers={[CHECK_LIST, HEADING, UNORDERED_LIST, ORDERED_LIST]}
    />
  );
};

export default MarkDownShortcutPlugin;
