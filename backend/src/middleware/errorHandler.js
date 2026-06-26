function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server';
  
  res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = errorHandler;
