// QuickServe end-to-end email verification flow test
//
// - Starts a debug SMTP server on port 1025 (captures outgoing emails, extracts tokens)
// - Launches quickserve-backend via `java -jar` with SMTP env vars pointed at 127.0.0.1:1025
// - Uses MySQL CLI at its installed Windows path to peek/poke rows (verified/expiry/token)
// - Then performs the 12-step test plan over HTTP
//
// Usage:  node test_verification_flow.e2e.mjs

import { spawn, execSync, spawnSync } from 'child_process'
import * as net from 'net'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---------- Config ----------
// Use Windows short paths (8.3) to avoid quoting issues when spawning from Node
const MYSQL_EXE = 'C:\\PROGRA~1\\MySQL\\MYSQLS~1.0\\bin\\mysql.exe'
const MVN_CMD = 'C:\\PROGRA~1\\APACHE~1.16-\\APACHE~1.16\\bin\\mvn.cmd'
const BACKEND_JAR = path.join(__dirname, 'quickserve-backend', 'target', 'quickserve-backend-1.0.0.jar')
const BACKEND_DIR = path.join(__dirname, 'quickserve-backend')
const API_BASE = 'http://127.0.0.1:8080/api'
const SMTP_PORT = 1025
const SMTP_HOST = '0.0.0.0'

const http = axios.create({ baseURL: API_BASE, validateStatus: () => true })

// ---------- Helpers ----------
let pass = 0, fail = 0
const failures = []
function step(label, cond, detail = '') {
  if (cond) {
    console.log(`  ✅  ${label}`)
    pass++
  } else {
    console.log(`  ❌  ${label}   ${detail ? '— ' + detail : ''}`)
    fail++
    failures.push({ label, detail })
  }
}
const hr = () => console.log('─'.repeat(72))
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const uid = Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36)
const EMAIL_A = `alice_${uid}@qs.test`
const EMAIL_B = `bob_${uid}@qs.test`
const PASS = 'Passw0rd!'

// Parse MySQL CLI stdout (tab-separated, first row is header)
function mysqlQuery(sql) {
  // Call mysql.exe directly. -N: no column names; -B: tab-separated batch mode
  const args = [
    '-uroot',
    '-pPooja15@',
    '-h', '127.0.0.1',
    '-D', 'quickserve',
    '-N',
    '-B',
    '--default-character-set=utf8mb4',
    '--raw',
    '-e', sql,
  ]
  const r = spawnSync(MYSQL_EXE, args, {
    encoding: 'utf8',
    maxBuffer: 5 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const out = (r.stdout || '').trim()
  if (!out) return { rows: [], err: (r.stderr || '').trim() }
  const rows = out
    .split(/\r?\n/)
    .filter(l => l.length > 0)
    .map(l => l.split('\t').map(cell => {
      // Trim surrounding whitespace; also strip leading '\' that mysql.exe -B may add around some cells on Windows
      let c = (cell || '').trim()
      if (c.startsWith('\\')) c = c.slice(1)
      if (c.endsWith('\\')) c = c.slice(0, -1)
      return c
    }))
  return { rows, err: (r.stderr || '').trim() }
}

// ---------- Captured email store (by recipient) ----------
const inbox = new Map() // email -> [{to,from,subject,body,data}]
const onEmail = []
let smtpConnectionCount = 0
let backendProgramArgs = []

function startSmtpServer(port = SMTP_PORT, host = SMTP_HOST) {
  const server = net.createServer(socket => {
    smtpConnectionCount++
    const peer = `${socket.remoteAddress}:${socket.remotePort}`
    console.log(`    [SMTP] new connection from ${peer} (#${smtpConnectionCount})`)
    socket.on('close', () => console.log(`    [SMTP] closed ${peer}`))
    socket.on('error', (e) => console.log(`    [SMTP] error ${peer}:`, e.message))
    let state = 'init'
    let from = null, to = [], dataBuf = ''
    let authStage = 0 // 0=none, 1=waiting for username, 2=waiting for password
    const send = (line) => { socket.write(line + '\r\n') }
    send('220 QuickServe-Debug-SMTP ESMTP ready')
    socket.setEncoding('utf8')
    socket.on('data', (chunk) => {
      const lines = chunk.split(/\r?\n/)
      for (let rawLine of lines) {
        if (!rawLine) continue
        const line = rawLine
        const cmd = line.slice(0, 4).toUpperCase()

        if (state === 'auth') {
          if (authStage === 1) {
            // received username (base64) -> ask for password
            send('334 UGFzc3dvcmQ6')
            authStage = 2
          } else if (authStage === 2) {
            // received password -> auth ok
            send('235 2.7.0 Authentication successful')
            state = 'ehlo'
            authStage = 0
          }
          continue
        }

        switch (state) {
          case 'init':
            if (cmd === 'EHLO' || cmd === 'HELO') {
              send('250-Hello there')
              send('250-AUTH LOGIN PLAIN')
              send('250 OK')
              state = 'ehlo'
            } else send('502 Error')
            break
          case 'ehlo':
            if (cmd === 'MAIL') { const m = line.match(/FROM:\s*<?([^\s>]+)/i); if (m) from = m[1]; send('250 OK'); state = 'rcpt' }
            else if (cmd.startsWith('AUTH')) {
              send('334 VXNlcm5hbWU6')
              authStage = 1
              state = 'auth'
            }
            else if (cmd === 'STAR') { send('220 Go ahead') }
            else if (cmd === 'RSET') { from = null; to = []; dataBuf = ''; send('250 OK') }
            else if (cmd === 'QUIT') { send('221 Bye'); socket.end() }
            else send('502 Error: command not recognized')
            break
          case 'rcpt':
            if (cmd === 'RCPT') { const m = line.match(/TO:\s*<?([^\s>]+)/i); if (m) to.push(m[1]); send('250 OK') }
            else if (cmd === 'DATA') { send('354 End data with <CR><LF>.<CR><LF>'); state = 'data' }
            else if (cmd === 'RSET') { from = null; to = []; dataBuf = ''; send('250 OK') }
            else if (cmd === 'QUIT') { send('221 Bye'); socket.end() }
            else send('502 Error: command not recognized')
            break
          case 'data':
            if (line === '.') {
              const subjectM = dataBuf.match(/^Subject:\s*([^\r\n]*)/im)
              const subject = subjectM ? subjectM[1] : ''
              const linkMatches = dataBuf.matchAll(/https?:\/\/[^\s"'<>]+/g)
              const links = [...linkMatches].map(m => m[0])
              const tokens = links
                .map(l => { try { return new URL(l).searchParams.get('token') } catch { return null } })
                .filter(Boolean)
              const email = { from, to: to.slice(), subject, body: dataBuf, links, tokens }
              for (const rcpt of to) {
                if (!inbox.has(rcpt)) inbox.set(rcpt, [])
                inbox.get(rcpt).push(email)
              }
              for (const fn of onEmail) { try { fn(email) } catch {} }
              console.log(`    [SMTP] → ${to.join(', ')}  subject="${subject}"  tokens=${tokens.join(',') || '(none)'}`)
              from = null; to = []; dataBuf = ''
              state = 'ehlo'
              send('250 OK: Message accepted')
            } else {
              dataBuf += (line.startsWith('.') && line !== '.' ? line.slice(1) : line) + '\r\n'
            }
            break
        }
      }
    })
  })
  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(port, host, () => resolve(server))
  })
}

function killProcessOnPort(port) {
  try {
    // Windows: use netstat + taskkill via cmd
    const r = spawnSync('cmd.exe', ['/c',
      `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do @taskkill /F /PID %a 2>nul`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return r
  } catch (e) { return { error: e.message } }
}

function startBackend() {
  // Highest priority = program args --spring.mail.x=y (beats env vars and application.properties)
  const programArgs = [
    `--spring.mail.host=127.0.0.1`,
    `--spring.mail.port=${SMTP_PORT}`,
    '--spring.mail.username=debug',
    '--spring.mail.password=debug',
    '--spring.mail.properties.mail.smtp.auth=true',
    '--spring.mail.properties.mail.smtp.starttls.enable=false',
    '--spring.mail.properties.mail.smtp.connectiontimeout=8000',
    '--spring.mail.properties.mail.smtp.timeout=8000',
    '--spring.mail.properties.mail.smtp.writetimeout=8000',
  ]
  backendProgramArgs = programArgs.slice()
  const jarExists = fs.existsSync(BACKEND_JAR)
  let child
  if (jarExists) {
    child = spawn('java', ['-jar', BACKEND_JAR, ...programArgs], {
      cwd: BACKEND_DIR, env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
    })
  } else {
    child = spawn('cmd.exe', [
      '/c', MVN_CMD,
      'spring-boot:run',
      `-Dspring-boot.run.arguments=${programArgs.join(' ')}`,
    ], { cwd: BACKEND_DIR, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
  }
  let buffer = ''
  child.stdout.on('data', d => { buffer += d.toString(); if (buffer.length > 1e6) buffer = buffer.slice(-500000) })
  child.stderr.on('data', d => { buffer += d.toString(); if (buffer.length > 1e6) buffer = buffer.slice(-500000) })
  child.on('exit', (c) => console.log(`[Backend exited with ${c}]`))
  return { child, getLog: () => buffer }
}

async function waitForBackend(timeoutMs = 180_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await http.get('/foods', { timeout: 3000 })
      if (r.status >= 200 && r.status < 500) return true
    } catch { /* ignore */ }
    await sleep(2000)
  }
  return false
}

function latestVerificationTokenFor(email) {
  const arr = inbox.get(email) || []
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].tokens?.length) return arr[i].tokens[arr[i].tokens.length - 1]
  }
  return null
}

// ---------- Run ----------
;(async () => {
  hr()
  console.log('QuickServe — Email Verification Flow  (12-step E2E)')
  hr()

  // 1. SMTP server
  console.log('\n[Setup] Starting debug SMTP server on :' + SMTP_PORT)
  const smtp = await startSmtpServer()
  console.log('  → Debug SMTP running')

  // 2. Start backend (always rebuild jar first to ensure latest Java sources are included)
  console.log('\n[Setup] Ensuring port 8080 is free…')
  killProcessOnPort(8080)
  await sleep(2000)
  console.log('\n[Setup] Repackaging backend jar (ensures latest code)…')
  const rebuild = spawnSync('cmd.exe', [
    '/c', MVN_CMD, '-q', '-DskipTests', 'package',
  ], {
    cwd: BACKEND_DIR, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (rebuild.status !== 0) {
    console.log('  BUILD FAILED status=' + rebuild.status)
    console.log('  stdout:\n' + (rebuild.stdout || '').slice(-2000))
    console.log('  stderr:\n' + (rebuild.stderr || '').slice(-2000))
    process.exit(2)
  }
  console.log('  → Package OK')

  console.log('\n[Setup] Starting backend on :8080 …')
  const { child: backend, getLog } = startBackend()
  const up = await waitForBackend()
  if (!up) {
    console.log('\nBackend failed to start. Last log lines:\n' + getLog().slice(-4000))
    try { backend.kill() } catch {}
    try { smtp.close() } catch {}
    process.exit(3)
  }
  console.log('  → Backend is up')
  await sleep(1500)
  // Diagnostic: print backend log lines that mention SMTP / mail config
  const allLog = getLog()
  const lines = allLog.split(/\r?\n/)
  const patterns = [
    /mail|smtp|spring\.mail|1025|127\.0\.0\.1|gmail|send|verification|MailSender|Mime|Exception|Error|587|host|port|auth|connect|timeout|socket/i,
  ]
  const diag = lines.filter(l => patterns.some(p => p.test(l))).slice(0, 80)
  console.log('  ----[DIAG: mail-related lines from backend log]----')
  if (diag.length) for (const l of diag) console.log('     ' + l.slice(0, 300))
  else console.log('     (NO matching lines — printing first 15 lines of log)')
  if (!diag.length) lines.slice(0, 15).forEach(l => console.log('     ' + l.slice(0, 300)))
  console.log('  ----[DIAG END]----')
  // Also print the program args + socket info
  console.log('  [INFO] backend program args we sent:', JSON.stringify(backendProgramArgs))
  console.log('  [INFO] backend listening check: trying /foods…')
  try {
    const probe = await http.get('/foods', { timeout: 3000 })
    console.log('     HTTP probe:', probe.status, probe.statusText, 'bodyLen=', (probe.data || '').length)
  } catch(e) { console.log('     HTTP probe error:', e.message) }
  // Now check if port 1025 had any connections
  console.log('  [INFO] total SMTP connections received so far:', smtpConnectionCount)
  if (smtpConnectionCount === 0) {
    console.log('  [WARNING] No SMTP connections were made — Java MailSender is not reaching our debug server on :1025.')
    console.log('            Printing last 30 lines of backend log:')
    lines.slice(-30).forEach(l => console.log('     ' + l.slice(0, 300)))
  }

  // 3. Cleanup any prior duplicate test users (in case previous run was killed)
  mysqlQuery(`DELETE FROM users WHERE email IN ('${EMAIL_A}','${EMAIL_B}')`)

  try {
    // =========================================================================
    // STEPS 1–6: Register → verify → login  (User A)
    // =========================================================================
    hr()
    console.log('\n[Scenario 1] Register → Verify → Login (User A)')
    hr()

    // --- Step 1: Register ---
    console.log('\n[Step 1] Register a new user')
    const regA = await http.post('/auth/register', {
      name: 'Alice', email: EMAIL_A, password: PASS, phone: '0000000001',
    })
    const regAOk = regA.status === 201 && !!regA.data?.userId
    step('POST /register returns 201 + userId', regAOk,
      `status=${regA.status} body=${JSON.stringify(regA.data)}`)
    const userAId = regA.data?.userId

    // --- Step 2: Account starts NOT VERIFIED ---
    console.log('\n[Step 2] Confirm account starts NOT VERIFIED')
    const q2 = mysqlQuery(`SELECT email_verified, verification_token FROM users WHERE email='${EMAIL_A}'`)
    if (q2.rows?.length) {
      const [v, tok] = q2.rows[0]
      step('email_verified is 0 (false) after registration', v === '0', `actual=${v}`)
      step('verification_token is NOT NULL after registration', !!tok && tok !== 'NULL', `token_len=${tok?.length || 0}`)
    } else {
      step('Found user A row in users table', false, `mysql err=${q2.err}`)
    }

    // --- Step 3: Verification email sent ---
    console.log('\n[Step 3] Confirm verification email was sent')
    // Wait a moment for SMTP async
    await sleep(1500)
    const emailA = (inbox.get(EMAIL_A) || [])[0]
    const tokA = latestVerificationTokenFor(EMAIL_A)
    step('SMTP server received an email for user A address', !!emailA,
      `received_for_A=${(inbox.get(EMAIL_A) || []).length}`)
    step('Email body contains a valid verification URL with token', !!tokA,
      `token=${tokA || '(missing)'}`)

    // --- Step 4: Open the verification link ---
    console.log('\n[Step 4] Open the verification link')
    const verifyA = await http.get('/auth/verify-email', { params: { token: tokA || '__missing__' } })
    const verifyAOk = verifyA.status === 200 && verifyA.data?.success === true
    step('GET /verify-email?token=… returns success=true', verifyAOk,
      `status=${verifyA.status} body=${JSON.stringify(verifyA.data)}`)

    // --- Step 5: Account becomes VERIFIED + token cleared ---
    console.log('\n[Step 5] Confirm account becomes VERIFIED + token cleared')
    const q5 = mysqlQuery(`SELECT email_verified, verification_token, verification_token_expiry FROM users WHERE email='${EMAIL_A}'`)
    if (q5.rows?.length) {
      const [v, tok, exp] = q5.rows[0]
      step('email_verified is 1 (true) after verification', v === '1', `actual=${v}`)
      step('verification_token is NULL after verification', !tok || tok === 'NULL', `actual=${tok}`)
      step('verification_token_expiry is NULL after verification', !exp || exp === 'NULL', `actual=${exp}`)
    } else step('Can re-query user A after verify', false, `mysql err=${q5.err}`)

    // --- Step 6: User can login ---
    console.log('\n[Step 6] Confirm user can now log in')
    const loginA = await http.post('/auth/login', { email: EMAIL_A, password: PASS })
    const loginAOk = loginA.status === 200 && !!loginA.data?.token
    step('POST /login returns 200 + JWT (verified user A)', loginAOk,
      `status=${loginA.status} msg=${loginA.data?.message || ''} hasToken=${!!loginA.data?.token}`)

    // =========================================================================
    // STEPS 7–9: Register User B, attempt login BEFORE verification → rejected
    // =========================================================================
    hr()
    console.log('\n[Scenario 2] Register → block login until verification  (User B)')
    hr()

    console.log('\n[Step 7] Register another user (B)')
    const regB = await http.post('/auth/register', {
      name: 'Bob', email: EMAIL_B, password: PASS, phone: '0000000002',
    })
    const regBOk = regB.status === 201 && !!regB.data?.userId
    step('POST /register returns 201 + userId (user B)', regBOk,
      `status=${regB.status} body=${JSON.stringify(regB.data)}`)

    console.log('\n[Step 8] Try logging in BEFORE verification')
    const loginBEarly = await http.post('/auth/login', { email: EMAIL_B, password: PASS })
    step('Login status is non-200 (blocked)', loginBEarly.status !== 200,
      `status=${loginBEarly.status}`)
    step('Login error message mentions "verify your email"',
      loginBEarly.status !== 200 && /verify your email/i.test(loginBEarly.data?.message || ''),
      `msg=${loginBEarly.data?.message}`)
    step('No JWT token issued to unverified user B', !loginBEarly.data?.token,
      `hasToken=${!!loginBEarly.data?.token}`)

    console.log('\n[Step 9] (Confirm login was rejected — summary of step 8)')
    step('Login fully rejected: status!=200 AND no JWT',
      loginBEarly.status !== 200 && !loginBEarly.data?.token)

    // =========================================================================
    // STEP 10: Expired verification token → rejected
    // =========================================================================
    hr()
    console.log('\n[Scenario 3] Expired verification token')
    hr()

    console.log('\n[Step 10] Test expired verification token')
    // Take B's original token, set expiry to past via MySQL
    const tokB_orig = latestVerificationTokenFor(EMAIL_B)
    step('User B initial verification email arrived with token', !!tokB_orig,
      `token=${tokB_orig || '(missing)'}`)
    if (tokB_orig) {
      mysqlQuery(`UPDATE users SET verification_token_expiry='2020-01-01 00:00:00' WHERE email='${EMAIL_B}'`)
      const expB = await http.get('/auth/verify-email', { params: { token: tokB_orig } })
      step('Expired token → status 400', expB.status === 400, `status=${expB.status}`)
      step('Error message mentions "expired"', /expired/i.test(expB.data?.message || ''),
        `msg=${expB.data?.message}`)
    }

    // =========================================================================
    // STEP 11: Resend verification email
    // =========================================================================
    hr()
    console.log('\n[Scenario 4] Resend verification email  (User B)')
    hr()

    console.log('\n[Step 11a] Resend for non-existent email → safe response')
    const fakeEmail = `noone_${uid}@qs.test`
    const resBogus = await http.post('/auth/resend-verification', { email: fakeEmail })
    step('HTTP 200 + success=true for non-existent email',
      resBogus.status === 200 && resBogus.data?.success === true,
      `status=${resBogus.status} body=${JSON.stringify(resBogus.data)}`)
    await sleep(1200)
    step('NO SMTP email was actually sent for non-existent email',
      (inbox.get(fakeEmail) || []).length === 0,
      `received=${(inbox.get(fakeEmail) || []).length}`)

    console.log('\n[Step 11b] Resend for already-verified User A → safe response, no email')
    const resVerified = await http.post('/auth/resend-verification', { email: EMAIL_A })
    const countBefore = (inbox.get(EMAIL_A) || []).length
    step('HTTP 200 + success=true for already-verified email',
      resVerified.status === 200 && resVerified.data?.success === true,
      `status=${resVerified.status}`)
    await sleep(1200)
    const countAfter = (inbox.get(EMAIL_A) || []).length
    step('NO new verification email sent to already-verified user A', countBefore === countAfter,
      `before=${countBefore} after=${countAfter}`)

    console.log('\n[Step 11c] Resend for unverified User B → new token, new expiry, new email')
    const inboxBefore = (inbox.get(EMAIL_B) || []).length
    const tokB_beforeResend = latestVerificationTokenFor(EMAIL_B)
    const resB = await http.post('/auth/resend-verification', { email: EMAIL_B })
    step('HTTP 200 + success=true for unverified B',
      resB.status === 200 && resB.data?.success === true,
      `status=${resB.status} msg=${resB.data?.message}`)
    await sleep(1500)
    const inboxAfter = (inbox.get(EMAIL_B) || []).length
    const tokB_afterResend = latestVerificationTokenFor(EMAIL_B)
    step('SMTP received a NEW verification email for B after resend', inboxAfter === inboxBefore + 1,
      `before=${inboxBefore} after=${inboxAfter}`)
    step('New email contains a DIFFERENT token than the previous one',
      !!tokB_beforeResend && !!tokB_afterResend && tokB_beforeResend !== tokB_afterResend,
      `old=${tokB_beforeResend?.slice(0, 8)}… new=${tokB_afterResend?.slice(0, 8)}…`)
    const q11 = mysqlQuery(`SELECT verification_token_expiry FROM users WHERE email='${EMAIL_B}'`)
    if (q11.rows?.length) {
      const exp = q11.rows[0][0]
      step('DB: new expiry is in the future (> now)',
        !!exp && new Date(exp) > new Date(),
        `expiry=${exp} now=${new Date().toISOString()}`)
    }
    step('Enumeration protection: same response text for nonexistent vs already-verified',
      resBogus.data?.message && resBogus.data.message === resVerified.data?.message,
      `bogus="${resBogus.data?.message}" verified="${resVerified.data?.message}"`)

    console.log('\n[Step 11d] Resend validation: invalid email format rejected')
    const resBad = await http.post('/auth/resend-verification', { email: 'not-an-email' })
    step('Invalid email payload → status 400 (validation)', resBad.status === 400,
      `status=${resBad.status}`)

    // =========================================================================
    // STEP 12: Old token no longer works after resend → new token invalidates old
    // =========================================================================
    hr()
    console.log('\n[Scenario 5] Old token invalidated after resend')
    hr()

    console.log('\n[Step 12] Confirm old token no longer works after resend')
    if (tokB_beforeResend && tokB_afterResend && tokB_beforeResend !== tokB_afterResend) {
      const tryOld = await http.get('/auth/verify-email', { params: { token: tokB_beforeResend } })
      step('Old (pre-resend) token → rejected with status != 200',
        tryOld.status !== 200 && tryOld.data?.success !== true,
        `status=${tryOld.status} body=${JSON.stringify(tryOld.data)}`)

      const tryNew = await http.get('/auth/verify-email', { params: { token: tokB_afterResend } })
      const newOk = tryNew.status === 200 && tryNew.data?.success === true
      step('New (post-resend) token → accepted success=true', newOk,
        `status=${tryNew.status} body=${JSON.stringify(tryNew.data)}`)

      // Bonus side effect: user B now verified
      const q12 = mysqlQuery(`SELECT email_verified FROM users WHERE email='${EMAIL_B}'`)
      if (q12.rows?.length) step('After verifying NEW token: B email_verified=1',
        q12.rows[0][0] === '1', `actual=${q12.rows[0][0]}`)
    } else {
      step('Prereq: distinct tokens before/after resend', false,
        `old=${tokB_beforeResend} new=${tokB_afterResend}`)
    }

    // =========================================================================
    // Cleanup
    // =========================================================================
    console.log('\n[Cleanup] Removing test users…')
    mysqlQuery(`DELETE FROM users WHERE email IN ('${EMAIL_A}','${EMAIL_B}','${fakeEmail}')`)
    console.log('  Done.')
  } catch (e) {
    console.log('\n!! Unexpected test exception:\n', e && e.stack)
  } finally {
    try { backend.kill('SIGTERM') } catch {}
    try { smtp.close() } catch {}
  }

  // Summary
  hr()
  console.log('\nRESULT')
  hr()
  console.log(`  Passed: ${pass}`)
  console.log(`  Failed: ${fail}`)
  if (failures.length) {
    console.log('\nFailure details:')
    failures.forEach((f, i) =>
      console.log(`  ${String(i + 1).padStart(2, ' ')}. ${f.label} ${f.detail ? '\n       → ' + f.detail : ''}`),
    )
    process.exit(1)
  } else {
    console.log('\nAll 12 verification-flow checks passed.')
  }
})()
