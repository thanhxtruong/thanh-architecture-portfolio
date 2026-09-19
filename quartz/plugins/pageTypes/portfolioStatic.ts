import PortfolioStaticPage from "../../components/PortfolioStaticPage"
import { QuartzPageTypePlugin } from "../types"

export const PortfolioStaticPageType: QuartzPageTypePlugin = () => ({
  name: "PortfolioStaticPage",
  priority: 92,
  match: ({ fileData }) => fileData.frontmatter?.type === "portfolio-page",
  layout: "portfolio-static",
  frame: "full-width",
  body: PortfolioStaticPage,
})
