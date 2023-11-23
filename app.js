const express = require("express");
const app = express();

// Your rate-limiting function
const ipRateLimits = {};

// usersession
function checkRateLimit(ip) {
  const windowMs = 60 * 100; // 1 sec window
  const maxRequests = 10; // Maximum requests per window
  console.log(ipRateLimits);
  // Check if IP is in the tracking object
  if (!ipRateLimits[ip]) {
    // If not, initialize the count
    ipRateLimits[ip] = { count: 1, timestamp: Date.now() };
    return true; // Allow the first request
  } else {
    // If IP is in the tracking object, check the count and timestamp
    const { count, timestamp } = ipRateLimits[ip];

    // Check if the window has elapsed, reset the count
    if (Date.now() - timestamp > windowMs) {
      ipRateLimits[ip] = { count: 1, timestamp: Date.now() };
      return true; // Allow the request
    } else {
      // Check if the count is within the limit
      if (count < maxRequests) {
        // Increment the count and allow the request
        ipRateLimits[ip].count++;
        return true;
      } else {
        // Limit exceeded, reject the request
        return false;
      }
    }
  }
}

// Middleware function
function rateLimitMiddleware(req, res, next) {
  const clientIP = req.ip; // Assuming Express's req.ip to get the client's IP
  if (checkRateLimit(clientIP)) {
    console.log("Request allowed");
    next(); // Proceed to the next middleware or route handler
  } else {
    console.log("Rate limit exceeded, please try again later");
    // Respond with an error or redirect, depending on your application's needs
    res.status(429).send("Rate limit exceeded, please try again later");
  }
}

// Apply the rate-limiting middleware globally
app.use(rateLimitMiddleware);

// Your routes go here
app.get("/ok", (req, res, next) => {
  res.send("ok");
});
// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
