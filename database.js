const mongoose = require('mongoose');

// ===== CONNECT TO MONGODB =====
async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
}

// ===== COUNTRY SCHEMA =====
const countrySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true, index: true },
  capital: { type: String, index: true },
  population: Number,
  currency: {
    name: String,
    code: String,
    symbol: String
  },
  languages: [String],
  region: String,
  flag: String,
  description: String
}, { timestamps: true });

// ===== API KEY SCHEMA =====
const apiKeySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, uppercase: true },
  key: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null }
});

// ===== MODELS =====
const Country = mongoose.model('Country', countrySchema);
const ApiKey = mongoose.model('ApiKey', apiKeySchema);

// ===== AUTO SEED (Converts mledoze format to our schema) =====
async function autoSeed() {
  const count = await Country.countDocuments();
  if (count > 0) {
    console.log(count + ' countries already in database');
    return;
  }

  console.log('First time: Adding countries to database...');
  const raw = require('./countries.json');

  const countries = raw
    .filter(c => c.cca2 && c.name && c.name.common)
    .map(c => {
      const capital = Array.isArray(c.capital) ? (c.capital[0] || 'N/A') : (c.capital || 'N/A');
      const region = c.region || 'N/A';
      const popMillions = ((c.population || 0) / 1000000).toFixed(1);

      // Currency
      let currency = { name: 'N/A', code: 'N/A', symbol: 'N/A' };
      if (c.currencies) {
        const entry = Object.entries(c.currencies)[0];
        if (entry) {
          currency = {
            name: entry[1].name || 'N/A',
            code: entry[0],
            symbol: entry[1].symbol || entry[0]
          };
        }
      }

      // Languages
      const languages = c.languages ? Object.values(c.languages) : ['N/A'];

      // Flag
      const flag = c.flag || '🏳️';

      return {
        code: c.cca2.toUpperCase(),
        name: c.name.common,
        capital: capital,
        population: c.population || 0,
        currency: currency,
        languages: languages.length ? languages : ['N/A'],
        region: region,
        flag: flag,
        description: c.name.common + ' is a country in ' + region + '. Its capital is ' + capital + ' and the population is approximately ' + popMillions + ' million. The official currency is ' + currency.name + ' and people speak ' + languages.join(', ') + '.'
      };
    });

  await Country.insertMany(countries);
  console.log(countries.length + ' countries saved!');
}

// ===== EXPORTS (Ye line ZAROORI hai) =====
module.exports = { connectDB, Country, ApiKey, autoSeed };
