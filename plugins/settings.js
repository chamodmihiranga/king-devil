// plugins/settings.js
// This command allows the bot owner to view and manage the bot's settings.

import { getSettings, updateSetting } from '../settings-store.js';
import Config from '../Config.js'; // Import configuration file

const command = {
    name: 'settings',
    description: 'Manage bot settings.',
    async execute(sock, m, args) {
        const currentSettings = getSettings();
        
        // --- Owner Verification ---
        // Get owner JID from the Config.js file
        const configOwnerJid = `${Config.ownerNumber}@s.whatsapp.net`;
        
        // Get the bot's own JID
        const botJid = sock.user.id;

        // Create a list of all owner JIDs
        const ownerJids = [configOwnerJid, botJid];

        // Check if the message sender is an owner
        const senderJid = m.key.participant || m.key.remoteJid;
        const isOwner = ownerJids.includes(senderJid);

        // --- Command Logic ---
        if (args.length === 0) {
            // If no arguments, display the current settings menu
            let statusText = `*🤖 Bot Settings 🤖*\n\n`;
            statusText += `Here are the current settings. To change a setting, use the provided command.\n\n`;
            statusText += `1. *Auto Status View*: ${currentSettings.auto_status_view ? '✅ ON' : '❌ OFF'}\n`;
            statusText += `   - _Command: .settings autostatus [on/off]_\n\n`;
            statusText += `2. *Auto React*: ${currentSettings.auto_react ? '✅ ON' : '❌ OFF'}\n`;
            statusText += `   - _Command: .settings autoreact [on/off]_\n\n`;
            statusText += `3. *Bot Mode*: ${currentSettings.bot_mode.toUpperCase()}\n`;
            statusText += `   - _Command: .settings botmode [online/offline]_\n\n`;
            statusText += `4. *Prefix*: \`${currentSettings.prefix}\`\n`;
            statusText += `   - _Command: .settings prefix [symbol]_\n`;
            statusText += `   - _Allowed: ${currentSettings.allowed_prefixes.join(', ')}_\n\n`;
            statusText += `*Example*: To turn off auto react, type \`.settings autoreact off\``;

            await sock.sendMessage(m.key.remoteJid, { text: statusText }, { quoted: m });

        } else {
            // If there are arguments, attempt to change a setting
            
            // First, ensure the user is an owner
            if (!isOwner) {
                return await sock.sendMessage(m.key.remoteJid, { text: "⚠️ *Access Denied!* Only the bot owner can change settings." }, { quoted: m });
            }

            const settingToChange = args[0]?.toLowerCase();
            const value = args[1]?.toLowerCase();

            // Check for valid command structure
            if (!settingToChange || !value) {
                return await sock.sendMessage(m.key.remoteJid, { text: "Invalid command format. Use `.settings <option> <value>`." }, { quoted: m });
            }

            let success = false;
            let feedbackMessage = '';

            // Use a switch to handle different settings
            switch (settingToChange) {
                case 'autostatus':
                    if (['on', 'off'].includes(value)) {
                        success = updateSetting('auto_status_view', value === 'on');
                        feedbackMessage = `✅ Auto Status View has been turned ${value.toUpperCase()}.`;
                    }
                    break;
                case 'autoreact':
                    if (['on', 'off'].includes(value)) {
                        success = updateSetting('auto_react', value === 'on');
                        feedbackMessage = `✅ Auto React has been turned ${value.toUpperCase()}.`;
                    }
                    break;
                case 'botmode':
                    if (['online', 'offline'].includes(value)) {
                        success = updateSetting('bot_mode', value);
                        feedbackMessage = `✅ Bot mode set to ${value.toUpperCase()}.\n\n_Please restart the bot for this change to take full effect._`;
                    }
                    break;
                case 'prefix':
                    const { allowed_prefixes } = getSettings();
                    if (allowed_prefixes.includes(value)) {
                        success = updateSetting('prefix', value);
                        feedbackMessage = `✅ Prefix has been set to \`${value}\`.`;
                    } else {
                        feedbackMessage = `❌ Invalid prefix. Allowed prefixes are: ${allowed_prefixes.join(', ')}`;
                    }
                    break;
                default:
                    feedbackMessage = `❌ Unknown setting: \`${settingToChange}\`.`;
                    break;
            }

            if (!success && !feedbackMessage) {
                feedbackMessage = "❌ Invalid value for the setting.";
            }

            // Send feedback to the user
            await sock.sendMessage(m.key.remoteJid, { text: feedbackMessage }, { quoted: m });
        }
    }
};

export default command;
