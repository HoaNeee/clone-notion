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
