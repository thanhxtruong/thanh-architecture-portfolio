function setupPortfolioResume() {
  const resume = document.querySelector<HTMLDetailsElement>(".portfolio-resume")
  const printButton = document.querySelector<HTMLButtonElement>(".portfolio-print-resume")

  if (resume && window.location.hash === "#resume") {
    resume.open = true
  }

  if (resume && printButton && printButton.dataset.printBound !== "true") {
    printButton.dataset.printBound = "true"
    printButton.addEventListener("click", () => {
      resume.open = true
      window.requestAnimationFrame(() => window.print())
    })
  }
}

document.addEventListener("nav", setupPortfolioResume)
window.addEventListener("hashchange", setupPortfolioResume)
setupPortfolioResume()
