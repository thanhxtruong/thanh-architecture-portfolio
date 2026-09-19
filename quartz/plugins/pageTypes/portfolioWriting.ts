import PortfolioWriting from "../../components/PortfolioWriting"
import { QuartzPageTypePlugin } from "../types"

export const PortfolioWritingPage: QuartzPageTypePlugin = () => ({
  name: "PortfolioWritingPage",
  priority: 91,
  match: ({ fileData }) => fileData.frontmatter?.type === "article",
  layout: "portfolio-writing",
  frame: "full-width",
  body: PortfolioWriting,
})
