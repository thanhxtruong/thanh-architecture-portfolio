import { FilePath, FullSlug, resolveRelative } from "../util/path"
import { htmlToJsx } from "../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type Frontmatter = Record<string, unknown>

const text = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback)

const PortfolioCaseStudy: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {
  const fm = (fileData.frontmatter as Frontmatter | undefined) ?? {}
  const current = fileData.slug ?? ("index" as FullSlug)
  const home = resolveRelative(current, "index" as FullSlug)
  const topic = [text(fm.case_theme), text(fm.case_topics)].filter(Boolean).join(" / ")
  const content = htmlToJsx((fileData.relativePath ?? "case-study.md") as FilePath, tree)

  return (
    <article class="popover-hint portfolio-reading portfolio-case-study">
      <a class="internal portfolio-case-back" href={`${home}#case-studies`}>
        ← Case Studies
      </a>
      {topic ? <p class="portfolio-eyebrow">{topic}</p> : null}
      <h1>{text(fm.title, "Case study")}</h1>
      <div class="portfolio-reading-summary">
        <p>{text(fm.description, text(fm.summary))}</p>
      </div>
      <div class="markdown-preview-view markdown-rendered portfolio-case-body">{content}</div>
    </article>
  )
}

export default (() => PortfolioCaseStudy) satisfies QuartzComponentConstructor
