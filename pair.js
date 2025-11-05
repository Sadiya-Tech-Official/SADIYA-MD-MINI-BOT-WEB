const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const pino = require('pino');
const logger = pino({ level: 'info' });
const axios = require('axios');
const {
    makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    DisconnectReason,
} = require('@whiskeysockets/baileys');

//=================================
const contextInfo = {
    mentionedJid: [ '' ],
    groupMentions: [],
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
    newsletterName: "SADIYA - MD Updates <╳> 🇱🇰",
    newsletterJid: "120363418172626965@newsletter",
    },
    externalAdReply: {
        title: "SADIYA-MD",
        body: "© Powered By Sadiya Tech",
        sourceUrl: "https://www.youtube.com/@Sadiya-Tech",
        thumbnailUrl: "https://telegra.ph/file/e069027c2178e2c7475c9.jpg",
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: true
}};
let cap = `❌ *Do not share this code with others. Use this to create the SADIYA-MD bot.*\n\n> 📱 *Website :* https://sadiya-md-official.vercel.app/\n\n`; 
//===================================

function removeFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    fs.rmSync(filePath, { recursive: true, force: true });
}
function makeid(num = 4) {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var characters9 = characters.length;
  for (var i = 0; i < num; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters9));
  }
  return result;
}

async function SadiyaPair(id, num, res) {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'temp', id));
    const { version, isLatest } = await fetchLatestBaileysVersion();
    try {
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            printQRInTerminal: false,
            generateHighQualityLinkPreview: true,
            logger: logger,
            syncFullHistory: false,
            browser: Browsers.macOS('Safari'),
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await sock.requestPairingCode(num);
            if (!res.headersSent) {
                res.send({ code });
            }
        }

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                await delay(5000);
                const credsFilePath = path.join(__dirname, 'temp', id, 'creds.json');
                try {
                    const credsData = fs.readFileSync(credsFilePath, 'utf-8');
                    const base64Session = Buffer.from(credsData).toString('base64');
                    const md = "SADIYA-MD~" + base64Session;
                    const codeMessage = await sock.sendMessage(sock.user.id, { text: md });        
                    await sock.sendMessage(sock.user.id, { text: cap, contextInfo }, { quoted: codeMessage });
                } catch (error) {
                    console.log(`Error in connection update: ${error.message}`);
                    const errorMessage = await sock.sendMessage(sock.user.id, { text: error.message });
                    await sock.sendMessage(sock.user.id, { text: cap, contextInfo }, { quoted: errorMessage });
                }
                await sock.ws.close();
                removeFile(path.join(__dirname, 'temp', id));
                console.log(`👤 ${sock.user.id} 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 ✅ 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗽𝗿𝗼𝗰𝗲𝘀𝘀...`);
                process.exit(0);
            } else if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== 401) {
                console.log('Connection closed. Retrying...');
                await delay(10000);
                SadiyaPair(id, num, res);
            }
        });
    } catch (error) {
        console.log(`Error in SadiyaPair: ${error.message}`);
        removeFile(path.join(__dirname, 'temp', id));
        if (!res.headersSent) {
            res.send({ code: "❗ Service Unavailable" });
        }
    }
}

router.get('/', async (req, res) => {
    const id = makeid();
    const num = req.query.number;
    if (!num) {
        return res.status(400).send({ error: 'Number is required' });
    }
    await SadiyaPair(id, num, res);
});

setInterval(() => {
    console.log('☘️ 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗽𝗿𝗼𝗰𝗲𝘀𝘀...');
    process.exit(0);
}, 1800000);

module.exports = router;
