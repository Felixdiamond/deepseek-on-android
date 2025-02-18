import { NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger, AppError, errorCodes, handleApiError } from '@/lib/logger'

const execAsync = promisify(exec)

export async function GET() {
  try {
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

    logger.info('Fetching available models')

    // Get list of models
    const { stdout } = await execAsync('ollama list')
    
    // Parse the output into a structured format
    const models = stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [name, size] = line.split(/\s+/)
        return { name, size }
      })
      .filter(model => model.name.startsWith('deepseek'))

    logger.info('Models fetched successfully', { count: models.length })

    return new Response(JSON.stringify({ models }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { model } = await req.json()

    // Validate input
    if (!model) {
      throw new AppError(
        'Missing model name',
        errorCodes.INVALID_INPUT,
        400
      )
    }

    logger.info('Pulling model', { model })

    // Pull the model
    try {
      const { stdout, stderr } = await execAsync(`ollama pull ${model}`)
      logger.info('Model pulled successfully', { model, stdout })
      
      if (stderr) {
        logger.warn('Model pull warnings', { model, stderr })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Model pulled successfully',
        stdout,
        stderr
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      throw new AppError(
        'Failed to pull model',
        errorCodes.SYSTEM_ERROR,
        500,
        error instanceof Error ? error.message : String(error)
      )
    }
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { model } = await req.json()

    // Validate input
    if (!model) {
      throw new AppError(
        'Missing model name',
        errorCodes.INVALID_INPUT,
        400
      )
    }

    logger.info('Removing model', { model })

    // Remove the model
    try {
      await execAsync(`ollama rm ${model}`)
      logger.info('Model removed successfully', { model })

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Model removed successfully' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      throw new AppError(
        'Failed to remove model',
        errorCodes.SYSTEM_ERROR,
        500,
        error instanceof Error ? error.message : String(error)
      )
    }
  } catch (error) {
    return handleApiError(error)
  }
} 