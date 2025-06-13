require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Charger le catalogue JSON
const catalogue = JSON.parse(fs.readFileSync('./catalogue_machines.json', 'utf-8'));

app.post('/ask', async (req, res) => {
  const { message } = req.body;

  // Créer un résumé simple du catalogue (top 3 à titre d'exemple ici)
  const selection = catalogue.slice(0, 3).map((machine, index) => {
    return `${index + 1}. ${machine.nom} – ${machine.tranche_prix} – ${machine.lait} – ${machine.broyeur}
   ${machine.description.replace(/<[^>]*>?/gm, '').trim()}
   Lien : ${machine.lien || "Non fourni"}`;
  }).join('\n\n');

  const prompt = `Voici la demande d'un client : "${message}"\n\nVoici une sélection de machines disponibles :\n${selection}\n\nRecommande une seule machine parfaitement adaptée, explique pourquoi en 3 points, puis affiche le lien du produit.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: "system", content: "Tu es un expert en machines à café à grains." },
        { role: "user", content: prompt }
      ]
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("Erreur GPT :", error.message);
    res.status(500).json({ error: "Erreur lors de la génération de la réponse GPT." });
  }
});

app.listen(3000, () => {
  console.log('✅ Serveur IA lancé sur http://localhost:3000');
});
