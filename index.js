const path = require('path')
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { init: initDB, Counter } = require('./db')

const logger = morgan('tiny')
const app = express()
const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', (socket) => {
  io.emit('44', { hello: '你好' })
})
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())
app.use(logger)

// 首页
app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// 更新计数
app.post('/api/count', async (req, res) => {
  const { action } = req.body
  if (action === 'inc') {
    await Counter.create()
  } else if (action === 'clear') {
    await Counter.destroy({
      truncate: true
    })
  }
  res.send({
    code: 0,
    data: await Counter.count()
  })
})

// 获取计数
app.get('/api/count', async (req, res) => {
  const result = await Counter.count()
  io.emit('44', { count: result })
  res.send({
    code: 0,
    data: result
  })
})

// 小程序调用，获取微信 Open ID
app.get('/api/wx_openid', async (req, res) => {
  if (req.headers['x-wx-source']) {
    res.send(req.headers['x-wx-openid'])
  }
})



const port = process.env.PORT || 80

async function bootstrap() {
  await initDB()
  app.start = app.listen = function () {
    return server.listen.apply(server, arguments)
  }
  console.log('server start port', port)
  app.start(port)
}

bootstrap();

