import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-8 max-w-2xl mx-auto my-8 bg-white rounded-2xl border border-rose-200 shadow-sm space-y-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[30px]" aria-hidden="true">
              error
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {this.props.fallbackTitle || 'Hubo un inconveniente al cargar esta sección'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Se produjo un error al procesar la vista. Tus datos no se han perdido.
            </p>
            {this.state.error?.message && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl text-left border border-slate-200 text-xs text-rose-700 font-mono overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Reintentar carga</span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
