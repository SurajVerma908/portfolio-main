export default async function run(page, ui) {
  const s1 = await ui.snapshot()
  if (s1.includes('button "Sign in"')) {
    const user = s1.match(/@(e\d+) textbox "Username"/)?.[1]
    const pass = s1.match(/@(e\d+) textbox "Password"/)?.[1]
    const check = s1.match(/@(e\d+) checkbox/)?.[1]
    const btn = s1.match(/@(e\d+) button "Sign in"/)?.[1]
    if (!user || !pass || !btn) return { error: 'no login form', s1 }
    await ui.fill(user, 'admin')
    await ui.fill(pass, 'surya-admin')
    if (check) await ui.click(check)
    await ui.click(btn)
    await page.waitForTimeout(2000)
  }
  const loggedIn = await page.evaluate(() => ({
    token: Boolean(localStorage.getItem('adminToken')),
    editor: document.body.innerText.includes('CONTENT CONTROL ROOM'),
  }))
  return loggedIn
}
