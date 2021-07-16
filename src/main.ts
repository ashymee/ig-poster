import express from 'express'

const app = express()
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('welcome..')
})

const port = process.env.PORT || 9999
app.listen(port, () => `Server is running on port: ${port}`)
