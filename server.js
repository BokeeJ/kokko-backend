import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'

const app = express()
const PORT = process.env.PORT || 4000

// === 1. POVEZIVANJE SA MONGODB ATLAS ===
const uri = 'mongodb+srv://bokeejusthard:zeka@cluster0.ejxukug.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
const client = new MongoClient(uri)
let collection

client.connect().then(() => {
    const db = client.db('kokko')               // ime baze
    collection = db.collection('recenzije')     // ime kolekcije
    console.log('✅ Povezan sa MongoDB Atlas')
}).catch(err => console.error('❌ Greška pri povezivanju sa bazom:', err))

// === 2. MIDDLEWARE ===
app.use(cors())
app.use(express.json())

// === 3. ROUTE: GET sve recenzije ===
app.get('/api/recenzije', async (req, res) => {
    try {
        const svi = await collection.find().toArray()
        res.json(svi)
    } catch (err) {
        res.status(500).json({ success: false, message: 'Greška pri čitanju recenzija.' })
    }
})

// === 4. ROUTE: POST nova recenzija ===
app.post('/api/recenzije', async (req, res) => {
    const nova = req.body
    if (!nova.ime || !nova.komentar) {
        return res.status(400).json({ success: false, message: 'Ime i komentar su obavezni.' })
    }

    try {
        await collection.insertOne(nova)
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ success: false, message: 'Greška pri dodavanju recenzije.' })
    }
})

// === 5. ROUTE: DELETE recenzija po ID-ju (opciono) ===
app.delete('/api/recenzije/:id', async (req, res) => {
    try {
        const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) })
        if (result.deletedCount === 1) {
            res.json({ success: true })
        } else {
            res.status(404).json({ success: false, message: 'Recenzija nije pronađena.' })
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Greška pri brisanju.' })
    }
})

// === 6. START SERVER ===
app.listen(PORT, () => {
    console.log(`🚀 Server radi na portu ${PORT}`)
})
