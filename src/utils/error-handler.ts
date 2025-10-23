const initialState = {
  isForbidden: false,
  isNotFound: false,
  isServerError: false,
  message: "An unexpected error occurred.",
};

export const handleError = (error: unknown): typeof initialState => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("forbidden")) {
      return { ...initialState, isForbidden: true, message: error.message };
    }
    if (message.includes("not found")) {
      return { ...initialState, isNotFound: true, message: error.message };
    }
    if (message.includes("internal server error")) {
      return { ...initialState, isServerError: true, message: error.message };
    }
  }

  return {
    ...initialState,
    message: error instanceof Error ? error.message : String(error),
    isServerError: true,
  };
};
