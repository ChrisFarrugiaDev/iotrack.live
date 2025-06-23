package main

import "iotrack.live/internal/cache"

type App struct {
	Cache *cache.RedisCache
}
