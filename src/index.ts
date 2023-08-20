import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import SSEClientsManager from './services/sse'
import { v4 as uuid } from 'uuid'
import cookieParser from 'cookie-parser'

const allowedOrigins = ['http://localhost:3000']
const port = 8080

const sse = new SSEClientsManager()
const app = express()
const router = express.Router()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
)

router.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello world' })
})

router.get('/api/sse-connect', (req, res) => {
  const userName = req.query.name as string

  if (!userName) {
    res.status(500).send()
    return
  }

  const id = uuid()
  sse.register(id, userName, res)

  const payload = {
    uuid: uuid(),
    clientId: id,
    userName,
    message: `User ${id} connected`,
    timestamp: new Date().toISOString()
  }

  sse.broadcast('init', payload)

  sse.broadcast('connected', { ...payload, uuid: uuid() })

  req.on('close', () => {
    sse.broadcast('disconnected', {
      uuid: uuid(),
      clientId: id,
      userName,
      message: `User ${id} disconnected`,
      timestamp: new Date().toISOString()
    })

    setTimeout(() => sse.unregister(id), 100)
    res.end()
  })
})

router.post('/api/sse-broadcast', (req, res) => {
  const clientId = req.cookies?.['sse-client-id'] ?? ''

  if (!clientId) {
    res.status(500).send()
    return
  }

  sse.broadcast('message', {
    uuid: uuid(),
    clientId,
    userName: sse.getClient(clientId)?.userName || '',
    message: req.body.message,
    timestamp: new Date().toISOString()
  })

  res.status(200).send()
})

app.use(router)

app.listen(port, async () => {
  console.log(`Server is running at port ${port}`)
})
