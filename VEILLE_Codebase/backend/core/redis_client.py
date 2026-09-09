import redis
import json
from core.config import settings

# Global Redis connection pool
_redis_pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)

def get_redis_client() -> redis.Redis:
    """Return a configured Redis client instance."""
    return redis.Redis(connection_pool=_redis_pool)

def cache_get(key: str):
    """Retrieve and deserialize a JSON object from Redis."""
    client = get_redis_client()
    data = client.get(key)
    if data:
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            pass
    return None

def cache_set(key: str, data: dict, expire_seconds: int = 300):
    """Serialize and store a JSON object in Redis with an expiration."""
    client = get_redis_client()
    client.setex(key, expire_seconds, json.dumps(data))
