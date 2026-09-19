type PortfolioTheme = "light" | "dark"

function readStoredPortfolioTheme(): PortfolioTheme | null {
  try {
    const stored = localStorage.getItem("theme")
    return stored === "light" || stored === "dark" ? stored : null
  } catch {
    return null
  }
}

function updatePortfolioThemeControls(theme: PortfolioTheme) {
  const nextTheme = theme === "dark" ? "light" : "dark"

  document.querySelectorAll<HTMLButtonElement>(".portfolio-theme-toggle").forEach((button) => {
    const label = `Switch to ${nextTheme} theme`
    button.setAttribute("aria-label", label)
    button.setAttribute("title", label)
    button.setAttribute("aria-pressed", String(theme === "dark"))
  })
}

function applyPortfolioTheme(theme: PortfolioTheme, persist = false) {
  document.documentElement.setAttribute("saved-theme", theme)
  document.body.classList.toggle("theme-dark", theme === "dark")
  document.body.classList.toggle("theme-light", theme === "light")

  if (persist) {
    try {
      localStorage.setItem("theme", theme)
    } catch {
      // The selected theme still applies for this page when storage is unavailable.
    }
  }

  updatePortfolioThemeControls(theme)
  document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }))
}

function currentPortfolioTheme(): PortfolioTheme {
  return document.documentElement.getAttribute("saved-theme") === "dark" ? "dark" : "light"
}

function setupPortfolioPageControls() {
  const printButton = document.querySelector<HTMLButtonElement>(".portfolio-print-resume")

  if (printButton && printButton.dataset.printBound !== "true") {
    printButton.dataset.printBound = "true"
    printButton.addEventListener("click", () => {
      window.requestAnimationFrame(() => window.print())
    })
  }

  const menuButton = document.querySelector<HTMLButtonElement>(".portfolio-menu-toggle")
  const navigation = document.querySelector<HTMLElement>("#portfolio-main-nav")

  if (menuButton && navigation && menuButton.dataset.menuBound !== "true") {
    menuButton.dataset.menuBound = "true"
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true"
      menuButton.setAttribute("aria-expanded", String(open))
      navigation.classList.toggle("is-open", open)
    })

    navigation.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false")
      navigation.classList.remove("is-open")
    })
  }

  document.querySelectorAll<HTMLButtonElement>(".portfolio-theme-toggle").forEach((button) => {
    if (button.dataset.themeBound === "true") return

    button.dataset.themeBound = "true"
    button.addEventListener("click", () => {
      const nextTheme = currentPortfolioTheme() === "dark" ? "light" : "dark"
      applyPortfolioTheme(nextTheme, true)
    })
  })

  applyPortfolioTheme(currentPortfolioTheme())

  if (document.documentElement.dataset.portfolioThemeListener !== "true") {
    document.documentElement.dataset.portfolioThemeListener = "true"
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
      if (readStoredPortfolioTheme() === null) {
        applyPortfolioTheme(event.matches ? "dark" : "light")
      }
    })
  }
}

document.addEventListener("nav", setupPortfolioPageControls)
setupPortfolioPageControls()
