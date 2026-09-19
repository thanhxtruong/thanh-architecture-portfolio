import { FilePath, FullSlug, resolveRelative } from "../util/path"
import { htmlToJsx } from "../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { frontmatter, text } from "./PortfolioCards"

const PortfolioCaseStudy: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {
  const fm = frontmatter(fileData)
  const current = fileData.slug ?? ("index" as FullSlug)
  const cases = resolveRelative(current, "case-studies/index" as FullSlug)
  const topic = [text(fm.case_theme), text(fm.case_topics)].filter(Boolean).join(" / ")
  const content = htmlToJsx((fileData.relativePath ?? "case-study.md") as FilePath, tree)

  return (
    <article
      class="popover-hint portfolio-reading portfolio-case-study"
      id="main-content"
      tabIndex={-1}
    >
      <a class="internal portfolio-back" href={cases}>
        ← Case Studies
      </a>
      {topic ? <p class="portfolio-eyebrow">{topic}</p> : null}
      <h1>{text(fm.title, "Case study")}</h1>
      <p class="portfolio-dek">{text(fm.description, text(fm.summary))}</p>
      {fm.my_contribution ? (
        <aside class="portfolio-note">
          <p class="portfolio-eyebrow">My contribution</p>
          <p>{text(fm.my_contribution)}</p>
        </aside>
      ) : null}
      <div class="markdown-preview-view markdown-rendered portfolio-reading-body">{content}</div>
    </article>
  )
}

export default (() => PortfolioCaseStudy) satisfies QuartzComponentConstructor
