from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto('http://localhost:5173')

    # Inject mock user session (might need different structure for AuthContext depending on how it's implemented)
    page.evaluate('''() => {
      localStorage.setItem('capacitapro_session', JSON.stringify({
        state: { user: { id: '1', role: 'admin', name: 'Admin' } }
      }));
    }''')

    # Take a screenshot of the whole page first to see what's rendering
    page.goto('http://localhost:5173/admin/employees')
    page.wait_for_timeout(2000)
    page.screenshot(path='full_page.png')

    browser.close()
