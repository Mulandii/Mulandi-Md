const makeWASocket = require("@whiskeysockets/baileys").default;
const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
const util = require("util");
const { useMultiFileAuthState, jidDecode, makeInMemoryStore, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const logger = require("@whiskeysockets/baileys/lib/Utils/logger").default;
const pino = require("pino");
const gp = ["254701118127"];
const fs = require("fs");
const figlet = require("figlet");
const chalk = require("chalk");
const os = require("os");
const speed = require("performance-now");
const timestampe = speed();
const dreadedspeed = speed() - timestampe;

const spinnies = new (require('spinnies'))();

const { Boom } = require("@hapi/boom");
const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};


// const { Socket } = Extra;
global.store = makeInMemoryStore({
  logger: pino().child({
    level: 'silent',
    stream: 'store'
  })
});

function smsg(m, conn) {
  if (!m) return;
  let M = proto.WebMessageInfo;
  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat.endsWith("@g.us");
    m.sender = conn.decodeJid((m.fromMe && conn.user.id) || m.participant || m.key.participant || m.chat || "");
    if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || "";
  }
  return m;
}

async function main() {
  // const main = async () => {

  const { state, saveCreds } = await useMultiFileAuthState('session');
  console.log(
    color(
      figlet.textSync("MULANDI  BOT", {
        font: "Standard",
        horizontalLayout: "default",
        vertivalLayout: "default",
        whitespaceBreak: false,
      }),
      "red"
    )
  );

  const sock = makeWASocket({
    logger: pino({
      level: 'silent'
    }),
    printQRInTerminal: true,
    browser: ['Dreaded Active', 'safari', '1.0.0'],
    auth: state,
    qrTimeout: 20000000,
  });

  sock.ev.on('messages.upsert', async chatUpdate => {
    m = chatUpdate.messages[0];
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.sender = sock.decodeJid((m.fromMe && sock.user.id) || m.participant || m.key.participant || m.chat);

    const groupMetadata = m.isGroup ? await sock.groupMetadata(m.chat).catch((e) => {}) : "";
    const groupName = m.isGroup ? groupMetadata.subject : "";

    if (!m.message) return;

    if (m.chat.endsWith('@s.whatsapp.net')) {
              sock.sendPresenceUpdate('recording', m.chat)
    }      if (m.chat.endsWith('broadcast')) {
    sock.readMessages([m.key]);
      const status = 'I used to think am just dreaming '
await sock.updateProfileStatus(status);
    }
   
  });
    sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  sock.ev.on('connection.update', async (update) => {
    const {
      connection,
      lastDisconnect,
      qr
    } = update;
    if (lastDisconnect == 'undefined' && qr != 'undefined') {
      qrcode.generate(qr, {
        small: true
      });
    }
    if (connection === 'connecting') {
      spinnies.add('start', {
        text: 'Connecting Now. . .'
      });
    } else if (connection === 'open') {
      spinnies.succeed('start', {
        text: `Successfully Connected. You have logged in as ${sock.user.name}`
      });
    } else if (connection === 'close') {
      if (lastDisconnect.error.output.statusCode == DisconnectReason.loggedOut) {
        spinnies.fail('start', {
          text: `Can't connect!`
        });

        process.exit(0);
      } else {
        main().catch(() => main());
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
};

main();
