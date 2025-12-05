"use client";

import React, { createContext, useContext, useState } from "react";

const initialModalState = {
  openAnyModal: false,
};

export type ModalState = typeof initialModalState;

type ModalContextType = {
  state: ModalState;
  setState: React.Dispatch<React.SetStateAction<ModalState>>;
};

const Context = createContext<ModalContextType | null>(null);

export const ModalContext = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<ModalState>(initialModalState);

  const value = {
    state,
    setState,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useModalContext = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error(
      "useModalContext must be used within a ModalContextProvider"
    );
  }
  return context;
};
