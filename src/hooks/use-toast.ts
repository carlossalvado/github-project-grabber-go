
// Este arquivo serve como uma camada de abstração para os componentes de toast

import {
  useToast,
  toast,
  type Toast,
  type ToastActionElement
} from "@/components/ui/use-toast"

export type { Toast, ToastActionElement }
export type ToastProps = React.ComponentPropsWithoutRef<typeof import("@/components/ui/toast").Toast>

export { useToast, toast }

export type ToastAPI = typeof toast
