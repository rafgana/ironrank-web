import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logAction } from "../services/actionLog";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Captura errores de renderizado de React.
 * Loguea a la action log y muestra fallback con opción de recargar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    logAction(
      "error_caught",
      {
        message: error.message.slice(0, 200),
        stack: error.stack?.split("\n").slice(0, 3).join(" | ").slice(0, 200),
        component: info.componentStack?.split("\n")[1]?.trim().slice(0, 100),
      },
      "react",
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-0 p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400">
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-xl font-semibold text-fg">
              Algo se ha roto
            </h1>
            <p className="text-sm text-fg-muted">
              La app ha tenido un error inesperado. Tus datos están a salvo
              (guardados en este navegador). Recarga para continuar.
            </p>
            <pre className="text-left text-xs bg-surface-1 border border-border-subtle rounded-lg p-3 overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
            <Button onClick={() => location.reload()} className="w-full">
              <RefreshCw size={14} />
              Recargar app
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
