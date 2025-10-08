import { createContext, useCallback, useContext, useState } from "react";

const initialState = {
	canShow: false,
	isSelectionHasTextContent: false,
	openningFloatingToolbar: false,
};

type FloatingToolbarState = typeof initialState;
type FloatingToolbarStateKey = keyof typeof initialState;
type FloatingToolbarStateValue<Key extends FloatingToolbarStateKey> =
	FloatingToolbarState[Key];

type FloatingToolbarContextType = {
	floatingToolbarState: FloatingToolbarState;
	updateFloatingToolbarState: (
		key: FloatingToolbarStateKey,
		value: FloatingToolbarStateValue<FloatingToolbarStateKey>
	) => void;
	floatingToolbarElement: HTMLDivElement | null;
	onRef: (_element: HTMLDivElement | null) => void;
};

const Context = createContext<FloatingToolbarContextType | undefined>(
	undefined
);

const FloatingToolbarContext = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [floatingToolbarState, setFloatingToolbarState] =
		useState(initialState);
	const [floatingToolbarElement, setFloatingToolbarElement] =
		useState<HTMLDivElement | null>(null);

	const onRef = (_element: HTMLDivElement | null) => {
		if (_element) {
			setFloatingToolbarElement(_element);
		}
	};

	const updateFloatingToolbarState = useCallback(
		(
			key: FloatingToolbarStateKey,
			value: FloatingToolbarStateValue<FloatingToolbarStateKey>
		) => {
			setFloatingToolbarState((prev) => {
				return {
					...prev,
					[key]: value,
				};
			});
		},
		[]
	);

	const value = {
		floatingToolbarState,
		updateFloatingToolbarState,
		floatingToolbarElement,
		onRef,
	};

	return <Context.Provider value={value}>{children}</Context.Provider>;
};

const useFloatingToolbar = () => {
	const context = useContext(Context);

	if (!context) {
		throw new Error(
			"useFloatingToolbar must be used within a FloatingToolbarProvider"
		);
	}

	return context;
};

export { FloatingToolbarContext, useFloatingToolbar };
