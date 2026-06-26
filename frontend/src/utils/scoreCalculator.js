// scoreCalculator.js

export function calculatePerformanceScore(onTimeRate, damageIncidents, billingAccuracy, clientFeedback, weights = { on_time: 0.40, billing: 0.25, feedback: 0.25, damage: 0.10 }) {
  const onTime = parseFloat(onTimeRate) || 0;
  const damage = parseInt(damageIncidents) || 0;
  const billing = parseFloat(billingAccuracy) || 0;
  const feedback = parseFloat(clientFeedback) || 0;

  // Weights
  const onTimeScore = onTime * weights.on_time;
  const billingScore = billing * weights.billing;
  const feedbackScore = (feedback / 10) * 100 * weights.feedback;
  
  // Damage penalty: each incident reduces score by 2 points, max penalty 10
  const damagePenalty = Math.min(damage * 2, 10);
  const damageScore = (1 - damagePenalty / 100) * 100 * weights.damage;
  
  const total = onTimeScore + billingScore + feedbackScore + damageScore;
  return Math.round(total * 10) / 10; // round to 1 decimal
}

export function getTier(score) {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 60) return 'AVERAGE';
  return 'POOR';
}
