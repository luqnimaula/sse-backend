import { CookieOptions, Response } from 'express'
import { PayloadType } from 'interfaces/payload'
import { ClientType, EventType } from 'interfaces/sse'

class SSEClientsManager {
  clients: ClientType[] = []

  constructor() {
    this.clients = []
  }

  register = (id: string, userName: string, connection: Response) => {
    // Please set httpOnly=true for production mode & secured by HTTPS
    const cookieOptions: CookieOptions = {
      maxAge: 24 * 3600000, // 1 hour x 24 = 1 day
      httpOnly: false,
      secure: true,
      sameSite: 'none'
    }

    connection.cookie('sse-client-id', id, cookieOptions)
    connection.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=UTF-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    this.clients.push({ id, userName, connection })
  }

  unregister = (id: string) => {
    this.clients = this.clients.filter((c) => c.id !== id)
  }

  broadcast = (event: EventType, payload: PayloadType) => {
    this.clients.map((client) => {
      if (event === 'init') {
        if (client.id === payload.clientId) {
          client.connection.write(`event: ${event}\n`)
          client.connection.write(`data: ${JSON.stringify(payload)}\n\n`)
        }
      } else {
        client.connection.write(`event: ${event}\n`)
        client.connection.write(`data: ${JSON.stringify(payload)}\n\n`)
      }
    })
  }

  getClient = (id: string): ClientType | undefined => {
    return this.clients.find((client) => client.id === id)
  }
}

export default SSEClientsManager
