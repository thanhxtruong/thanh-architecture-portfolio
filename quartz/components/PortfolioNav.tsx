import { FullSlug, resolveRelative } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore
import portfolioResumeScript from "./scripts/portfolioResume.inline"

const PortfolioNav: QuartzComponent = ({ fileData }) => {
  const current = fileData.slug ?? ("index" as FullSlug)
  const home = resolveRelative(current, "index" as FullSlug)
  const about = resolveRelative(current, "about" as FullSlug)
  const section = (anchor: string) => `${home}#${anchor}`

  return (
    <div class="portfolio-nav-shell">
      <a class="portfolio-brand" href={home} aria-label="Thanh home">
        <span class="portfolio-monogram" aria-hidden="true">
          tt
        </span>
        <span>
          <strong>Thanh Truong</strong>
          <small>Senior Software Engineer</small>
        </span>
      </a>
      <nav class="portfolio-nav" aria-label="Main navigation">
        <a href={section("work")}>What I Shipped</a>
        <a href={section("investigations")}>System Investigations</a>
        <a href={section("decisions")}>Decisions</a>
        <a href={about}>About</a>
        <a class="portfolio-nav-contact" href="https://github.com/thanhxtruong">
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </div>
  )
}

PortfolioNav.afterDOMLoaded = portfolioResumeScript

export default (() => PortfolioNav) satisfies QuartzComponentConstructor
