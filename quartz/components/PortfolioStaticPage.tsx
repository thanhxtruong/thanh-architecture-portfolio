import { FilePath } from "../util/path"
import { htmlToJsx } from "../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const PortfolioStaticPage: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {
  const content = htmlToJsx((fileData.relativePath ?? "page.md") as FilePath, tree)
  const classes = Array.isArray(fileData.frontmatter?.cssclasses)
    ? fileData.frontmatter.cssclasses.join(" ")
    : ""

  return (
    <article
      class={`popover-hint portfolio-static-page ${classes}`}
      id="main-content"
      tabIndex={-1}
    >
      <div class="markdown-preview-view markdown-rendered">{content}</div>
    </article>
  )
}

export default (() => PortfolioStaticPage) satisfies QuartzComponentConstructor
