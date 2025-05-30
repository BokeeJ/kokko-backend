import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'

console.log("🧪 TEST: OVA VERZIJA SERVERA JE UČITANA");

const app = express()
const PORT = process.env.PORT || 4000

// === 1. POVEZIVANJE SA MONGODB ATLAS ===
const uri = 'mongodb+srv://bokeejusthard:Prikolica1@cluster0.ejxukug.mongodb.net/kokko?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);
let collection;

client.connect().then(() => {
    const db = client.db('kokko');
    collection = db.collection('recenzije');
    console.log('✅ Povezan sa MongoDB Atlas');
}).catch(err => console.error('❌ Greška pri povezivanju sa bazom:', err));

// === 2. MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === 3. GET sve recenzije ===
app.get('/api/recenzije', async (req, res) => {
    try {
        const svi = await collection.find().toArray();
        res.json(svi);
    } catch (err) {
        console.error('❌ Greška pri čitanju recenzija:', err.message);
        console.error('📛 Detalji greške:', err);
        res.status(500).json({ success: false, message: 'Greška pri čitanju recenzija.' });
    }
});

// === 4. POST nova recenzija ===
app.post('/api/recenzije', async (req, res) => {
    const nova = req.body;

    if (!nova.ime?.trim() || !nova.komentar?.trim() || isNaN(nova.ocena)) {
        return res.status(400).json({ success: false, message: 'Ime, komentar i ocena su obavezni.' });
    }

    // Dohvati IP adresu korisnika
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const clientIp = ip.split(',')[0].trim();

    // Proveri da li je već poslao recenziju danas
    const danas = new Date();
    danas.setHours(0, 0, 0, 0);

    const duplikat = await collection.findOne({
        ip: clientIp,
        datum: { $gte: danas }
    });

    if (duplikat) {
        return res.status(403).json({ success: false, message: 'Već ste ostavili recenziju danas.' });
    }

    nova.ocena = Number(nova.ocena);
    nova.datum = new Date();
    nova.ip = clientIp;

    console.log('📦 Pokušaj upisa dokumenta:', nova);

    try {
        await collection.insertOne(nova);
        console.log('✅ Upis uspešan');
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Greška pri dodavanju:', err.message);
        console.error('📛 Detalji greške:', err);
        res.status(500).json({ success: false, message: 'Greška pri dodavanju recenzije.' });
    }
});

// === 5. DELETE recenzija po ID-ju ===
app.delete('/api/recenzije/:id', async (req, res) => {
    try {
        const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 1) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Recenzija nije pronađena.' });
        }
    } catch (err) {
        console.error('❌ Greška pri brisanju:', err.message);
        res.status(500).json({ success: false, message: 'Greška pri brisanju recenzije.' });
    }
});

// === 6. START SERVER ===
app.listen(PORT, () => {
    console.log(`🚀 Server radi na portu ${PORT}`);
});
