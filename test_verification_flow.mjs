// QuickServe email verification flow - integration test
// Run: node test_verification_flow.mjs  (ensure backend is running on http://localhost:8080)

import axios from 'axios'

const API = 'http://localhost:8080/api'
const client = axios.create({ baseURL: API, validateStatus: () => true })
const log = console.log

let pass = 0
let fail = 0
const failures = []

function step(label, cond, detail = '') {
  if (cond) {
    log(`  ✅  ${label}`)
    pass++
  } else {
    log(`  ❌  ${label}   ${detail ? '— ' + detail : ''}`)
    fail++
    failures.push({ label, detail })
  }
}

function hr() { log('─'.repeat(64)) }

const uid = Date.now().toString(36)
const EMAIL_A = `alice_test_${uid}@quickserve.test`
const EMAIL_B = `bob_test_${uid}@quickserve.test`
const PASS = 'Passw0rd!'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function waitForBackend(timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await client.get('/foods', { timeout: 3000 })
      if (r.status < 500) return true
    } catch { /* ignore */ }
    await sleep(2000)
  }
  return false
}

;(async () => {
  hr()
  log('QuickServe — Email Verification Flow Test')
  hr()

  log('\n[0] Waiting for backend...')
  const up = await waitForBackend()
  step('backend reachable', up)
  if (!up) {
    log('\nBackend not reachable. Start it with:')
    log('  cd quickserve-backend && mvn spring-boot:run')
    process.exit(1)
  }

  // ---------------------------------------------------------------------
  // Test 1-6: Register user A, verify, login
  // ---------------------------------------------------------------------
  hr()
  log('\n[Test 1-6] Register → Verify → Login flow (user A)')
  hr()

  log('\n[1] Register new user A')
  const regA = await client.post('/auth/register', {
    name: 'Alice Test', email: EMAIL_A, password: PASS, phone: '0000000001'
  })
  const regOK = regA.status === 201 && regA.data?.userId
  step('Register returns 201 + userId', regOK, `status=${regA.status} body=${JSON.stringify(regA.data)}`)

  let userAId = null, tokenARaw = null, expA = null, emailSentMsg = false
  if (regOK) {
    userAId = regA.data.userId
    log('\n[2] Confirm account starts as NOT VERIFIED via DB-lookup endpoint (register response only)')
    // Register API response includes email? It doesn't include email_verified. We rely on the login rejection below.
    // Additionally: try login immediately (expects rejection) as an indirect confirmation of unverified.
    const loginBeforeVerify = await client.post('/auth/login', { email: EMAIL_A, password: PASS })
    const notVerifiedYet =
      loginBeforeVerify.status === 400 &&
      /verify your email/i.test(loginBeforeVerify.data?.message || '')
    step('Account is NOT VERIFIED (login rejected with verify msg)', notVerifiedYet,
      `status=${loginBeforeVerify.status} msg=${loginBeforeVerify.data?.message}`)

    log('\n[3] Confirm verification email "sent" — inspect register response path')
    // If the register threw about email failing to send, we'd get a 400. 201 means it succeeded
    // OR the backend didn't configure SMTP — in which case EmailService throws on send.
    // Here we check whether the register call reached 201. If SMTP is empty username, it will throw.
    // Check actual state:
    const registerSucceeded = regA.status === 201
    // If SMTP is not configured but backend is configured to not fail on send (it does fail), the test can't pass.
    // We'll also check: whether user has a verificationToken. We don't have direct DB API, so use indirect checks.
    emailSentMsg = registerSucceeded
    step('Register did not fail with email-send error', emailSentMsg,
      registerSucceeded ? '' : `register status=${regA.status} body=${JSON.stringify(regA.data)}`)

    // Indirectly: try the verification endpoint with any token (get a response) to verify
    // the general mechanism works. We won't know user A's token, but we can inspect via:
    // Re-read via admin endpoint if available. Otherwise fallback: fetch user by admin endpoint.
    // Skip if admin is not reachable without creds.

    log('\n[4] Open the verification link')
    // Since we can't read emails, we "fake" this by manually setting the user as verified
    // via a direct DB-reset — can't do. So instead, to exercise verifyEmail() and login after,
    // we need to obtain the token somehow.
    //
    // Approach: Register response does not return token. So we cannot. Instead we rely on
    // exposing a small endpoint to fetch token for the test user OR we add a test that
    // simulates a BAD/INVALID token path AND separately we test the happy path by using
    // a testing backdoor: temporarily update User via resend then try the invalid path.
    //
    // Real integration test limitation: the token is in the DB. To make this test useful
    // without SMTP, we will:
    //   (a) Call resend-verification — which will overwrite the token, but still not return it.
    //   (b) Add a simple "trick" — use the registration response to note this, and instead
    //       test verifyEmail with an INVALID token first, then proceed to simulate the happy path
    //       via DB write? Not possible through HTTP.
    //
    // To fully exercise the happy path, we need the actual token. We'll use a clever hack:
    // Since there is no test endpoint, we'll read the DB directly via a small Node MySQL call?
    // Too risky without DB drivers installed.
    //
    // Alternative: exercise verify-email as far as we can through HTTP, and explicitly mark
    // the remaining checks as "need token" via a workaround.
    //
    // To still get a REAL verifyEmail happy-path test, we can temporarily create a small
    // test-only endpoint? That would be a code change, which is not allowed.
    //
    // PRACTICAL APPROACH: We'll simply use curl-style + assume DB access. Given constraints,
    // we will instead use the following verification for steps 4-6:
    //   - Use a MySQL query through a CLI if available.
    //   - Otherwise, simulate: craft steps 4-6 via a manual SQL exec using child_process.

    // Skip in report: but we will try to run mysql CLI to get/set tokens.
  }

  // Use mysql CLI if available to grab tokens and exercise the full path.
  const mysql = (await import('child_process')).spawn
  const { execSync } = await import('child_process')
  let mysqlOK = false
  let tokenA_beforeVerify = null
  try {
    const mysqlCmd = `mysql -uroot -pPooja15@ -h 127.0.0.1 -D quickserve -e "SELECT verification_token, verification_token_expiry, email_verified, id FROM users WHERE email='${EMAIL_A}';" 2>&1`
    const out = execSync(mysqlCmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    mysqlOK = true
    const rows = out.trim().split('\n').slice(1).map(l => l.split('\t'))
    if (rows.length) {
      tokenA_beforeVerify = rows[0][0]
      expA = rows[0][1]
      const verA = rows[0][2]
      log(`    [DB] userA: id=${rows[0][3]} verified=${verA} token=${tokenA_beforeVerify} expiry=${expA}`)
    }
  } catch (e) {
    log('    [!] mysql CLI unavailable — skipping direct DB reads.')
  }

  step('MySQL CLI available for DB checks', mysqlOK)

  if (mysqlOK && userAId) {
    step('User A stored with NON-NULL verification token',
      !!tokenA_beforeVerify && tokenA_beforeVerify !== 'NULL', `token=${tokenA_beforeVerify}`)
    step('User A stored with NON-NULL expiry', !!expA && expA !== 'NULL', `expiry=${expA}`)
  }

  // Properly re-check verified flag via DB
  if (mysqlOK && userAId) {
    try {
      const r = execSync(
        `mysql -uroot -pPooja15@ -h 127.0.0.1 -D quickserve -e "SELECT email_verified FROM users WHERE email='${EMAIL_A}';" 2>&1`,
        { encoding: 'utf8' }
      )
      const rows = r.trim().split('\n').slice(1)
      const v = rows[0]?.trim()
      step('User A email_verified is false (0) pre-verification', v === '0', `actual=${v}`)
    } catch { /* ignore */ }
  }

  // ---------- [4] Open verification link ----------
  let verifyARes = null
  if (tokenA_beforeVerify) {
    log('\n[4] Opening verification link for user A')
    verifyARes = await client.get('/auth/verify-email', { params: { token: tokenA_beforeVerify } })
    step('Verify endpoint returns success=true on valid token',
      verifyARes.status === 200 && verifyARes.data?.success === true,
      `status=${verifyARes.status} body=${JSON.stringify(verifyARes.data)}`)
  } else {
    log('\n[4] Skipped — no token available')
  }

  // ---------- [5] Account becomes VERIFIED ----------
  if (mysqlOK && userAId) {
    const r = execSync(
      `mysql -uroot -pPooja15@ -h 127.0.0.1 -D quickserve -e "SELECT email_verified, verification_token FROM users WHERE email='${EMAIL_A}';" 2>&1`,
      { encoding: 'utf8' }
    )
    const rows = r.trim().split('\n').slice(1).map(l => l.split('\t'))
    if (rows.length) {
      const v = rows[0][0]
      const tok = rows[0][1]
      step('User A email_verified = true (1) post-verification', v === '1', `actual=${v}`)
      step('User A verification_token is NULL after verify', !tok || tok === 'NULL', `actual=${tok}`)
    }
  }

  // ---------- [6] User A can log in ----------
  log('\n[6] Login should now succeed for user A')
  const loginA = await client.post('/auth/login', { email: EMAIL_A, password: PASS })
  const loginAOk = loginA.status === 200 && !!loginA.data?.token
  step('User A login works (200 + JWT)', loginAOk,
    `status=${loginA.status} msg=${loginA.data?.message}`)

  // ---------------------------------------------------------------------
  // Test 7-9: Register user B, login BEFORE verification → rejected
  // ---------------------------------------------------------------------
  hr()
  log('\n[Test 7-9] Register user B → login rejected before verification')
  hr()

  log('\n[7] Register user B')
  const regB = await client.post('/auth/register', {
    name: 'Bob Test', email: EMAIL_B, password: PASS, phone: '0000000002'
  })
  const regBOk = regB.status === 201 && regB.data?.userId
  step('Register B returns 201 + userId', regBOk, `status=${regB.status}`)

  log('\n[8] Attempt login BEFORE verification')
  const loginBearly = await client.post('/auth/login', { email: EMAIL_B, password: PASS })
  const loginBRejected = loginBearly.status === 400 && /verify your email/i.test(loginBearly.data?.message || '')
  step('Login rejected with email-verification error', loginBRejected,
    `status=${loginBearly.status} msg=${loginBearly.data?.message}`)

  log('\n[9] (Login rejection above = confirmation that unverified cannot log in.)')
  step('Login truly rejected (non-200 and no JWT)',
    loginBearly.status !== 200 && !loginBearly.data?.token,
    `status=${loginBearly.status}`)

  // ---------------------------------------------------------------------
  // Test 10: Expired token
  // ---------------------------------------------------------------------
  hr()
  log('\n[Test 10] Expired verification token → rejected')
  hr()

  let tokenB_expiredCheckOk = false
  let tokenB_beforeResend = null
  if (mysqlOK && regBOk) {
    // Get B's token, set expiry to past
    try {
      const r1 = execSync(
        `mysql -uroot -pPooja15@ -h 127.0.0.1 -D quickserve -e "SELECT verification_token, verification_token_expiry FROM users WHERE email='${EMAIL_B}';" 2>&1`,
        { encoding: 'utf8' }
      )
      const rows = r1.trim().split('\n').slice(1).map(l => l.split('\t'))
      if (rows.length) {
        tokenB_beforeResend = rows[0][0]
        step('User B has initial verification token set', !!tokenB_beforeResend, `token=${tokenB_beforeResend}`)

        // Set expiry to 2020-01-01
        execSync(
          `mysql -uroot -pPooja15@ -h 127.0.0.1 -D quickserve -e "UPDATE users SET verification_token_expiry='2020-01-01 00:00:00' WHERE email='${EMAIL_B}';" 2>&1`,
          { encoding: 'utf8' }
        )

        const r2 = await client.get('/auth/verify-email', { params: { token: tokenB_beforeResend } })
        const expiredRejected = r2.status === 400 && /expired/i.test(r2.data?.message || '')
        step('Expired token → 400 with "expired" message', expiredRejected,
          `status=${r2.status} msg=${r2.data?.message}`)
        tokenB_expiredCheckOk = expiredRejected
      }
    } catch (e) {
      log('    [!] mysql error:', e.message?.slice(0, 200))
    }
  } else {
    step('Skipped (MySQL unavailable / B not registered)', false)
  }

  // ---------------------------------------------------------------------
  // Test 11: Resend verification email
  // ---------------------------------------------------------------------
  hr()
  log('\n[Test 11] Resend verification email')
  hr()

  let tokenB_afterResend = null
  if (regBOk) {
    // Also test a non-existent email — response should be identical (enumeration protection)
    const resendBogus = await client.post('/auth/resend-verification', { email: `nobody_${uid}@quickserve.test` })
    step('Resend for nonexistent email → 200 + success=true (safe)',
      resendBogus.status === 200 && resendBogus.data?.success === true,
      `status=${resendBogus.status}`)

    // Resend for user A (already verified) → same generic response, no email
    const resendVerified = await client.post('/auth/resend-verification', { email: EMAIL_A })
    step('Resend for already-verified email → 200 + success=true (safe)',
      resendVerified.status === 200 && resendVerified.data?.success === true,
      `status=${resendVerified.status}`)

    // Response message must NOT leak state
    const msgBogus = resendBogus.data?.message || ''
    const msgVerified = resendVerified.data?.message || ''
    step('Enumeration protection: identical response text across bad/verified cases',
      !!msgBogus && msgBogus === msgVerified,
      `bogus="${msgBogus}" vs verified="${msgVerified}"`)

    // Resend for user B (unverified, expired token still attached)
    const resendB = await client.post('/auth/resend-verification', { email: EMAIL_B })
    const resendBOk = resendB.status === 200 && resendB.data?.success === true
    step('Resend for unverified B → 200 success=true', resendBOk,
      `status=${resendB.status} msg=${resendB.data?.message}`)

    if (mysqlOK && resendBOk) {
      try {
        const r = execSync(
          `mysql -uroot -pPooja15@ -h 127.0.0.1 -D quickserve -e "SELECT verification_token, verification_token_expiry FROM users WHERE email='${EMAIL_B}';" 2>&1`,
          { encoding: 'utf8' }
        )
        const rows = r.trim().split('\n').slice(1).map(l => l.split('\t'))
        if (rows.length) {
          tokenB_afterResend = rows[0][0]
          const newExp = rows[0][1]
          step('After resend: new token generated (different from old)',
            !!tokenB_beforeResend && !!tokenB_afterResend && tokenB_beforeResend !== tokenB_afterResend,
            `old=${tokenB_beforeResend?.slice(0, 8)}… new=${tokenB_afterResend?.slice(0, 8)}…`)
          step('After resend: new expiry is set in the future (> now)',
            !!newExp && new Date(newExp) > new Date(),
            `new expiry=${newExp} now=${new Date().toISOString()}`)
        }
      } catch (e) {
        log('    [!] mysql error:', e.message?.slice(0, 200))
      }
    }

    // Resend invalid email format → 400 (validation layer)
    const resendBad = await client.post('/auth/resend-verification', { email: 'not-an-email' })
    step('Resend with invalid email format → 400 validation error',
      resendBad.status === 400, `status=${resendBad.status}`)
  }

  // ---------------------------------------------------------------------
  // Test 12: Old token does NOT work after resend (new token generated)
  // ---------------------------------------------------------------------
  hr()
  log('\n[Test 12] Old token invalidated after resend')
  hr()

  if (tokenB_beforeResend && tokenB_afterResend && tokenB_beforeResend !== tokenB_afterResend) {
    // Try the OLD token
    const oldRes = await client.get('/auth/verify-email', { params: { token: tokenB_beforeResend } })
    step('OLD token rejected after resend (400 + "Invalid/already used")',
      oldRes.status === 400,
      `status=${oldRes.status} msg=${oldRes.data?.message}`)

    // Try the NEW token
    const newRes = await client.get('/auth/verify-email', { params: { token: tokenB_afterResend } })
    const newOk = newRes.status === 200 && newRes.data?.success === true
    step('NEW token works (200 + success=true)', newOk,
      `status=${newRes.status} msg=${newRes.data?.message}`)

    if (mysqlOK) {
      const r = execSync(
        `mysql -uroot -pPooja15@ -h 127.0.0.1 -D quickserve -e "SELECT email_verified FROM users WHERE email='${EMAIL_B}';" 2>&1`,
        { encoding: 'utf8' }
      )
      const rows = r.trim().split('\n').slice(1)
      step('After NEW-token verification: user B is verified (1)', rows[0]?.trim() === '1',
        `actual=${rows[0]?.trim()}`)
    }
  } else {
    step('Skipped (no before/after tokens)', false)
  }

  // ---------------------------------------------------------------------
  // Cleanup: delete test users
  // ---------------------------------------------------------------------
  log('\n[Cleanup] Removing test users…')
  try {
    execSync(
      `mysql -uroot -pPooja15@ -h 127.0.0.1 -D quickserve -e "DELETE FROM users WHERE email IN ('${EMAIL_A}','${EMAIL_B}');" 2>&1`,
      { encoding: 'utf8' }
    )
    log('  Done.')
  } catch { log('  (failed — manual cleanup may be needed)') }

  // ---------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------
  hr()
  log('\nSUMMARY')
  hr()
  log(`  Passed : ${pass}`)
  log(`  Failed : ${fail}`)
  log()
  if (failures.length) {
    log('Failures:')
    failures.forEach((f, i) => log(`  ${i + 1}. ${f.label}  ${f.detail ? '— ' + f.detail : ''}`))
    process.exit(1)
  } else {
    log('All applicable checks passed.')
  }
})()
