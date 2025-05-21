import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

const app = express()
const PORT = 4000

const __dirname = path.resolve()
const dataPath = path.join(__dirname, 'data', 'reviews.json')

app.use(cors())
app.use(express.json())

app.get('/api/recenzije', (req, res) => {
    const data = fs.readFileSync(dataPath)
    res.json(JSON.parse(data))
})

app.post('/api/recenzije', (req, res) => {
    const nova = req.body
    if (!nova.ime || !nova.komentar) {
        return res.status(400).json({ success: false, message: 'Ime i komentar su obavezni.' })
    }
    const data = JSON.parse(fs.readFileSync(dataPath))
    data.push(nova)
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
    res.json({ success: true })
})

app.listen(PORT, () => {
    console.log(`Server radi na http://localhost:${PORT}`)
})
