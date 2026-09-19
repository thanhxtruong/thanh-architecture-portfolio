import { FullSlug, resolveRelative } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore
import portfolioResumeScript from "./scripts/portfolioResume.inline"

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
        <button
          class="portfolio-menu-toggle"
          aria-expanded="false"
          aria-controls="portfolio-main-nav"
          type="button"
        >
          Menu
        </button>
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
      </div>
    </>
  )
}

PortfolioNav.afterDOMLoaded = portfolioResumeScript

export default (() => PortfolioNav) satisfies QuartzComponentConstructor
