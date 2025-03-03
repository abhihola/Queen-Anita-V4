const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { exec } = require('child_process');

const app = express();
const port = 3000;
const envPath = path.join(__dirname, '.env');

// Load environment variables from .env
dotenv.config({ path: envPath });

// Utility function to read .env and parse it into an object
function readEnv() {
  let envConfig = {};
  try {
    const data = fs.readFileSync(envPath, 'utf8');
    const lines = data.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      const index = line.indexOf('=');
      if (index > -1) {
        const key = line.substring(0, index).trim();
        let value = line.substring(index + 1).trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        envConfig[key] = value;
      }
    }
  } catch (err) {
    console.error('Error reading .env:', err);
  }
  return envConfig;
}

// Utility function to write an object back to .env
function writeEnv(envObj) {
  let content = '';
  for (const key in envObj) {
    content += `${key}="${envObj[key]}"\n`;
  }
  fs.writeFileSync(envPath, content, 'utf8');
}

// Middleware to parse JSON requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the project root (so septorch.html is accessible)
app.use(express.static(__dirname));

// Serve septorch.html as the default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'septorch.html'));
});

// GET /api/settings: Returns current configuration from .env
app.get('/api/settings', (req, res) => {
  try {
    const config = readEnv();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// POST /api/settings: Update configuration in .env
app.post('/api/settings', (req, res) => {
  try {
    const newSettings = req.body;
    let currentConfig = readEnv();
    // Update keys with new values
    for (const key in newSettings) {
      if (newSettings.hasOwnProperty(key)) {
        // Special handling for SESSION_ID: Append new value with ;_;
        if (key === 'SESSION_ID') {
          if (currentConfig[key]) {
            // If new value isn't already part of the string, append it
            if (!currentConfig[key].includes(newSettings[key])) {
              currentConfig[key] = currentConfig[key] + ";_;" + newSettings[key];
            }
          } else {
            currentConfig[key] = newSettings[key];
          }
        } else {
          currentConfig[key] = newSettings[key];
        }
      }
    }
    // Write the updated configuration back to .env
    writeEnv(currentConfig);
    res.json({ message: 'Settings updated and applied!' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// POST /api/reset-settings: Reset configuration to defaults
app.post('/api/reset-settings', (req, res) => {
  try {
    const defaultSettings = {
      SESSION_ID: 'levanter_septorch;_;levanter_Antarimedia;_;levanter_VICTORCEEI;_;levanter_1795deb488d3574777b6483764bdaa6db8',
      VPS: 'true',
      AUTO_STATUS_VIEW: 'false'
      // Add any other default keys as needed.
    };
    writeEnv(defaultSettings);
    res.json({ message: 'Settings reset to defaults successfully!' });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings.' });
  }
});

// (Optional) POST /api/deploy: Run "npm start" on the server
// app.post('/api/deploy', (req, res) => {
//   exec('npm start', (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Deployment error: ${error}`);
//       return res.status(500).json({ error: 'Deployment failed.' });
//     }
//     res.json({ message: 'Deployment started!', output: stdout });
//   });
// });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
