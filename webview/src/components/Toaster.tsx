import { For, Show, onCleanup, onMount } from 'solid-js';
import { toastStore, IToast } from '../lib/toast';

const ToastComponent = (props: { toast: IToast }) => {
    let ref: HTMLDivElement | undefined;
    const toast = props.toast;
    
    onMount(() => {
        if (!ref) return;

        const enterAnimation = ref.animate([
            { transform: `translateY(-200%) scale(0.6)`, opacity: 0 },
            { transform: 'translateY(0) scale(1)', opacity: 1 }
        ], { duration: 350, easing: 'cubic-bezier(.21,1.02,.73,1)' });

        const exitAnimation = () => {
            if (!ref) return;
            ref.animate([
                 { transform: 'scale(1)', opacity: 1 },
                 { transform: `scale(0.4)`, opacity: 0 }
            ], { duration: 400, easing: 'cubic-bezier(.06,.71,.55,1)' });
        };
        
        if (toast.duration !== Infinity) {
            const timer = setTimeout(() => {
                exitAnimation();
            }, toast.duration);
            onCleanup(() => clearTimeout(timer));
        }
    });

    return (
        <div ref={ref}
            class="bg-white text-slate-800 rounded-md shadow-lg p-4 flex items-center"
            style={toast.style}
        >
            {/* Can add icons based on toast.type here */}
            <div>{toast.message}</div>
        </div>
    );
};

export const Toaster = () => {
    return (
        <div 
            class="fixed top-4 right-4 z-[9999] flex flex-col items-end space-y-2 pointer-events-none"
        >
            <For each={toastStore.toasts}>
                {(toast) => (
                    <Show when={toast.visible}>
                        <ToastComponent toast={toast} />
                    </Show>
                )}
            </For>
        </div>
    );
};
