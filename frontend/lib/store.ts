import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type Conversation = {
  id: string
  title: string
  model: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

type LoadingStates = {
  modelLoading: boolean
  modelDeleting: string | null
  modelPulling: string | null
  conversationDeleting: string | null
  exportingData: boolean
  importingData: boolean
}

interface SystemStats {
  ram: {
    total?: number
    used?: number
    usage: number
  }
  cpu: {
    temperature: number
  }
  storage?: {
    total: number
    used: number
    available: number
    usage: number
  }
  ollama: {
    status: 'running' | 'stopped'
  }
}

interface AppState {
  // Chat state
  conversations: Conversation[]
  currentConversationId: string | null
  isStreaming: boolean
  // Model state
  availableModels: { name: string; size: string }[]
  selectedModel: string
  // System state
  systemStats: SystemStats | null
  isMonitoring: boolean
  // Theme state
  theme: 'light' | 'dark' | 'system'
  // UI state
  sidebarOpen: boolean
  settingsOpen: boolean
  shortcutsOpen: boolean
  // Loading states
  loadingStates: LoadingStates
  // Actions
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  deleteConversation: (id: string) => void
  setCurrentConversationId: (id: string | null) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, content: string) => void
  setIsStreaming: (isStreaming: boolean) => void
  setAvailableModels: (models: { name: string; size: string }[]) => void
  setSelectedModel: (model: string) => void
  setSystemStats: (stats: SystemStats) => void
  setIsMonitoring: (isMonitoring: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setSidebarOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setShortcutsOpen: (open: boolean) => void
  setModelLoading: (loading: boolean) => void
  setModelDeleting: (modelId: string | null) => void
  setModelPulling: (modelId: string | null) => void
  setConversationDeleting: (conversationId: string | null) => void
  setExportingData: (exporting: boolean) => void
  setImportingData: (importing: boolean) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      conversations: [],
      currentConversationId: null,
      isStreaming: false,
      availableModels: [],
      selectedModel: 'deepseek-r1:1.5b',
      systemStats: null,
      isMonitoring: false,
      theme: 'system',
      sidebarOpen: true,
      settingsOpen: false,
      shortcutsOpen: false,
      loadingStates: {
        modelLoading: false,
        modelDeleting: null,
        modelPulling: null,
        conversationDeleting: null,
        exportingData: false,
        importingData: false,
      },

      // Actions
      setConversations: (conversations) => set({ conversations }),
      addConversation: (conversation) =>
        set((state) => ({
          conversations: [...state.conversations, conversation],
          currentConversationId: conversation.id,
        })),
      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, ...updates, updatedAt: new Date().toISOString() } : conv
          ),
        })),
      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
          currentConversationId:
            state.currentConversationId === id ? null : state.currentConversationId,
        })),
      setCurrentConversationId: (id) => set({ currentConversationId: id }),
      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: new Date().toISOString(),
                }
              : conv
          ),
        })),
      updateMessage: (conversationId, messageId, content) =>
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, content } : msg
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : conv
          ),
        })),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      setAvailableModels: (models) => set({ availableModels: models }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setSystemStats: (stats) => set({ systemStats: stats }),
      setIsMonitoring: (isMonitoring) => set({ isMonitoring }),
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
      setModelLoading: (loading) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, modelLoading: loading },
        })),
      setModelDeleting: (modelId) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, modelDeleting: modelId },
        })),
      setModelPulling: (modelId) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, modelPulling: modelId },
        })),
      setConversationDeleting: (conversationId) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, conversationDeleting: conversationId },
        })),
      setExportingData: (exporting) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, exportingData: exporting },
        })),
      setImportingData: (importing) =>
        set((state) => ({
          loadingStates: { ...state.loadingStates, importingData: importing },
        })),
    }),
    {
      name: 'deepseek-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        selectedModel: state.selectedModel,
        theme: state.theme,
      }),
    }
  )
) 