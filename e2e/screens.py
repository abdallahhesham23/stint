"""Screenshot every Stint screen in light and dark at phone and desktop widths.

Run with the dev server up:  python e2e/screens.py
Writes e2e/shots/<theme>-<width>-<state>.png plus one contact sheet per theme and width.
"""
import pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image

URL = 'http://localhost:5173/'
OUT = pathlib.Path(__file__).parent / 'shots'
OUT.mkdir(exist_ok=True)
SEED = (pathlib.Path(__file__).parent / 'seed.cjs').read_text(encoding='utf-8').split('if (typeof module')[0]
# Seed once per test context (sessionStorage flag survives reloads, not new contexts).
INIT = SEED + """
if (!sessionStorage.getItem('seeded')) {
  localStorage.setItem('study-tracker', JSON.stringify(seed(new Date())));
  sessionStorage.setItem('seeded', '1');
}"""
NOW = '2026-11-03T19:30:00'
ROUTES = ['today', 'subjects', 'log', 'exams', 'stats', 'settings']
SIZES = {'375': dict(width=375, height=812, has_touch=True, is_mobile=True), '1280': dict(width=1280, height=860)}

problems = []

def shoot(page, name):
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / f'{name}.png'), full_page=True)

def context(browser, theme, size, seeded=True):
    s = SIZES[size]
    ctx = browser.new_context(
        viewport={'width': s['width'], 'height': s['height']}, device_scale_factor=1,
        has_touch=s.get('has_touch', False), is_mobile=s.get('is_mobile', False),
        color_scheme=theme, reduced_motion='reduce')
    page = ctx.new_page()
    page.clock.install(time=NOW)
    if seeded:
        page.add_init_script(INIT)
    page.on('console', lambda m: m.type == 'error' and problems.append(f'{theme}/{size}: {m.text}'))
    page.on('pageerror', lambda e: problems.append(f'{theme}/{size}: pageerror {e}'))
    return ctx, page

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for theme in ['light', 'dark']:
        for size in SIZES:
            tag = f'{theme}-{size}'
            ctx, page = context(browser, theme, size)
            for r in ROUTES:
                page.goto(URL + '#/' + r)
                page.wait_for_load_state('networkidle')
                shoot(page, f'{tag}-{r}')

            # The core loop: one tap on Start, a round running, then its end and the break.
            page.goto(URL + '#/today'); page.wait_for_load_state('networkidle')
            page.get_by_role('button', name='Start studying').click()
            page.wait_for_url('**#/focus'); page.clock.run_for(3000)
            shoot(page, f'{tag}-focus')
            page.clock.run_for(34 * 60 * 1000)
            page.wait_for_selector('text=Nicely done.')
            shoot(page, f'{tag}-break')

            # An early stop: the kind card, no deficit shown.
            page.get_by_role('button', name='Done for now').click()
            page.get_by_role('button', name='Start studying').click()
            page.wait_for_url('**#/focus'); page.clock.run_for(14 * 60 * 1000)
            page.get_by_role('button', name='End round').click()
            page.wait_for_selector('text=And they count.')
            shoot(page, f'{tag}-stopped')

            # A dialog over a screen.
            page.goto(URL + '#/subjects'); page.wait_for_load_state('networkidle')
            page.get_by_role('button', name='Add a subject').click()
            shoot(page, f'{tag}-dialog')
            ctx.close()

            # First run: nothing saved yet.
            ctx, page = context(browser, theme, size, seeded=False)
            page.goto(URL + '#/today'); page.wait_for_load_state('networkidle')
            shoot(page, f'{tag}-firstrun')
            ctx.close()
    browser.close()

# Contact sheets: every state side by side for one theme and width, scaled down.
for theme in ['light', 'dark']:
    for size in SIZES:
        files = sorted(OUT.glob(f'{theme}-{size}-*.png'))
        thumbs = []
        for f in files:
            im = Image.open(f)
            w = 360 if size == '1280' else 220
            im = im.resize((w, int(im.height * w / im.width)))
            thumbs.append(im.crop((0, 0, w, min(im.height, int(w * (2.4 if size == '375' else 1.1))))))
        cols = 4 if size == '1280' else 6
        rows = -(-len(thumbs) // cols)
        cw, ch = max(t.width for t in thumbs), max(t.height for t in thumbs)
        sheet = Image.new('RGB', (cols * (cw + 8), rows * (ch + 8)), (128, 128, 128))
        for i, t in enumerate(thumbs):
            sheet.paste(t, ((i % cols) * (cw + 8), (i // cols) * (ch + 8)))
        sheet.save(OUT / f'sheet-{theme}-{size}.png')
        print(f'sheet-{theme}-{size}.png:', ', '.join(f.stem.split('-', 2)[2] for f in files))

print('console errors:', problems or 'none')
sys.exit(1 if problems else 0)
