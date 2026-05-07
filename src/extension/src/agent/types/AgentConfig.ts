import * as vscode from 'vscode';

/**
 * Configuration for a single ACP agent.
 */
export interface AgentConfigEntry {
  /** NPX package to run (e.g., "@anthropic-ai/claude-code@latest") */
  command: string;
  /** Command-line arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Display name */
  displayName?: string;
}

export interface AgentConfig {
  id: string
  name: string
  command: string
  args: string[]
  env: Record<string, string>
  workingDirectory: string
  description?: string
  icon?: string
  maxConcurrentTasks?: number
}

export type AgentStatus = 'not_found' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'

export interface AgentInstance {
  id: string
  config: AgentConfig
  status: AgentStatus
  processId?: number
  createdAt: number
  startedAt?: number
  stoppedAt?: number
  messageTimestamps: number[]
}

/**
 * Read agent configurations from VS Code settings.
 * Returns a map of agent name → config.
 */
export function getAgentConfigs(): Record<string, AgentConfigEntry> {
  const config = vscode.workspace.getConfiguration('acp');
  const agents = config.get<Record<string, AgentConfigEntry>>('agents', {});
  return agents;
}

/**
 * Get the list of agent names available.
 */
export function getAgentNames(): string[] {
  return Object.keys(getAgentConfigs());
}

/**
 * Get a specific agent config by name.
 */
export function getAgentConfig(name: string): AgentConfigEntry | undefined {
  return getAgentConfigs()[name];
}
