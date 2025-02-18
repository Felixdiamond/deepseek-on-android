import { NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger, AppError, errorCodes, handleApiError } from '@/lib/logger'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { model, prompt } = await req.json()

    // Validate input
    if (!model || !prompt) {
      throw new AppError(
        'Missing model or prompt',
        errorCodes.INVALID_INPUT,
        400
      )
    }

    // Check if Ollama is running
    try {
      await execAsync('pgrep ollama')
    } catch {
      throw new AppError(
        'Ollama service is not running',
        errorCodes.OLLAMA_NOT_RUNNING,
        503
      )
    }

    logger.info('Starting chat session', { model, prompt: prompt.slice(0, 100) + '...' })

    // Create a TransformStream for streaming
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Start the Ollama process
    const ollamaProcess = exec(`ollama run ${model}`, {
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    })

    // Write prompt to Ollama
    ollamaProcess.stdin?.write(prompt + '\n')
    ollamaProcess.stdin?.end()

    // Handle Ollama output
    ollamaProcess.stdout?.on('data', async (data: Buffer) => {
      try {
        await writer.write(new TextEncoder().encode(data.toString()))
      } catch (error) {
        logger.error('Error writing to stream', error)
      }
    })

    // Handle Ollama errors
    ollamaProcess.stderr?.on('data', (data: Buffer) => {
      logger.warn('Ollama warning', data.toString())
    })

    // Handle process completion
    ollamaProcess.on('close', async (code: number) => {
      try {
        if (code === 0) {
          logger.info('Chat session completed successfully')
          await writer.close()
        } else {
          const errorMessage = `Process exited with code ${code}`
          logger.error(errorMessage)
          await writer.write(new TextEncoder().encode(JSON.stringify({ error: errorMessage })))
          await writer.close()
        }
      } catch (error) {
        logger.error('Error closing stream', error)
      }
    })

    // Return the readable stream
    return new Response(stream.readable, {
      headers: { 'Content-Type': 'text/event-stream' }
    })
  } catch (error) {
    return handleApiError(error)
  }
} 