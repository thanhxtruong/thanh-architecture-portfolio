import { FullSlug } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import {
  frontmatter,
  PortfolioCaseCard,
  PortfolioWritingCard,
  projectFiles,
  text,
  writingFiles,
} from "./PortfolioCards"

const PortfolioCollection: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const fm = frontmatter(fileData)
  const current = fileData.slug ?? ("index" as FullSlug)
  const isWriting = fm.collection === "writing"
  const files = isWriting ? writingFiles(allFiles) : projectFiles(allFiles)

  return (
    <article class="portfolio-collection-page" id="main-content" tabIndex={-1}>
      <header class="portfolio-page-intro">
        <p class="portfolio-eyebrow">
          {text(
            fm.eyebrow,
            isWriting ? "Software engineering, explained" : "Engineering in practice",
          )}
        </p>
        <h1>{text(fm.title, isWriting ? "Writing" : "Case Studies")}</h1>
        <p>{text(fm.description)}</p>
      </header>
      <div class="portfolio-collection">
        {isWriting ? (
          <div class="portfolio-writing-grid">
            {files.map((file) => (
              <PortfolioWritingCard file={file} current={current} />
            ))}
          </div>
        ) : (
          <>
            <div class="portfolio-card-grid">
              {files.map((file) => (
                <PortfolioCaseCard file={file} current={current} />
              ))}
            </div>
            <p class="portfolio-collection-note">
              Selected investigations from my work on production software. System details are
              generalized where appropriate.
            </p>
          </>
        )}
      </div>
    </article>
  )
}

export default (() => PortfolioCollection) satisfies QuartzComponentConstructor
