const mongoose = require('mongoose');

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
}

const countrySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true, index: true },
  capital: { type: String, index: true },
  population: Number,
  currency: { name: String, code: String, symbol: String },
  languages: [String],
  region: String,
  flag: String,
  description: String
}, { timestamps: true });

const apiKeySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, uppercase: true },
  key: { type: String, required: true, unique: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null }
});

const Country = mongoose.model('Country', countrySchema);
const ApiKey = mongoose.model('ApiKey', apiKeySchema);

async function autoSeed() {
  const count = await Country.countDocuments();
  if (count > 0) {
    console.log(count + ' countries already in database');
    return;
  }
  console.log('First time: Adding countries to database...');
  const countries = require('./countries.json');
  await Country.insertMany(countries);
  console.log(countries.length + ' countries saved!');
}

module.exports = { connectDB, Country, ApiKey, autoSeed };