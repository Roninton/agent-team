import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import * as cp from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'
import { ConfigService } from '../../config/config.service'
import type { AgentConfig, AgentInstance, AgentStatus } from './types/agent.types'
import { CreateAgentDto } from './dto/create-agent.dto'

@Injectable()
export class AgentService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgentService.name)
  private readonly agents: Map<string, AgentInstance> = new Map()
  private readonly processes: Map<string, cp.ChildProcess> = new Map()
  private readonly DEFAULT_RATE_LIMIT = 5 // 5 messages per minute
  private readonly DEFAULT_RATE_WINDOW = 60 * 1000 // 1 minute in ms
  private agentsDir: string

  constructor(private configService: ConfigService) {
    const dataRoot = this.configService.get<string>('data.root') || './.teamagents/data';
    // 服务运行在src/server目录，需要回退两级到项目根目录，再拼接数据路径
    this.agentsDir = path.resolve(process.cwd(), '../..', dataRoot, 'agents');
  }

  /**
   * Initialize on module start: load saved agents
   */
  async onModuleInit() {
    try {
      // Create agents directory if not exists
      await fs.mkdir(this.agentsDir, { recursive: true })
      
      // Read all agent config files
      const files = await fs.readdir(this.agentsDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const configPath = path.join(this.agentsDir, file)
            const configContent = await fs.readFile(configPath, 'utf-8')
            const config: AgentConfig = JSON.parse(configContent)
            
            // Auto start saved agents
            await this.startAgent(config)
            this.logger.log(`Loaded agent ${config.id} from disk`)
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error)
            this.logger.error(`Failed to load agent config ${file}: ${errMsg}`)
          }
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to initialize agents directory: ${errMsg}`)
    }
  }

  /**
   * Save agent config to disk
   */
  private async saveAgentConfig(config: AgentConfig): Promise<void> {
    try {
      this.logger.log(`Saving agent config: ${config.id} to ${this.agentsDir}`);
      await fs.mkdir(this.agentsDir, { recursive: true })
      const configPath = path.join(this.agentsDir, `${config.id}.json`)
      this.logger.log(`Writing to file: ${configPath}`);
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
      this.logger.log(`Successfully saved agent config: ${configPath}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to save agent config ${config.id}: ${errMsg}`)
      throw error
    }
  }

  /**
   * Delete agent config from disk
   */
  private async deleteAgentConfig(agentId: string): Promise<void> {
    try {
      const configPath = path.join(this.agentsDir, `${agentId}.json`)
      await fs.unlink(configPath)
    } catch (error) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'ENOENT') { // Ignore if file doesn't exist
        const errMsg = error.message
        this.logger.error(`Failed to delete agent config ${agentId}: ${errMsg}`)
        throw error
      }
    }
  }

  /**
   * Get all agent instances
   */
  findAll(): AgentInstance[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get a single agent by ID
   */
  findOne(id: string): AgentInstance | undefined {
    return this.agents.get(id)
  }

  /**
   * Get agent status
   */
  getAgentStatus(id: string): AgentStatus {
    const agent = this.agents.get(id)
    return agent ? agent.status : 'not_found'
  }

  /**
   * Create agent configuration and start it
   */
  async create(createAgentDto: CreateAgentDto): Promise<AgentInstance> {
    const id = createAgentDto.id || `agent-${Date.now()}`
    
    const config: AgentConfig = {
      id,
      name: createAgentDto.name,
      command: createAgentDto.command,
      args: createAgentDto.args || [],
      env: createAgentDto.env || {},
      workingDirectory: createAgentDto.workingDirectory || process.cwd(),
      description: createAgentDto.description,
      icon: createAgentDto.icon,
      maxConcurrentTasks: createAgentDto.maxConcurrentTasks || 1,
      rateLimit: createAgentDto.rateLimit || this.DEFAULT_RATE_LIMIT,
      rateLimitWindow: createAgentDto.rateLimitWindow || this.DEFAULT_RATE_WINDOW,
    }

    // Save config to disk before starting
    await this.saveAgentConfig(config)
    await this.startAgent(config)
    return this.agents.get(id)!
  }

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
      messageTimestamps: [],
    }

    this.agents.set(config.id, agentInstance)
    this.logger.log(`Starting agent: ${config.name} (${config.id})`)

    try {
      // Spawn the agent process
      const agentProcess = cp.spawn(config.command, config.args || [], {
        env: { ...process.env, ...config.env },
        cwd: config.workingDirectory || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      this.processes.set(config.id, agentProcess)

      // Handle process exit
      agentProcess.on('exit', (code, signal) => {
        const agent = this.agents.get(config.id)
        if (agent) {
          agent.status = 'stopped'
          agent.stoppedAt = Date.now()
          this.logger.log(`Agent ${config.name} exited with code ${code}, signal ${signal}`)
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
        this.logger.error(`Agent process error: ${err.message}`)
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

      this.logger.log(`Agent ${config.name} started successfully with PID ${agentProcess.pid}`)
      return config.id
    } catch (err) {
      const agent = this.agents.get(config.id)
      if (agent) {
        agent.status = 'error'
      }
      throw err
    }
  }

  /**
   * Stop a running agent
   */
  async stopAgent(id: string): Promise<void> {
    const agent = this.agents.get(id)
    if (!agent) {
      throw new Error(`Agent ${id} not found`)
    }

    if (agent.status === 'stopped' || agent.status === 'stopping') {
      return
    }

    agent.status = 'stopping'
    const process = this.processes.get(id)

    if (process) {
      process.kill('SIGTERM')
      // Simple delay to allow process cleanup
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    agent.status = 'stopped'
    agent.stoppedAt = Date.now()
    this.processes.delete(id)
    this.logger.log(`Agent ${agent.config.name} stopped`)
  }

  /**
   * Restart an agent
   */
  async restartAgent(id: string): Promise<string> {
    const agent = this.agents.get(id)
    if (!agent) {
      throw new Error(`Agent ${id} not found`)
    }

    if (agent.status === 'running' || agent.status === 'starting') {
      await this.stopAgent(id)
    }

    return this.startAgent(agent.config)
  }

  /**
   * Check if agent can send a message (rate limiting)
   */
  canSendMessage(id: string): boolean {
    const agent = this.agents.get(id)
    if (!agent || agent.status !== 'running') {
      return false
    }

    const now = Date.now()
    const rateLimit = agent.config.rateLimit || this.DEFAULT_RATE_LIMIT
    const rateWindow = agent.config.rateLimitWindow || this.DEFAULT_RATE_WINDOW

    // Clean up old timestamps
    agent.messageTimestamps = agent.messageTimestamps.filter(
      ts => now - ts < rateWindow
    )

    return agent.messageTimestamps.length < rateLimit
  }

  /**
   * Record a message sent for rate limiting
   */
  recordMessage(id: string): void {
    const agent = this.agents.get(id)
    if (agent) {
      agent.messageTimestamps.push(Date.now())
    }
  }

  /**
   * Delete an agent
   */
  async remove(id: string): Promise<void> {
    const agent = this.agents.get(id)
    if (agent && (agent.status === 'running' || agent.status === 'starting')) {
      await this.stopAgent(id)
    }
    this.agents.delete(id)
    // Delete config from disk
    await this.deleteAgentConfig(id)
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    this.logger.log('Cleaning up all agent processes...')
    for (const id of this.agents.keys()) {
      try {
        await this.stopAgent(id)
      } catch (err) {
        this.logger.error(`Error stopping agent ${id}: ${err}`)
      }
    }
  }
}
