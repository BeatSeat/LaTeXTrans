import { Component, createMemo, JSX } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { Toast, ToastType, ToastOptions, ToastPosition } from '@kobalte/core/toast';

// This is a custom toast implementation based on the bundled code.
// For a new project, using a library like @kobalte/core/toast directly is recommended.

export type ToastMessage = Component | JSX.Element | string | number;

export interface IToast {
  id: string;
  type: ToastType;
  message: ToastMessage;
  createdAt: number;
  visible: boolean;
  paused: boolean;
  pauseDuration: number;
  unmountDelay: number;
  duration?: number;
  position?: ToastPosition;
  style?: JSX.CSSProperties;
  className?: string;
  icon?: JSX.Element;
  ariaProps: {
    role: 'status' | 'alert';
    'aria-live': 'assertive' | 'off' | 'polite';
  };
}

interface Store {
  toasts: IToast[];
  pausedAt?: number;
}

const [store, setStore] = createStore<Store>({ toasts: [] });

let toastCount = 0;
const genId = () => (++toastCount).toString();

const createToast = (message: ToastMessage, type: ToastType = 'blank', opts: Partial<IToast> = {}): IToast => {
  return {
    id: opts.id || genId(),
    type,
    message,
    createdAt: Date.now(),
    visible: true,
    paused: false,
    pauseDuration: 0,
    unmountDelay: 1000,
    duration: type === 'loading' ? Infinity : 3000,
    position: 'top-right',
    ariaProps: { role: 'status', 'aria-live': 'polite' },
    ...opts,
  };
};

const dispatch = (fn: (state: Store) => void) => {
  setStore(produce(fn));
};

const addToast = (toast: IToast) => {
  dispatch(state => {
    const existing = state.toasts.find(t => t.id === toast.id);
    if (existing) {
      Object.assign(existing, { ...toast, id: existing.id });
    } else {
      state.toasts.unshift(toast);
    }
  });
};

const dismissToast = (toastId?: string) => {
  dispatch(state => {
    if (toastId) {
      const toast = state.toasts.find(t => t.id === toastId);
      if (toast) toast.visible = false;
    } else {
      state.toasts.forEach(t => t.visible = false);
    }
  });
};

const removeToast = (toastId?: string) => {
  dispatch(state => {
    state.toasts = toastId ? state.toasts.filter(t => t.id !== toastId) : [];
  });
};

const toast = (message: ToastMessage, opts?: Partial<IToast>) => {
  const t = createToast(message, 'blank', opts);
  addToast(t);
  return t.id;
};

toast.error = (message: ToastMessage, opts?: Partial<IToast>) => {
  const t = createToast(message, 'error', opts);
  addToast(t);
  return t.id;
};

toast.success = (message: ToastMessage, opts?: Partial<IToast>) => {
  const t = createToast(message, 'success', { duration: 2000, ...opts });
  addToast(t);
  return t.id;
};

toast.loading = (message: ToastMessage, opts?: Partial<IToast>) => {
  const t = createToast(message, 'loading', opts);
  addToast(t);
  return t.id;
};

toast.promise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: ToastMessage;
    success: ToastMessage | ((result: T) => ToastMessage);
    error: ToastMessage | ((error: any) => ToastMessage);
  },
  opts?: Partial<IToast>
) => {
  const id = toast.loading(messages.loading, opts);
  promise
    .then(res => {
      const message = typeof messages.success === 'function' ? messages.success(res) : messages.success;
      toast.success(message, { ...opts, id });
      return res;
    })
    .catch(err => {
      const message = typeof messages.error === 'function' ? messages.error(err) : messages.error;
      toast.error(message, { ...opts, id });
    });
  return promise;
};


toast.dismiss = dismissToast;
toast.remove = removeToast;

export { store as toastStore, toast };