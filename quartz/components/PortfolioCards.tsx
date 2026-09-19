import { QuartzPluginData } from "../plugins/vfile"
import { FullSlug, resolveRelative } from "../util/path"

export type PortfolioFrontmatter = Record<string, unknown>

export const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback

const number = (value: unknown, fallback = 99) =>
  typeof value === "number" ? value : Number(value ?? fallback)

export const frontmatter = (file: QuartzPluginData): PortfolioFrontmatter =>
  (file.frontmatter as PortfolioFrontmatter | undefined) ?? {}

const orderedFeaturedFiles = (allFiles: QuartzPluginData[], type: string) =>
  allFiles
    .filter((file) => {
      const fm = frontmatter(file)
      return fm.type === type && fm.featured === true && file.slug
    })
    .sort(
      (left, right) =>
        number(frontmatter(left).featured_order) - number(frontmatter(right).featured_order) ||
        text(frontmatter(right).date).localeCompare(text(frontmatter(left).date)),
    )

export const projectFiles = (allFiles: QuartzPluginData[]) =>
  orderedFeaturedFiles(allFiles, "project")

export const writingFiles = (allFiles: QuartzPluginData[]) =>
  orderedFeaturedFiles(allFiles, "article")

export function PortfolioCaseCard({
  file,
  current,
}: {
  file: QuartzPluginData
  current: FullSlug
}) {
  const fm = frontmatter(file)
  const href = resolveRelative(current, file.slug as FullSlug)

  return (
    <article class="portfolio-case-card">
      <div class="portfolio-case-body">
        <div class="portfolio-topic">
          <span class="portfolio-tag">
            {text(fm.case_theme, text(fm.project_status, "Case study"))}
          </span>
          <span>{text(fm.case_topics, text(fm.focus))}</span>
        </div>
        <h3>
          <a class="internal" href={href}>
            {text(fm.title, "Untitled")}
          </a>
        </h3>
        <p>{text(fm.card_summary, text(fm.summary, text(fm.description)))}</p>
        {fm.inside_case || fm.my_contribution ? (
          <p class="portfolio-ownership">
            <strong>Inside the case:</strong> {text(fm.inside_case, text(fm.my_contribution))}
          </p>
        ) : null}
      </div>
      <div class="portfolio-case-card-footer">
        <p>
          <strong>At stake:</strong> {text(fm.at_stake, text(fm.demonstrates, text(fm.focus)))}
        </p>
        <a class="internal portfolio-text-link" href={href}>
          Read the case study <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  )
}

export function PortfolioWritingCard({
  file,
  current,
}: {
  file: QuartzPluginData
  current: FullSlug
}) {
  const fm = frontmatter(file)
  const href = resolveRelative(current, file.slug as FullSlug)

  return (
    <a class="internal portfolio-writing-card" href={href}>
      <div class="portfolio-writing-meta">
        <span>{text(fm.category, "Software engineering")}</span>
        <span class="portfolio-small-label">{text(fm.article_label, "Article")}</span>
      </div>
      <div>
        <h3>{text(fm.title, "Untitled")}</h3>
        <p>{text(fm.card_summary, text(fm.description))}</p>
      </div>
      <span class="portfolio-article-cta">
        Read article <span aria-hidden="true">↗</span>
      </span>
    </a>
  )
}
