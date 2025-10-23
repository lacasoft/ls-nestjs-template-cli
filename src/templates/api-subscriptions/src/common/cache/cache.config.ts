import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
  ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutos
  max: parseInt(process.env.CACHE_MAX_ITEMS || '100', 10),
}));
