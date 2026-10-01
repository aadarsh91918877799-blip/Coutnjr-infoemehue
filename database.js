async function autoSeed() {
  const count = await Country.countDocuments();
  if (count > 0) {
    console.log(count + ' countries already in database');
    return;
  }

  console.log('First time: Adding countries to database...');
  const raw = require('./countries.json');

  // Convert mledoze format → our schema
  const countries = raw
    .filter(c => c.cca2 && c.name && c.name.common)   // skip invalid entries
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

      // Flag emoji from cca2
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
