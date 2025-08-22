// index.js - The main file for the bot (ESM Version)

import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
} from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Config from "./Config.js"; // Note the .js extension

// A store to keep message data
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

// A Map to hold the commands
const commands = new Map();

// Get the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load commands from the 'plugins' directory
const pluginsDir = path.join(__dirname, "plugins");
const commandFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    try {
        // Use dynamic import() for ES modules
        const filePath = path.join(pluginsDir, file);
        const moduleURL = new URL(`file://${filePath}`);
        const { default: command } = await import(moduleURL);

        if (command && command.name) {
            commands.set(command.name, command);
            console.log(`✅ Successfully loaded command: '${command.name}'`);
        }
    } catch (error) {
        console.error(`❌ Error loading command from '${file}':`, error);
    }
}


async function startBot() {
    // Save the session
    const { state, saveCreds } = await useMultiFileAuthState(Config.sessionName);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using Baileys v${version.join(".")}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true, // To show the QR code in the terminal
        auth: state,
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }
            return {
                conversation: "Bot message"
            };
        }
    });

    store?.bind(sock.ev);

    // Handle connection updates
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("QR code received, please scan.");
        }
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed due to: ", lastDisconnect.error, ", Reconnecting: ", shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === "open") {
            console.log("✅ Successfully connected to WhatsApp!");
        }
    });

    // Save credentials
    sock.ev.on("creds.update", saveCreds);

    // Handle incoming messages
    sock.ev.on("messages.upsert", async (mek) => {
        try {
            const m = mek.messages[0];
            if (!m.message) return;
            if (m.key && m.key.remoteJid === "status@broadcast") return; // Ignore status updates
            if (m.key.fromMe) return; // Ignore self messages

            const messageType = Object.keys(m.message)[0];
            const body = (messageType === 'conversation') ? m.message.conversation :
                         (messageType === 'extendedTextMessage') ? m.message.extendedTextMessage.text : '';

            // Check if the message starts with the prefix
            if (body && body.startsWith(Config.prefix)) {
                const args = body.slice(Config.prefix.length).trim().split(/ +/);
                const commandName = args.shift().toLowerCase();

                const command = commands.get(commandName);

                if (command) {
                    try {
                        // Execute the command
                        await command.execute(sock, m, args);
                    } catch (error) {
                        console.error(`Error executing command '${commandName}':`, error);
                        await sock.sendMessage(m.key.remoteJid, { text: "An error occurred while executing the command." }, { quoted: m });
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }
    });
}

// Start the bot
startBot();
