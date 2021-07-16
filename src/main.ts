import express from 'express'

const app = express()
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('Halo halo hai')
})

const port = process.env.PORT || 9999
app.listen(port, () => `Server is running on port: ${port}`)
