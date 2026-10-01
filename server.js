const express = require('express');
const cors = require('cors');
const { connectDB, Country, ApiKey, autoSeed } = require('./database');

// ===== SECRETS (YAHAN APNI VALUES DAALO) =====
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://countryadmin:Country2025@cluster0.caysqxw.mongodb.net/countrydb?appName=Cluster0';
process.env.PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

connectDB().then(autoSeed);

// ===== API KEY MIDDLEWARE =====
async function checkApiKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;

  if (!key) {
    return res.status(401).json({
      success: false,
      error: 'API key missing. Add "x-api-key" header or "key" query parameter.',
      developer: 'Developer : @IMMORTALERA'
    });
  }

  const apiKey = await ApiKey.findOne({ key });

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      developer: 'Developer : @IMMORTALERA'
    });
  }

  if (!apiKey.active) {
    return res.status(403).json({
      success: false,
      error: 'This key is revoked',
      developer: 'Developer : @IMMORTALERA'
    });
  }

  next();
}

// ===== ROOT =====
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Country API is running',
    developer: 'Developer : @IMMORTALERA'
  });
});

// ===== MAIN ENDPOINT =====
// /api/country/info/latest/v/1/developer/immortalera?query=india
app.get('/api/country/info/latest/v/1/developer/immortalera', checkApiKey, async (req, res) => {
  const q = (req.query.query || '').trim();

  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Please provide ?query=<country name or capital>',
      example: '/api/country/info/latest/v/1/developer/immortalera?query=india',
      developer: 'Developer : @IMMORTALERA'
    });
  }

  try {
    const exact = new RegExp('^' + q + '$', 'i');
    const partial = new RegExp(q, 'i');

    let country = await Country.findOne({
      $or: [{ name: exact }, { capital: exact }, { code: exact }]
    }).select('-__v -_id');

    if (!country) {
      country = await Country.findOne({
        $or: [{ name: partial }, { capital: partial }]
      }).select('-__v -_id');
    }

    if (!country) {
      return res.status(404).json({
        success: false,
        error: 'No country found for "' + q + '"',
        developer: 'Developer : @IMMORTALERA'
      });
    }

    res.json({
      success: true,
      query: q,
      data: country,
      developer: 'Developer : @IMMORTALERA'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      developer: 'Developer : @IMMORTALERA'
    });
  }
});

// ===== ALL COUNTRIES =====
app.get('/api/country/info/latest/v/1/developer/immortalera/all', checkApiKey, async (req, res) => {
  try {
    const countries = await Country.find().select('-__v -_id');
    res.json({
      success: true,
      count: countries.length,
      data: countries,
      developer: 'Developer : @IMMORTALERA'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      developer: 'Developer : @IMMORTALERA'
    });
  }
});

// ===== REGION FILTER =====
app.get('/api/country/info/latest/v/1/developer/immortalera/region/:region', checkApiKey, async (req, res) => {
  try {
    const results = await Country.find({
      region: { $regex: '^' + req.params.region + '$', $options: 'i' }
    }).select('-__v -_id');

    res.json({
      success: true,
      count: results.length,
      data: results,
      developer: 'Developer : @IMMORTALERA'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      developer: 'Developer : @IMMORTALERA'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));