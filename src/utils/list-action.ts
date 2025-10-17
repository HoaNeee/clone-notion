import {
  Baseline,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

const listKeyBlocks = [
  {
    key: "paragraph",
    title: "Normal",
    icon: Baseline,
  },
  {
    key: "h1",
    title: "Heading 1",
    icon: Heading1,
  },
  {
    key: "h2",
    title: "Heading 2",
    icon: Heading2,
  },
  {
    key: "h3",
    title: "Heading 3",
    icon: Heading3,
  },
  {
    key: "ul",
    title: "Bulleted List",
    icon: List,
  },
  {
    key: "ol",
    title: "Numbered List",
    icon: ListOrdered,
  },
  {
    key: "code",
    title: "Code Block",
    icon: Code,
  },
  {
    key: "quote",
    title: "Quote Block",
    icon: Quote,
  },
];

const getIconFromKeyBlock = (key: string) => {
  const block = listKeyBlocks.find((block) => block.key === key);

  if (key === "number") {
    return ListOrdered;
  }
  if (key === "bullet") {
    return List;
  }

  return block ? block.icon : Baseline;
};

export { listKeyBlocks, getIconFromKeyBlock };
