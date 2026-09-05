export default async function run(page, ui) {
  await page.evaluate(() => new Promise((resolve) => document.fonts.ready.then(resolve)))
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1200)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(900)
  await page.screenshot({ path: 'c:/Users/Suraj Verma/Downloads/portfolio-react-main/shot-hero.png' })
  await page.evaluate(() => document.getElementById('toolkit')?.scrollIntoView())
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'c:/Users/Suraj Verma/Downloads/portfolio-react-main/shot-toolkit.png' })
  const checks = await page.evaluate(() => ({
    fonts: document.fonts.check('16px Manrope') && document.fonts.check('italic 16px Playfair Display'),
    docOverflow: document.documentElement.scrollWidth > window.innerWidth,
    toolItems: document.querySelectorAll('.tool-item').length,
    nameText: document.querySelector('.profile-panel h2')?.innerText,
  }))
  return checks
}
