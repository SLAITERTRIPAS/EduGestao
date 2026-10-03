import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, Activity } from 'lucide-react';
import { systemLogger } from '../services/systemLogger';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error in Component:", error, errorInfo);
    try {
      systemLogger.logWhiteScreenPrevented(
        this.props.fallbackTitle || "Componente Anónimo",
        error,
        errorInfo.componentStack || undefined
      );
    } catch (e) {
      console.warn("Unable to send log to systemLogger:", e);
    }
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-white border border-rose-200 rounded-2xl shadow-sm text-center space-y-4 my-4 max-w-2xl mx-auto animate-in fade-in">
          <div className="p-3 bg-rose-100 border border-rose-200 rounded-full text-rose-600 inline-flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-rose-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {this.props.fallbackTitle || "Erro ao Carregar o Módulo"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ocorreu uma exceção inesperada durante a renderização deste painel. O sistema impediu a interrupção da plataforma.
            </p>
          </div>
          {this.state.error?.message && (
            <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl text-left overflow-x-auto max-h-32">
              <code>{this.state.error.message}</code>
            </div>
          )}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tentar Novamente</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
