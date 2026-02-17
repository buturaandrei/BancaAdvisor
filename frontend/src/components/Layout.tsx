import { ReactNode } from 'react'
import { Building2, LayoutDashboard, PlusCircle, GitCompareArrows, Bot } from 'lucide-react'
import type { ViewMode, AdvisorStatus } from '../types'

interface LayoutProps {
  children: ReactNode
  currentView: ViewMode
  onNavigate: (view: ViewMode) => void
  advisorStatus: AdvisorStatus | null
}

export default function Layout({ children, currentView, onNavigate, advisorStatus }: LayoutProps) {
  const navItems: { view: ViewMode; label: string; icon: ReactNode; shortLabel: string }[] = [
    { view: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: <LayoutDashboard size={20} /> },
    { view: 'nuovo', label: 'Nuovo Mutuo', shortLabel: 'Nuovo', icon: <PlusCircle size={20} /> },
    { view: 'confronto', label: 'Confronta', shortLabel: 'Confronta', icon: <GitCompareArrows size={20} /> },
    { view: 'advisor', label: 'AI Advisor', shortLabel: 'AI', icon: <Bot size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-white sm:hidden" />
              <Building2 size={20} className="text-white hidden sm:block" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">BancaAdvisor</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest hidden sm:block">Consulente Mutui AI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {advisorStatus && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  advisorStatus.ollama_online && advisorStatus.modello_disponibile
                    ? 'bg-green-500'
                    : advisorStatus.ollama_online
                    ? 'bg-amber-500'
                    : 'bg-red-400'
                }`} />
                <span className="text-gray-500 hidden sm:inline">
                  {advisorStatus.ollama_online && advisorStatus.modello_disponibile
                    ? 'Gemma 2B Online'
                    : advisorStatus.ollama_online
                    ? 'Modello non trovato'
                    : 'Ollama Offline'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Navigation - hidden on mobile */}
      <nav className="bg-white border-b border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {navItems.map(({ view, label, icon }) => (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
                  currentView === view
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden safe-bottom">
        <div className="flex justify-around items-center h-14">
          {navItems.map(({ view, shortLabel, icon }) => (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 transition-colors ${
                currentView === view
                  ? 'text-primary-600'
                  : 'text-gray-400'
              }`}
            >
              {icon}
              <span className="text-[10px] font-medium leading-tight">{shortLabel}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
