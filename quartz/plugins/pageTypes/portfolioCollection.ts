import PortfolioCollection from "../../components/PortfolioCollection"
import { QuartzPageTypePlugin } from "../types"

export const PortfolioCollectionPage: QuartzPageTypePlugin = () => ({
  name: "PortfolioCollectionPage",
  priority: 95,
  match: ({ fileData }) => fileData.frontmatter?.type === "collection",
  layout: "portfolio-collection",
  frame: "full-width",
  body: PortfolioCollection,
})
