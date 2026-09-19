type InitialPortfolioTheme = "light" | "dark"

function storedPortfolioTheme(): InitialPortfolioTheme | null {
  try {
    const stored = localStorage.getItem("theme")
    return stored === "light" || stored === "dark" ? stored : null
  } catch {
    return null
  }
}

const systemPortfolioTheme: InitialPortfolioTheme = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches
  ? "dark"
  : "light"

document.documentElement.setAttribute("saved-theme", storedPortfolioTheme() ?? systemPortfolioTheme)
