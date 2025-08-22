// settings-store.js
// This file manages loading and saving the bot's settings to a JSON file.

import fs from 'fs';
import path from 'path';

// Path to the settings.json file
const settingsFilePath = path.join(process.cwd(), 'settings.json');

// Default settings
const defaultSettings = {
    auto_status_view: true,
    auto_react: true,
    bot_mode: 'online', // 'online' or 'offline'
    prefix: '!',
    allowed_prefixes: ['!', '/', '?', '¢', '&', '.']
};

let settings = {};

// Load settings from settings.json
function loadSettings() {
    try {
        if (fs.existsSync(settingsFilePath)) {
            const data = fs.readFileSync(settingsFilePath, 'utf8');
            // Merge saved settings with defaults to ensure all keys exist
            settings = { ...defaultSettings, ...JSON.parse(data) };
        } else {
            // If the file doesn't exist, create it with default settings
            settings = { ...defaultSettings };
            saveSettings();
        }
    } catch (error) {
        console.error("Error loading settings, using defaults.", error);
        settings = { ...defaultSettings };
    }
}

// Save the current settings to settings.json
function saveSettings() {
    try {
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error("Error saving settings.", error);
    }
}

// Get the current settings object
function getSettings() {
    return settings;
}

// Update a specific setting and save it
function updateSetting(key, value) {
    if (key in settings) {
        // Special check for the prefix to ensure it's an allowed one
        if (key === 'prefix' && !settings.allowed_prefixes.includes(value)) {
            console.log(`Invalid prefix: ${value}. Not in allowed list.`);
            return false; // Invalid prefix
        }
        settings[key] = value;
        saveSettings();
        return true;
    }
    return false; // Key does not exist in settings
}

// Initial load of settings when the bot starts
loadSettings();

export { getSettings, updateSetting };
