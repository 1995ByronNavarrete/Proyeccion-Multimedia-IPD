import { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-[#0a0a0f] text-white p-8">
          <div className="text-center max-w-md">
            <h2 className="text-lg font-bold mb-2 text-red-400">Error inesperado</h2>
            <p className="text-xs text-gray-400 mb-4">{this.state.error?.message}</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
              className="px-4 py-2 bg-[#6c5ce7] rounded-lg text-xs text-white hover:bg-[#5a4bd1]">
              Reiniciar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}