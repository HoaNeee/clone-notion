export function getDOMRangeRect({
	nativeSelection,
	rootElement,
}: {
	nativeSelection: Selection | null;
	rootElement: HTMLElement | null;
}) {
	let rect;
	if (
		nativeSelection &&
		rootElement &&
		rootElement.contains(nativeSelection.anchorNode)
	) {
		const domRange = nativeSelection.getRangeAt(0);
		if (nativeSelection.anchorNode === rootElement) {
			let inner = rootElement;
			while (inner.firstElementChild != null) {
				inner = inner.firstElementChild as HTMLElement;
			}
			rect = inner.getBoundingClientRect();
		} else {
			rect = domRange.getBoundingClientRect();
		}
	}

	return rect;
}
