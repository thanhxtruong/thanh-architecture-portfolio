import PortfolioCaseStudy from "../../components/PortfolioCaseStudy"
import { QuartzPageTypePlugin } from "../types"

export const PortfolioCaseStudyPage: QuartzPageTypePlugin = () => ({
  name: "PortfolioCaseStudyPage",
  priority: 90,
  match: ({ fileData }) => fileData.frontmatter?.type === "project",
  layout: "portfolio-case-study",
  frame: "full-width",
  body: PortfolioCaseStudy,
})
