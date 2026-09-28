interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  resolve: ((value: boolean) => void) | null;
}

export function useConfirmState() {
  const state = useState<ConfirmState>("confirm-dialog", () => ({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Delete",
    resolve: null,
  }));
  return { state };
}

/** Opens the app-wide confirm modal and resolves true/false based on the user's choice. */
export function useConfirm() {
  const { state } = useConfirmState();

  function confirm(options: { title: string; message: string; confirmLabel?: string }): Promise<boolean> {
    return new Promise((resolve) => {
      state.value = {
        open: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? "Delete",
        resolve: (value: boolean) => {
          state.value.open = false;
          resolve(value);
        },
      };
    });
  }

  return { confirm };
}
