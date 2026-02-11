const jwt = require('jsonwebtoken');

function JwtService(secretKey) {
  function generateToken(username) {
    const claims = {};

    // Java:
    // issuedAt = now, expiration = now + 90 days
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expSeconds = nowSeconds + 60 * 60 * 24 * 90;

    const key = Buffer.from(secretKey, 'base64');

    // jsonwebtoken v9 does not allow iat/exp in options; put them in the payload.
    const payload = {
      ...claims,
      sub: username,
      iat: nowSeconds,
      exp: expSeconds,
    };

    return jwt.sign(payload, key, {
      algorithm: 'HS256',
    });
  }

  function extractUserName(token) {
    const key = Buffer.from(secretKey, 'base64');
    const decoded = jwt.verify(token, key, { algorithms: ['HS256'] });
    return decoded.sub;
  }

  function validateToken(token, userDetails) {
    const username = extractUserName(token);
    const userNameFromDetails = userDetails?.getUsername?.() ?? userDetails?.username;
    return username === userNameFromDetails && !isTokenExpired(token);
  }

  function isTokenExpired(token) {
    const key = Buffer.from(secretKey, 'base64');
    const decoded = jwt.verify(token, key, { algorithms: ['HS256'] });
    const expMs = decoded.exp * 1000;
    return expMs < Date.now();
  }

  return {
    generateToken,
    extractUserName,
    validateToken,
  };
}

module.exports = JwtService;
