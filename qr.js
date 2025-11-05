const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const axios = require('axios');
const path = require('path');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");

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

async function SadiyaPair(id, res) {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'temp', id));
    try {
        let sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({
                level: "silent"
            }),
            browser: Browsers.macOS("Desktop"),
        });
        
        sock.ev.on('creds.update', saveCreds);
        sock.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect, qr } = s;
            if (qr) await res.end(await QRCode.toBuffer(qr));

            if (connection == "open") {
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

                await delay(10);
                await sock.ws.close();
                await removeFile('./temp/' + id);
                console.log(`👤 ${sock.user.id} 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 ✅ 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗽𝗿𝗼𝗰𝗲𝘀𝘀...`);
                await delay(10);
                process.exit();
            } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                console.log('Connection closed. Retrying...');
                await delay(10000);
                SadiyaPair(id, res);
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
    await SadiyaPair(id, res);
});

setInterval(() => {
    console.log('☘️ 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗽𝗿𝗼𝗰𝗲𝘀𝘀...');
    process.exit(0);
}, 1800000);

module.exports = router;

