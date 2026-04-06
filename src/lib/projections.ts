/**
 * Linear regression on recent data to project when clean energy hits milestones.
 * Uses the last `windowSize` years (default 5) of data.
 */

export type ProjectionResult = {
  milestone: number
  projectedYear: number | null
  confidence: number // R² value
  annualGrowth: number // pp per year
  sufficient: boolean // R² >= threshold
}

type DataPoint = {
  year: number
  clean_share: number | null
}

function linearRegression(points: { x: number; y: number }[]): {
  slope: number
  intercept: number
  rSquared: number
} {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
    sumY2 += p.y * p.y
  }

  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: 0, rSquared: 0 }

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  // R²
  const yMean = sumY / n
  let ssTot = 0, ssRes = 0
  for (const p of points) {
    ssTot += (p.y - yMean) ** 2
    ssRes += (p.y - (slope * p.x + intercept)) ** 2
  }
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot

  return { slope, intercept, rSquared }
}

export function projectMilestones(
  data: DataPoint[],
  milestones: number[] = [50, 60, 75],
  windowSize: number = 5,
  rSquaredThreshold: number = 0.5
): ProjectionResult[] {
  // Filter valid data and sort by year
  const valid = data
    .filter((d) => d.clean_share !== null)
    .sort((a, b) => a.year - b.year)

  // Take only the last `windowSize` years
  const recent = valid.slice(-windowSize)

  if (recent.length < 3) {
    return milestones.map((m) => ({
      milestone: m,
      projectedYear: null,
      confidence: 0,
      annualGrowth: 0,
      sufficient: false,
    }))
  }

  const points = recent.map((d) => ({ x: d.year, y: d.clean_share! }))
  const { slope, intercept, rSquared } = linearRegression(points)

  const currentShare = recent[recent.length - 1].clean_share!
  const currentYear = recent[recent.length - 1].year
  const sufficient = rSquared >= rSquaredThreshold

  return milestones.map((m) => {
    // Already past this milestone
    if (currentShare >= m) {
      return {
        milestone: m,
        projectedYear: currentYear,
        confidence: rSquared,
        annualGrowth: slope,
        sufficient: true,
      }
    }

    // Slope is zero or negative — will never reach
    if (slope <= 0) {
      return {
        milestone: m,
        projectedYear: null,
        confidence: rSquared,
        annualGrowth: slope,
        sufficient,
      }
    }

    const projectedYear = Math.ceil((m - intercept) / slope)

    // Don't project beyond 100 years out
    if (projectedYear > currentYear + 100) {
      return {
        milestone: m,
        projectedYear: null,
        confidence: rSquared,
        annualGrowth: slope,
        sufficient,
      }
    }

    return {
      milestone: m,
      projectedYear: sufficient ? projectedYear : null,
      confidence: rSquared,
      annualGrowth: slope,
      sufficient,
    }
  })
}
