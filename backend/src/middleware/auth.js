const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hkshipping_jwt_secret_key_12345';

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'Authorization token is required' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const rolesArray = Array.isArray(roles) ? roles : [roles];
    
    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Role ${req.user.role} does not have access to this resource` 
      });
    }

    next();
  };
}

module.exports = {
  authenticateJWT,
  requireRole
};
