// AI Agent System — Type definitions for SwiftRamadan

export type AgentId = 'support' | 'marketing' | 'chef' | 'rider' | 'vendor' | 'analytics';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  icon: string;           // Emoji icon
  color: string;          // Tailwind color class
  roles: string[];        // Which user roles can access this agent
  systemPrompt: string;
  tools: string[];        // Tool names this agent can use
  greeting: string;       // First message when agent starts
  quickActions: QuickAction[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean';
  description: string;
  required?: boolean;
}

export interface QuickAction {
  label: string;
  prompt: string;
  icon?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  agentId?: AgentId;
  toolCall?: ToolCall;
  toolResult?: unknown;
  timestamp: number;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentContext {
  userId: string;
  email: string;
  role: string;
  userName: string;
  cartItems?: unknown[];
  orders?: unknown[];
  swiftPoints?: number;
  loyaltyTier?: string;
  dietaryPrefs?: string[];
  [key: string]: unknown;
}

export interface AgentResponse {
  message: string;
  toolCalls?: ToolCall[];
  suggestions?: string[];
  agentId: AgentId;
}
