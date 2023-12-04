const express = require("express");
const redis = require("redis");
const app = express();
const redisClient = redis.createClient({
  host: "host.docker.internal", // Update with your Redis server host
  port: 6379, // Update with your Redis server port
});

(async () => {
  await redisClient.connect();
})();
redisClient.on("error", (err) => console.log("Redis Client Error", err));

// Your rate-limiting function
async function checkRateLimit(ip) {
  console.log(ip, "ip");
  const windowMs = 1000; // 1 second window
  const maxRequests = 10; // Maximum requests per window
  
  // ipRateLimits
  let userSession = await redisClient.hGetAll(`user-session:123${ip}`);
  console.log(userSession, "having this");
  // console.log(JSON.stringify(userSession, null, 2));

  // Check if IP is in the tracking object
  if (Object.keys(userSession).length == 0) {
    // If not, initialize the count
    await redisClient.hSet(`user-session:123${ip}`, {
      count: 1,
      timestamp: Date.now(),
    });
    return true; // Allow the first request
  } else {
    // If IP is in the tracking object, check the count and timestamp
    const { count, timestamp } = userSession;
    console.log(count, "count");
    // Check if the window has elapsed, reset the count
    if (Date.now() - timestamp > windowMs) {
      console.log(timestamp);
      await redisClient.hSet(`user-session:123${ip}`, {
        count: 1,
        timestamp: Date.now(),
      });

      return true; // Allow the request
    } else {
      // Check if the count is within the limit
      if (count < maxRequests) {
        console.log("increment");
        await redisClient.hIncrBy(`user-session:123${ip}`, "count", 1);
        return true;
      } else {
        // Limit exceeded, reject the request
        return false;
      }
    }
  }
}

/// Middleware function
async function rateLimitMiddleware(req, res, next) {
  const clientIP = req.ip; // Assuming Express's req.ip to get the client's IP
  //checkRateLimit(clientIP).then((data) => data);
  let result = await checkRateLimit(clientIP);
  console.log(result);
  try {
    if (result) {
      console.log("Request allowed");
      next(); // Proceed to the next middleware or route handler
    } else {
      console.log("Rate limit exceeded, please try again later");
      // Respond with an error or redirect, depending on your application's needs
      res.status(429).send("Rate limit exceeded, please try again later");
    }
  } catch (error) {
    console.error("Error checking rate limit:", error);
    res.status(500).send("Internal Server Error");
  }
}

// Apply the rate-limiting middleware globally
app.use(rateLimitMiddleware);

// Your routes go here
app.get("/ok", (req, res, next) => {
  res.send("ok");
});

// Listen for the "close" event before quitting the client
redisClient.on("end", () => {
  console.log("Redis client closed");
  process.exit(); // Exit the process after the client is closed
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Close the Redis client when the server is closed
process.on("SIGINT", () => {
  redisClient.quit();
  console.log("Server is shutting down");
  process.exit();
});

console.log("new hits ios new ");
