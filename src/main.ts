import express from 'express'
import path from 'path'

const app = express()

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req: express.Request, res: express.Response) => {
  res.send('welcome..')
})

const port = process.env.PORT || 9999
app.listen(port, () => `Server is running on port: ${port}`)
