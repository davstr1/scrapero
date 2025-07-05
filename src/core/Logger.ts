import winston from 'winston';

export class Logger {
  private static instance: winston.Logger;

  static getInstance(): winston.Logger {
    if (!this.instance) {
      this.instance = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          }),
          new winston.transports.File({ filename: 'logs/scraper.log' })
        ]
      });
    }
    return this.instance;
  }

  static child(meta: object): winston.Logger {
    return this.getInstance().child(meta);
  }
}