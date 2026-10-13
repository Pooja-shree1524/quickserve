// Quick SMTP sanity test
import * as net from 'net'
import axios from 'axios'

async function sendRawEmail(host, port, from, to) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, host, () => {
      let state = 0
      const lines = []
      const send = (l) => { socket.write(l + '\r\n') }
      socket.setEncoding('utf8')
      socket.on('data', (chunk) => {
        lines.push(chunk)
        const all = lines.join('')
        while (true) {
          const idx = all.indexOf('\r\n')
          if (idx < 0) break
          const r = all.slice(0, idx)
          lines.length = 0
          lines.push(all.slice(idx + 2))
          console.log('S<-C', r)
          if (r.startsWith('220 ') && state === 0) { send('EHLO client.test'); state = 1 }
          else if (state === 1 && r.startsWith('250')) { if (r.indexOf('250 ') === 0 || r.indexOf('250-') === 0) { if (r.indexOf('AUTH') >= 0 || r.indexOf('250 OK') === 0) { send('AUTH LOGIN'); state = 2 } } }
          else if (state === 2 && r.startsWith('334')) { send(Buffer.from('debug').toString('base64')); state = 3 }
          else if (state === 3 && r.startsWith('334')) { send(Buffer.from('debug').toString('base64')); state = 4 }
          else if (state === 4 && r.startsWith('235')) { send(`MAIL FROM:<${from}>`); state = 5 }
          else if (state === 5 && r.startsWith('250')) { send(`RCPT TO:<${to}>`); state = 6 }
          else if (state === 6 && r.startsWith('250')) { send('DATA'); state = 7 }
          else if (state === 7 && r.startsWith('354')) {
            send('Subject: Hello test')
            send('From: '+from)
            send('To: '+to)
            send('')
            send('http://localhost/verify?token=abc123def456')
            send('.')
            state = 8
          }
          else if (state === 8 && r.startsWith('250')) {
            send('QUIT')
            state = 9
          }
          else if (state === 9 && r.startsWith('221')) {
            socket.end()
            resolve('SMTP OK')
          }
        }
      })
    })
    socket.on('error', reject)
    socket.on('end', () => resolve('done'))
  })
}

;(async () => {
  try {
    const r = await sendRawEmail('127.0.0.1', 1025, 'no-reply@qs.test', 'recipient@qs.test')
    console.log('Result:', r)
  } catch (e) {
    console.log('ERROR', e.message)
  }
})()
