/**
 * Todas las peticiones HTTP a Nauta se hacen desde aquí (server-side),
 * por lo que no hay problemas de CORS.
 */

import nodeFetch, { type RequestInit } from 'node-fetch'
import https from 'https'
import { parse as parseHtml } from 'node-html-parser'

// ─── Agente HTTPS sin validación de certificado ───────────────────
// Nauta usa certificados autofirmados / no confiables
const nautaAgent = new https.Agent({ rejectUnauthorized: false })
const portalAgent = new https.Agent({ rejectUnauthorized: false })

const TIMEOUT_MS = 15_000

// ─── URLs ─────────────────────────────────────────────────────────
const NAUTA_HOME    = 'https://secure.etecsa.net:8443/'
const NAUTA_LOGIN   = 'https://secure.etecsa.net:8443/LoginServlet'
const NAUTA_QUERY   = 'https://secure.etecsa.net:8443/EtecsaQueryServlet'
const NAUTA_LOGOUT  = 'https://secure.etecsa.net:8443/LogoutServlet'

const PORTAL_LOGIN   = 'https://www.portal.nauta.cu/user/login'
const PORTAL_USER    = 'https://www.portal.nauta.cu/useraaa'
const PORTAL_CAPTCHA = 'https://www.portal.nauta.cu/captcha'
const PORTAL_EMAIL   = 'https://www.portal.nauta.cu/email'

// ─── Tipos ────────────────────────────────────────────────────────
type Cookies = Record<string, string>

interface SessionParams {
  username:      string
  wlanuserip:    string
  csrfhw:        string
  attributeUuid: string
  cookies:       Cookies
}

interface PortalParams {
  username: string
  cookies:  Cookies
}

// ─── Helpers de cookies ───────────────────────────────────────────

function parseCookies(raw: string[]): Cookies {
  const jar: Cookies = {}
  for (const cookie of raw) {
    const [nameValue] = cookie.split(';')
    const eqIdx = nameValue.indexOf('=')
    if (eqIdx === -1) continue
    const name  = nameValue.slice(0, eqIdx).trim()
    const value = nameValue.slice(eqIdx + 1).trim()
    if (name) jar[name] = value
  }
  return jar
}

function serializeCookies(jar: Cookies): string {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
}

function mergeCookies(...jars: Cookies[]): Cookies {
  return Object.assign({}, ...jars)
}

// ─── Helpers de fetch ─────────────────────────────────────────────

async function nautaFetch(
  url: string,
  options: RequestInit = {},
  existingCookies: Cookies = {}
): Promise<{ text: string; cookies: Cookies; url: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const isPortal = url.includes('portal.nauta.cu')
    const agent    = isPortal ? portalAgent : nautaAgent

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (compatible; NautaWeb/1.0)',
      ...(options.headers as Record<string, string> || {}),
    }

    if (Object.keys(existingCookies).length > 0) {
      headers['Cookie'] = serializeCookies(existingCookies)
    }

    const response = await nodeFetch(url, {
      ...options,
      agent,
      headers,
      redirect: 'follow',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} en ${url}`)
    }

    const setCookieHeader = response.headers.raw()['set-cookie'] || []
    const newCookies      = parseCookies(setCookieHeader)
    const merged          = mergeCookies(existingCookies, newCookies)
    const text            = await response.text()
    const finalUrl        = response.url

    return { text, cookies: merged, url: finalUrl }
  } finally {
    clearTimeout(timer)
  }
}

async function nautaFetchBinary(
  url: string,
  existingCookies: Cookies = {}
): Promise<{ buffer: Buffer; cookies: Cookies }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await nodeFetch(url, {
      agent: portalAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NautaWeb/1.0)',
        'Cookie': serializeCookies(existingCookies),
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al obtener imagen`)
    }

    const setCookieHeader = response.headers.raw()['set-cookie'] || []
    const newCookies      = parseCookies(setCookieHeader)
    const merged          = mergeCookies(existingCookies, newCookies)
    const buffer          = Buffer.from(await response.arrayBuffer())

    return { buffer, cookies: merged }
  } finally {
    clearTimeout(timer)
  }
}

// ─── Helpers de parseo ────────────────────────────────────────────

function checkPortalError(html: string, context: string): void {
  const match = html.match(/toastr\.error\('.*?<li class="msg_error">(.*?)<ul/s)
  if (match) {
    const sub = html.match(/<li class="sub-message">(.*?)<\/li>/s)
    const msg = sub ? `${match[1].trim()} — ${sub[1].trim()}` : match[1].trim()
    throw new Error(`Error del portal en "${context}": ${msg}`)
  }
}

function checkNautaAlert(html: string, context: string): void {
  const match = html.match(/alert\("([^"]*?)"\)/)
  if (match) {
    throw new Error(`Error Nauta en "${context}": ${match[1]}`)
  }
}

function querySelector(html: string, selector: string): string {
  const root = parseHtml(html)
  return root.querySelector(selector)?.text?.trim() ?? ''
}

function querySelectorAttr(html: string, selector: string, attr: string): string {
  const root = parseHtml(html)
  return root.querySelector(selector)?.getAttribute(attr)?.trim() ?? ''
}

// ─── 1. initNautaSession ──────────────────────────────────────────

export async function initNautaSession(username: string, password: string) {
  // GET homepage → extraer wlanuserip y CSRFHW
  const { text: homeHtml, cookies } = await nautaFetch(NAUTA_HOME)

  const root       = parseHtml(homeHtml)
  const wlanuserip = root.querySelector('#wlanuserip')?.getAttribute('value') ?? ''
  const csrfhw     = root.querySelector('[name="CSRFHW"]')?.getAttribute('value') ?? ''

  if (!wlanuserip || !csrfhw) {
    throw new Error('No se pudo extraer wlanuserip o CSRFHW del portal Nauta.')
  }

  // POST al query servlet → info de la cuenta
  const params = new URLSearchParams({
    username,
    password,
    wlanuserip,
    CSRFHW: csrfhw,
    lang:   'en_US',
  })

  const { text: infoHtml, cookies: updatedCookies } = await nautaFetch(
    NAUTA_QUERY,
    { method: 'POST', body: params, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    cookies
  )

  checkNautaAlert(infoHtml, 'obtener info de usuario')

  // Parsear info de la cuenta
  const infoRoot = parseHtml(infoHtml)
  const rows     = infoRoot.querySelectorAll('#sessioninfo tbody tr')

  const getText = (rowIdx: number, colIdx: number): string =>
    rows[rowIdx]?.querySelectorAll('td')[colIdx]?.text?.trim() ?? ''

  const sessionRows = infoRoot.querySelectorAll('#sesiontraza tbody tr')
  const sessions: { start: string; end: string; duration: string }[] = []

  for (const row of sessionRows) {
    const cells = row.querySelectorAll('td')
    if (cells.length >= 3) {
      sessions.push({
        start:    cells[0].text.trim(),
        end:      cells[1].text.trim(),
        duration: cells[2].text.trim(),
      })
    }
  }

  const userInfo = {
    account_state:   getText(0, 1),
    credit:          getText(1, 1),
    expiration_date: getText(2, 1),
    access_areas:    getText(3, 1),
    sessions,
  }

  return { wlanuserip, csrfhw, cookies: updatedCookies, userInfo }
}

// ─── 2. loginNauta ───────────────────────────────────────────────

export async function loginNauta(params: {
  username:    string
  password:    string
  wlanuserip:  string
  csrfhw:      string
  cookies:     Cookies
}) {
  const { username, password, wlanuserip, csrfhw, cookies } = params

  const body = new URLSearchParams({
    username,
    password,
    wlanuserip,
    CSRFHW: csrfhw,
    lang:   'en_US',
  })

  const { text, url, cookies: updatedCookies } = await nautaFetch(
    NAUTA_LOGIN,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    cookies
  )

  if (!url.includes('online.do')) {
    checkNautaAlert(text, 'login')
    throw new Error('Login fallido: credenciales incorrectas o sin saldo.')
  }

  const match = text.match(/ATTRIBUTE_UUID=(\w+)&CSRFHW=/)
  if (!match) {
    throw new Error('Login fallido: no se pudo extraer ATTRIBUTE_UUID.')
  }

  return { attributeUuid: match[1], cookies: updatedCookies }
}

// ─── 3. logoutNauta ──────────────────────────────────────────────

export async function logoutNauta(params: Omit<SessionParams, 'username'> & { username: string }) {
  const { username, wlanuserip, csrfhw, attributeUuid, cookies } = params

  const url = `${NAUTA_LOGOUT}?username=${encodeURIComponent(username)}&wlanuserip=${wlanuserip}&CSRFHW=${csrfhw}&ATTRIBUTE_UUID=${attributeUuid}`

  const { text } = await nautaFetch(url, { method: 'GET' }, cookies)

  if (!text.includes('SUCCESS')) {
    throw new Error(`Logout fallido: ${text.slice(0, 200)}`)
  }
}

// ─── 4. getRemainingTime ──────────────────────────────────────────

export async function getRemainingTime(params: SessionParams) {
  const { username, wlanuserip, csrfhw, attributeUuid, cookies } = params

  const body = new URLSearchParams({
    op:             'getLeftTime',
    username,
    wlanuserip,
    CSRFHW:         csrfhw,
    ATTRIBUTE_UUID: attributeUuid,
  })

  const { text } = await nautaFetch(
    NAUTA_QUERY,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    cookies
  )

  const remainingTime = text.trim()
  const parts         = remainingTime.split(':').map(Number)
  const remainingSeconds = parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : 0

  return { remainingTime, remainingSeconds }
}

// ─── 5. getPortalCaptcha ──────────────────────────────────────────

export async function getPortalCaptcha(username: string, password: string) {
  // GET página de login del portal → extraer csrf
  const { text: loginHtml, cookies } = await nautaFetch(`${PORTAL_LOGIN}/en-en`)

  const csrf = querySelectorAttr(loginHtml, '[name="csrf"]', 'value')
  if (!csrf) throw new Error('No se pudo extraer CSRF del portal Nauta.')

  // GET imagen del CAPTCHA
  const { buffer, cookies: updatedCookies } = await nautaFetchBinary(PORTAL_CAPTCHA, cookies)

  const captchaBase64 = `data:image/png;base64,${buffer.toString('base64')}`

  return { captchaBase64, csrf, cookies: updatedCookies, username, password }
}

// ─── 6. submitPortalCaptcha ───────────────────────────────────────

export async function submitPortalCaptcha(params: {
  username: string
  password: string
  captcha:  string
  csrf:     string
  cookies:  Cookies
}) {
  const { username, password, captcha, csrf, cookies } = params

  const body = new URLSearchParams({
    csrf,
    login_user:    username,
    password_user: password,
    captcha,
    btn_submit:    '',
  })

  const { text, url, cookies: updatedCookies } = await nautaFetch(
    PORTAL_LOGIN,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    cookies
  )

  if (url === PORTAL_LOGIN || url.endsWith('/user/login')) {
    checkPortalError(text, 'portal login')
    throw new Error('CAPTCHA incorrecto o credenciales inválidas.')
  }

  return { cookies: updatedCookies }
}

// ─── 7. getPortalAccountData ──────────────────────────────────────

export async function getPortalAccountData(params: PortalParams) {
  const { cookies } = params

  const { text } = await nautaFetch(`${PORTAL_USER}/user_info`, {}, cookies)

  const root = parseHtml(text)
  const base = root.querySelectorAll('#content .col-md-6 p')

  const getText = (idx: number) => base[idx]?.text?.trim() ?? ''

  return {
    username:          getText(0),
    blocking_date:     getText(1),
    elimination_date:  getText(2),
    account_type:      getText(3),
    service_type:      getText(4),
    available_balance: getText(5),
    remaining_time:    getText(6),
    email_account:     getText(7),
  }
}

// ─── 8. rechargeAccount ───────────────────────────────────────────

export async function rechargeAccount(params: {
  username:     string
  password:     string
  rechargeCode: string
  cookies:      Cookies
}) {
  const { password, rechargeCode, cookies } = params

  // Necesitamos el CSRF actual
  const { text: pageHtml, cookies: pageCookies } = await nautaFetch(
    `${PORTAL_USER}/recharge_account`, {}, cookies
  )
  const csrf = querySelectorAttr(pageHtml, '[name="csrf"]', 'value')

  const body = new URLSearchParams({
    csrf,
    recharge_code:  rechargeCode,
    btn_submit:     '',
  })

  const { text } = await nautaFetch(
    `${PORTAL_USER}/recharge_account`,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    pageCookies
  )

  checkPortalError(text, 'recharge account')
  void password
}

// ─── 9. transferBalance ───────────────────────────────────────────

export async function transferBalance(params: {
  username:      string
  password:      string
  targetAccount: string
  amount:        number
  cookies:       Cookies
}) {
  const { password, targetAccount, amount, cookies } = params

  const { text: pageHtml, cookies: pageCookies } = await nautaFetch(
    `${PORTAL_USER}/transfer_balance`, {}, cookies
  )
  const csrf = querySelectorAttr(pageHtml, '[name="csrf"]', 'value')

  const body = new URLSearchParams({
    csrf,
    transfer:      amount.toString(),
    password_user: password,
    id_cuenta:     targetAccount,
    action:        'checkdata',
  })

  const { text } = await nautaFetch(
    `${PORTAL_USER}/transfer_balance`,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    pageCookies
  )

  checkPortalError(text, 'transfer balance')
}

// ─── 10. changePassword ───────────────────────────────────────────

export async function changePassword(params: {
  username:    string
  oldPassword: string
  newPassword: string
  type:        'account' | 'email'
  cookies:     Cookies
}) {
  const { oldPassword, newPassword, type, cookies } = params

  const endpoint = type === 'account'
    ? `${PORTAL_USER}/change_password`
    : `${PORTAL_EMAIL}/change_password`

  const { text: pageHtml, cookies: pageCookies } = await nautaFetch(endpoint, {}, cookies)
  const csrf = querySelectorAttr(pageHtml, '[name="csrf"]', 'value')

  const body = new URLSearchParams({
    csrf,
    old_password:        oldPassword,
    new_password:        newPassword,
    repeat_new_password: newPassword,
    btn_submit:          '',
  })

  const { text } = await nautaFetch(
    endpoint,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    pageCookies
  )

  checkPortalError(text, `change ${type} password`)
}

// ─── 11. getConnectionHistory ─────────────────────────────────────

type HistoryType = 'connections' | 'recharges' | 'transfers'

const HISTORY_CONFIG: Record<HistoryType, {
  listUrl:     string
  summaryUrl:  string
  itemUrl:     string
  countKey:    string
  summaryKeys: string[]
  itemsKey:    string
  rowStride:   number
  rowFields:   string[]
}> = {
  connections: {
    listUrl:     `${PORTAL_USER}/service_detail`,
    summaryUrl:  `${PORTAL_USER}/service_detail_summary`,
    itemUrl:     `${PORTAL_USER}/service_detail_list`,
    countKey:    'connections',
    summaryKeys: ['connections', 'total_time', 'total_import', 'upload_traffic', 'download_traffic', 'total_traffic'],
    itemsKey:    'all_sessions',
    rowStride:   6,
    rowFields:   ['start_datetime', 'end_datetime', 'duration', 'upload_traffic', 'download_traffic', 'import'],
  },
  recharges: {
    listUrl:     `${PORTAL_USER}/recharge_detail`,
    summaryUrl:  `${PORTAL_USER}/recharge_detail_summary`,
    itemUrl:     `${PORTAL_USER}/recharge_detail_list`,
    countKey:    'recharges',
    summaryKeys: ['recharges', 'total_import'],
    itemsKey:    'all_recharges',
    rowStride:   4,
    rowFields:   ['datetime', 'import', 'channel', 'type'],
  },
  transfers: {
    listUrl:     `${PORTAL_USER}/transfer_detail`,
    summaryUrl:  `${PORTAL_USER}/transfer_detail_summary`,
    itemUrl:     `${PORTAL_USER}/transfer_detail_list`,
    countKey:    'transfers',
    summaryKeys: ['transfers', 'total_import'],
    itemsKey:    'all_transfers',
    rowStride:   3,
    rowFields:   ['datetime', 'import', 'target_account'],
  },
}

export async function getConnectionHistory(params: {
  username: string
  password: string
  type:     HistoryType
  cookies:  Cookies
}) {
  const { type, cookies } = params
  const cfg = HISTORY_CONFIG[type]

  const details: Record<string, unknown> = {}

  // GET lista de meses disponibles
  const { text: listHtml, cookies: listCookies } = await nautaFetch(cfg.listUrl, {}, cookies)
  const listRoot   = parseHtml(listHtml)
  const csrfMatch  = listHtml.match(/name="csrf"\s+value="([^"]+)"/)
  const csrf       = csrfMatch?.[1] ?? ''
  const yearMonths = listRoot
    .querySelectorAll('[name="year_month"] option')
    .map(el => el.getAttribute('value') ?? '')
    .filter(Boolean)

  for (const yearMonth of yearMonths) {
    details[yearMonth] = {}
    const entry = details[yearMonth] as Record<string, unknown>

    // Resumen del mes
    const summaryBody = new URLSearchParams({
      csrf,
      year_month: yearMonth,
      list_type:  'service_detail',
    })

    const { text: summaryHtml } = await nautaFetch(
      cfg.summaryUrl,
      { method: 'POST', body: summaryBody, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      listCookies
    )

    const summaryRoot  = parseHtml(summaryHtml)
    const summaryItems = summaryRoot
      .querySelectorAll('.card-stats-number')
      .map(el => el.text.trim())

    for (let i = 0; i < cfg.summaryKeys.length; i++) {
      entry[cfg.summaryKeys[i]] = summaryItems[i] ?? ''
    }

    entry[cfg.itemsKey] = []
    const items       = entry[cfg.itemsKey] as Record<string, string>[]
    const totalCount  = parseInt(entry[cfg.countKey] as string) || 0
    const totalPages  = Math.max(1, Math.ceil(totalCount / 15))

    // Páginas de detalle
    for (let page = 1; page <= totalPages; page++) {
      const { text: pageHtml } = await nautaFetch(
        `${cfg.itemUrl}/${yearMonth}/${totalCount}/${page}`,
        {},
        listCookies
      )

      const pageRoot = parseHtml(pageHtml)
      const rows     = pageRoot
        .querySelectorAll('table tr td')
        .map(el => el.text.trim())

      for (let i = 0; i + cfg.rowStride <= rows.length; i += cfg.rowStride) {
        const item: Record<string, string> = {}
        cfg.rowFields.forEach((field, fi) => {
          item[field] = rows[i + fi] ?? ''
        })
        items.push(item)
      }
    }
  }

  return details
}