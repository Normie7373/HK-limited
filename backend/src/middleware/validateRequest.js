// validateRequest.js

function validateRating(req, res, next) {
  const {
    transporter_id,
    rating_month,
    on_time_delivery_rate,
    damage_incidents,
    billing_accuracy,
    client_feedback_score
  } = req.body;

  if (!transporter_id || isNaN(parseInt(transporter_id))) {
    return res.status(400).json({ success: false, message: 'Valid Transporter Partner is required' });
  }

  if (!rating_month || !/^\d{4}-\d{2}$/.test(rating_month)) {
    return res.status(400).json({ success: false, message: 'Rating Month is required in YYYY-MM format' });
  }

  const onTime = parseFloat(on_time_delivery_rate);
  if (isNaN(onTime) || onTime < 0 || onTime > 100) {
    return res.status(400).json({ success: false, message: 'On-Time Delivery Rate must be between 0 and 100%' });
  }

  const damage = parseInt(damage_incidents);
  if (isNaN(damage) || damage < 0) {
    return res.status(400).json({ success: false, message: 'Damage Incidents must be 0 or greater' });
  }

  const billing = parseFloat(billing_accuracy);
  if (isNaN(billing) || billing < 0 || billing > 100) {
    return res.status(400).json({ success: false, message: 'Billing Accuracy must be between 0 and 100%' });
  }

  const feedback = parseFloat(client_feedback_score);
  if (isNaN(feedback) || feedback < 0 || feedback > 10) {
    return res.status(400).json({ success: false, message: 'Client Feedback Score must be between 0.0 and 10.0' });
  }

  next();
}

function validateTransporter(req, res, next) {
  const { name, email, phone, city } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Transporter name is required' });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address format' });
  }

  next();
}

module.exports = {
  validateRating,
  validateTransporter
};
