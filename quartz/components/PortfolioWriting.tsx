import { FilePath, FullSlug, resolveRelative } from "../util/path"
import { htmlToJsx } from "../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { frontmatter, text } from "./PortfolioCards"

const PortfolioWriting: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {
  const fm = frontmatter(fileData)
  const current = fileData.slug ?? ("index" as FullSlug)
  const writing = resolveRelative(current, "writing/index" as FullSlug)
  const content = htmlToJsx((fileData.relativePath ?? "article.md") as FilePath, tree)

  return (
    <article
      class="popover-hint portfolio-reading portfolio-writing-page"
      id="main-content"
      tabIndex={-1}
    >
      <a class="internal portfolio-back" href={writing}>
        ← Writing
      </a>
      <p class="portfolio-eyebrow">{text(fm.article_topic, text(fm.category))}</p>
      <h1>{text(fm.title, "Article")}</h1>
      <p class="portfolio-dek">{text(fm.description)}</p>
      <p class="portfolio-article-meta">{text(fm.article_note, text(fm.date))}</p>
      <div class="markdown-preview-view markdown-rendered portfolio-reading-body">{content}</div>
    </article>
  )
}

export default (() => PortfolioWriting) satisfies QuartzComponentConstructor
