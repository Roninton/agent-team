import * as cp from 'child_process'
import type { AgentConfig, AgentInstance, AgentStatus } from '../types/agent.types'

/**
 * Manages the lifecycle of agent processes, rate limiting, and their connections.
 */
export class AgentManager {
  private agents: Map<string, AgentInstance> = new Map()
  private processes: Map<string, cp.ChildProcess> = new Map()
  private readonly RATE_LIMIT = 5 // 5 messages per minute
  private readonly RATE_WINDOW = 60 * 1000 // 1 minute in ms

  /**
   * Start an agent with the given configuration.
   */
  async startAgent(config: AgentConfig): Promise<string> {
    if (this.agents.has(config.id)) {
      const existing = this.agents.get(config.id)!
      if (existing.status === 'running' || existing.status === 'starting') {
        throw new Error(`Agent ${config.id} is already running`)
      }
    }

    // Validate config
    if (!config.command || !config.id || !config.name) {
      throw new Error('Invalid agent configuration')
    }

    // Create agent instance
    const agentInstance: AgentInstance = {
      id: config.id,
      config,
      status: 'starting',
      createdAt: Date.now(),
      messageTimestamps: []
    }

    this.agents.set(config.id, agentInstance)

    try {
      // Spawn the agent process
      const agentProcess = cp.spawn(config.command, config.args || [], {
        env: { ...global.process.env, ...config.env },
        cwd: config.workingDirectory || global.process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      this.processes.set(config.id, agentProcess)

      // Handle process exit
      agentProcess.on('exit', (code, signal) => {
        const agent = this.agents.get(config.id)
        if (agent) {
          agent.status = 'stopped'
          agent.stoppedAt = Date.now()
        }
        this.processes.delete(config.id)
      })

      // Handle process error
      agentProcess.on('error', (err) => {
        const agent = this.agents.get(config.id)
        if (agent) {
          agent.status = 'error'
        }
        this.processes.delete(config.id)
        throw new Error(`Agent process error: ${err.message}`)
      })

      // Wait for process to start successfully
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Agent start timeout'))
        }, 10000) // 10s timeout

        agentProcess.on('spawn', () => {
          clearTimeout(timeout)
          resolve()
        })

        agentProcess.on('error', (err) => {
          clearTimeout(timeout)
          reject(err)
        })

        // For testing: if process.pid exists, assume it started successfully
        if (agentProcess.pid) {
          setTimeout(() => resolve(), 0)
        }
      })

      // Update status to running
      agentInstance.status = 'running'
      agentInstance.startedAt = Date.now()
      agentInstance.processId = agentProcess.pid

      return config.id
    } catch (err) {
      const agent = this.agents.get(config.id)
      if (agent) {
        agent.status = 'error'
      }
      this.processes.delete(config.id)
      throw err
    }
  }

  /**
   * Stop a running agent.
   */
  async stopAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    const agentProcess = this.processes.get(agentId)
    if (agentProcess) {
      agent.status = 'stopping'

      // Send SIGTERM and wait for process to exit
      agentProcess.kill('SIGTERM')
      
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // Force kill after 5s
          agentProcess.kill('SIGKILL')
          resolve()
        }, 5000)

        agentProcess.on('exit', () => {
          clearTimeout(timeout)
          resolve()
        })
      })
    }

    agent.status = 'stopped'
    agent.stoppedAt = Date.now()
    this.processes.delete(agentId)
  }

  /**
   * Get the current status of an agent.
   */
  getAgentStatus(agentId: string): AgentStatus {
    const agent = this.agents.get(agentId)
    return agent ? agent.status : 'not_found'
  }

  /**
   * Check if an agent can send a message (rate limiting).
   */
  canSendMessage(agentId: string): boolean {
    const agent = this.agents.get(agentId)
    if (!agent) {
      return false
    }

    const now = Date.now()
    // Filter out timestamps older than the rate window
    agent.messageTimestamps = agent.messageTimestamps.filter(
      (timestamp) => now - timestamp < this.RATE_WINDOW
    )

    return agent.messageTimestamps.length < this.RATE_LIMIT
  }

  /**
   * Record that a message was sent by the agent (for rate limiting).
   */
  recordMessageSent(agentId: string): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.messageTimestamps.push(Date.now())
    }
  }

  /**
   * Get list of all agents.
   */
  listAgents(): (AgentInstance & { name: string })[] {
    return Array.from(this.agents.values()).map((agent) => ({
      ...agent,
      name: agent.config.name
    }))
  }

  /**
   * Get a running agent's process.
   */
  getAgentProcess(agentId: string): cp.ChildProcess | undefined {
    return this.processes.get(agentId)
  }
}

