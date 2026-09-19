import { FullSlug, resolveRelative } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore
import portfolioResumeScript from "./scripts/portfolioResume.inline"
// @ts-ignore
import portfolioThemeScript from "./scripts/portfolioTheme.inline"

const PortfolioNav: QuartzComponent = ({ fileData }) => {
  const current = fileData.slug ?? ("index" as FullSlug)
  const home = resolveRelative(current, "index" as FullSlug)
  const about = resolveRelative(current, "about" as FullSlug)
  const cases = resolveRelative(current, "case-studies/index" as FullSlug)
  const writing = resolveRelative(current, "writing/index" as FullSlug)
  const contact = resolveRelative(current, "contact" as FullSlug)
  const section = current.split("/")[0]
  const active = current === "about" ? "about" : current === "contact" ? "contact" : section

  return (
    <>
      <a class="portfolio-skip" href="#main-content">
        Skip to content
      </a>
      <div class="portfolio-nav-shell">
        <a class="portfolio-brand" href={home} aria-label="Thanh Truong home">
          <span class="portfolio-monogram" aria-hidden="true">
            tt
          </span>
          <span>
            <strong>Thanh Truong</strong>
            <small>Software engineer &amp; builder</small>
          </span>
        </a>
        <nav id="portfolio-main-nav" class="portfolio-nav" aria-label="Main navigation">
          <a
            class="internal"
            aria-current={active === "case-studies" ? "page" : undefined}
            href={cases}
          >
            Case Studies
          </a>
          <a
            class="internal"
            aria-current={active === "writing" ? "page" : undefined}
            href={writing}
          >
            Writing
          </a>
          <a class="internal" aria-current={active === "about" ? "page" : undefined} href={about}>
            About
          </a>
          <a
            class="internal portfolio-nav-contact"
            aria-current={active === "contact" ? "page" : undefined}
            href={contact}
          >
            Contact <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <div class="portfolio-nav-controls">
          <button
            class="portfolio-theme-toggle"
            type="button"
            aria-label="Switch to dark theme"
            title="Switch to dark theme"
          >
            <svg
              class="portfolio-theme-icon portfolio-theme-moon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.6 8.6 0 1 0 20.2 15.4Z" />
            </svg>
            <svg
              class="portfolio-theme-icon portfolio-theme-sun"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3.5" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </button>
          <button
            class="portfolio-menu-toggle"
            aria-expanded="false"
            aria-controls="portfolio-main-nav"
            type="button"
          >
            Menu
          </button>
        </div>
      </div>
    </>
  )
}

PortfolioNav.afterDOMLoaded = portfolioResumeScript
PortfolioNav.beforeDOMLoaded = portfolioThemeScript

export default (() => PortfolioNav) satisfies QuartzComponentConstructor
