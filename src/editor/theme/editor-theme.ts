import { EditorThemeClasses } from "lexical";

export const rootTheme: EditorThemeClasses = {
  code: "editor-code",
  heading: {
    h1: "editor-heading-h1",
    h2: "editor-heading-h2",
    h3: "editor-heading-h3",
    h4: "editor-heading-h4",
    h5: "editor-heading-h5",
  },
  image: "editor-image",
  link: "editor-link",
  list: {
    listitem: "editor-listitem",
    nested: {
      listitem: "editor-nested-listitem",
    },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
  },
  paragraph: "editor-paragraph",
  placeholder: "editor-placeholder",
  quote: "editor-quote",
  text: {
    bold: "editor-text-bold",
    code: "editor-text-code",
    hashtag: "editor-text-hashtag",
    italic: "editor-text-italic",
    overflowed: "editor-text-overflowed",
    strikethrough: "editor-text-strikethrough",
    underline: "editor-text-underline",
    underlineStrikethrough: "editor-text-underlineStrikethrough",
    lowercase: "editor-text-lowercase",
    uppercase: "editor-text-uppercase",
    capitalize: "editor-text-capitalize",
  },
  table: "editor-table",
  tableAddColumns: "editor-table-add-columns",
  tableAddRows: "editor-table-add-rows",
  tableAlignment: {
    center: "editor-table-alignment-center",
    right: "editor-table-alignment-right",
  },
  tableCell: "editor-table-cell",
  tableCellActionButton: "editor-table-cell-action-button",
  tableCellActionButtonContainer: "editor-table-cell-action-button-container",
  tableCellHeader: "editor-table-cell-header",
  tableCellResizer: "editor-table-cell-resizer",
  tableCellSelected: "editor-table-cell-selected",
  tableFrozenColumn: "editor-table-frozen-column",
  tableFrozenRow: "editor-table-frozen-row",
  tableRowStriping: "editor-table-row-striping",
  tableScrollableWrapper: "editor-table-scrollable-wrapper",
  tableSelected: "editor-table-selected",
  tableSelection: "editor-table-selection",
};

const prefixPath = "ImageNodeCaption__";

export const imageCaptionTheme: EditorThemeClasses = {
  heading: {
    h1: prefixPath + "editor-heading-h1",
    h2: prefixPath + "editor-heading-h2",
    h3: prefixPath + "editor-heading-h3",
    h4: prefixPath + "editor-heading-h4",
    h5: prefixPath + "editor-heading-h5",
  },
  paragraph: prefixPath + "editor-paragraph text-red-500",
  placeholder: prefixPath + "editor-placeholder",
  text: {
    bold: prefixPath + "editor-text-bold",
    code: prefixPath + "editor-text-code",
    hashtag: prefixPath + "editor-text-hashtag",
    italic: prefixPath + "editor-text-italic",
    overflowed: prefixPath + "editor-text-overflowed",
    strikethrough: prefixPath + "editor-text-strikethrough",
    underline: prefixPath + "editor-text-underline",
    underlineStrikethrough: prefixPath + "editor-text-underlineStrikethrough",
    lowercase: prefixPath + "editor-text-lowercase",
    uppercase: prefixPath + "editor-text-uppercase",
    capitalize: prefixPath + "editor-text-capitalize",
  },
};
