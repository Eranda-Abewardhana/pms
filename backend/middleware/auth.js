const jwt = require('jsonwebtoken');

/**
 * @description Verifies JWT token and attaches decoded user to req.user.
 */
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      data: null,
      error: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      data: null,
      error: 'Invalid token',
    });
  }
};

/**
 * @description Role-based authorization middleware.
 * Usage: router.get('/path', protect, authorize('admin', 'receptionist'), handler)
 * @param {...string} roles - Allowed roles
 */
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user?.role}' is not authorized to access this route`,
      data: null,
      error: 'Forbidden',
    });
  }
  next();
};

