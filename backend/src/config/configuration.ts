export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10) || 5432,
    name: process.env.DATABASE_NAME || 'likud_news',
    username: process.env.DATABASE_USER || 'likud',
    password: process.env.DATABASE_PASSWORD || 'likud_dev',
    ssl: process.env.DATABASE_SSL === 'true',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    expiration: parseInt(process.env.JWT_EXPIRATION ?? '3600', 10) || 3600,
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
    refreshExpiration:
      parseInt(process.env.JWT_REFRESH_EXPIRATION ?? '604800', 10) || 604800,
  },

  aws: {
    region: process.env.AWS_REGION || 'eu-west-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET || 'likud-news-media',
    cloudfrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:6001').split(','),
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10) || 100,
  },
});
