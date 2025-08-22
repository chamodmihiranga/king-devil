// plugins/ping.js - A simple ping command
// You can use this to check if the bot is alive.

const pingCommand = {
    /**
     * The name of the command
     */
    name: "ping",

    /**
     * A description of the command
     */
    description: "Checks if the bot is responsive.",

    /**
     * The function to execute the command
     * @param {object} sock - Baileys socket instance
     * @param {object} m - The incoming message object
     */
    async execute(sock, m) {
        // Replies "Pong!" to the received message.
        await sock.sendMessage(m.key.remoteJid, { text: "Pong!" }, { quoted: m });
    }
};

export default pingCommand;
