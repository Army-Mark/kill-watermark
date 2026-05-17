package config

import "os"

type Config struct {
	Port        string
	JWTSecret   string
	DatabaseDSN string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		JWTSecret:   getEnv("JWT_SECRET", "dev-secret-key-change-in-production"),
		DatabaseDSN: getEnv("DATABASE_DSN", "./video.db"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
