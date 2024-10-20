const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL);

const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: "weather_api_",
  }),
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many requests from this IP",
});
