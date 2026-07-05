import { useCallback, useState } from 'react';

export interface AppAlertButton {
  label: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AppAlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AppAlertButton[];
}

const DEFAULT_STATE: AppAlertState = {
  visible: false,
  title: '',
  message: undefined,
  buttons: [],
};

export function useAppAlert() {
  const [alertState, setAlertState] = useState<AppAlertState>(DEFAULT_STATE);

  const showAlert = useCallback((title: string, message?: string, buttons?: AppAlertButton[]) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ label: 'OK', style: 'default' }],
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((s) => ({ ...s, visible: false }));
  }, []);

  return { alertState, showAlert, hideAlert };
}