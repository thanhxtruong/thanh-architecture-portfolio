import { FullSlug, resolveRelative } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

const PortfolioFooter: QuartzComponent = ({ fileData }) => {
  const current = fileData.slug ?? ("index" as FullSlug)
  const about = resolveRelative(current, "about" as FullSlug)
  const contact = resolveRelative(current, "contact" as FullSlug)

  return (
    <footer class="portfolio-footer">
      <div>
        <p>© 2026 Thanh Truong</p>
        <p>Built with care. Explained with context.</p>
      </div>
      <div class="portfolio-footer-links">
        <a class="internal" href={`${about}#resume`}>
          Résumé
        </a>
        <a href="https://github.com/thanhxtruong" target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
        <a class="internal" href={contact}>
          Contact
        </a>
      </div>
    </footer>
  )
}

export default (() => PortfolioFooter) satisfies QuartzComponentConstructor
