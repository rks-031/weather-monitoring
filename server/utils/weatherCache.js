const weatherCache = {
  async get(city) {
    const cached = await redis.get(`weather:${city}`);
    return cached ? JSON.parse(cached) : null;
  },

  async set(city, data) {
    await redis.setex(`weather:${city}`, 300, JSON.stringify(data));
  },
};
