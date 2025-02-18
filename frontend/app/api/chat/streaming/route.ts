import { NextRequest } from 'next/server'
import { exec } from 'node:child_process'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const model = searchParams.get('model')
  
  if (!model) {
    return new Response('Missing model parameter', { status: 400 })
  }

  // Create a transform stream for server-sent events
  const encoder = new TextEncoder()
  const stream = new TransformStream({
    transform(chunk: string, controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
    },
  })

  const writer = stream.writable.getWriter()

  // Start the Ollama process
  const ollamaProcess = exec(`ollama run ${model}`, {
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  })

  // Handle Ollama output
  ollamaProcess.stdout?.on('data', async (data: Buffer) => {
    try {
      await writer.write(data.toString())
    } catch (error) {
      console.error('Error writing to stream:', error)
    }
  })

  // Handle Ollama errors
  ollamaProcess.stderr?.on('data', (data: Buffer) => {
    console.error('Ollama error:', data.toString())
  })

  // Handle process completion
  ollamaProcess.on('close', async (code: number) => {
    try {
      if (code !== 0) {
        const errorMessage = `Process exited with code ${code}`
        await writer.write(JSON.stringify({ error: errorMessage }))
      }
      await writer.close()
    } catch (error) {
      console.error('Error closing stream:', error)
    }
  })

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export async function POST(req: NextRequest) {
  const { model, prompt } = await req.json()

  if (!model || !prompt) {
    return new Response(JSON.stringify({ error: 'Missing model or prompt' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Create a transform stream for server-sent events
  const encoder = new TextEncoder()
  const stream = new TransformStream({
    transform(chunk: string, controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
    },
  })

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
      await writer.write(data.toString())
    } catch (error) {
      console.error('Error writing to stream:', error)
    }
  })

  // Handle Ollama errors
  ollamaProcess.stderr?.on('data', (data: Buffer) => {
    console.error('Ollama error:', data.toString())
  })

  // Handle process completion
  ollamaProcess.on('close', async (code: number) => {
    try {
      if (code !== 0) {
        const errorMessage = `Process exited with code ${code}`
        await writer.write(JSON.stringify({ error: errorMessage }))
      }
      await writer.close()
    } catch (error) {
      console.error('Error closing stream:', error)
    }
  })

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
} 