import { Response } from 'express'

export type ClientType = {
  id: string
  userName: string
  connection: Response
}

export type EventType = 'connected' | 'message' | 'disconnected' | 'init' | 'ping'
