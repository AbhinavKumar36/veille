import logging
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("veille.ws")

router = APIRouter(tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        # case_id -> list of active connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, case_id: str):
        await websocket.accept()
        if case_id not in self.active_connections:
            self.active_connections[case_id] = []
        self.active_connections[case_id].append(websocket)
        logger.info(f"WebSocket connected for case {case_id}. Total: {len(self.active_connections[case_id])}")

    def disconnect(self, websocket: WebSocket, case_id: str):
        if case_id in self.active_connections and websocket in self.active_connections[case_id]:
            self.active_connections[case_id].remove(websocket)
            if not self.active_connections[case_id]:
                del self.active_connections[case_id]
            logger.info(f"WebSocket disconnected for case {case_id}.")

    async def broadcast_to_case(self, case_id: str, message: dict):
        if case_id in self.active_connections:
            for connection in self.active_connections[case_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending ws message: {e}")

from core.redis_client import _redis_pool
import redis.asyncio as aioredis
import asyncio
import json

manager = ConnectionManager()

async def redis_listener():
    """Background task to listen for Redis pub/sub messages and broadcast them."""
    # We use aioredis for async pub/sub
    import os
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = aioredis.from_url(redis_url, decode_responses=True)
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("graph_updates")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    case_id = data.get("case_id")
                    if case_id:
                        await manager.broadcast_to_case(case_id, data)
                except Exception as e:
                    logger.error(f"Failed to process pubsub message: {e}")
    except Exception as e:
        logger.error(f"Redis listener failed: {e}")

# Note: In a real app, redis_listener would be started in lifespan event of FastAPI.
# We'll just start it when the first websocket connects for simplicity in this demo if not already running.
_listener_task = None

@router.websocket("/{case_id}")
async def websocket_endpoint(websocket: WebSocket, case_id: str):
    global _listener_task
    if _listener_task is None:
        _listener_task = asyncio.create_task(redis_listener())

    await manager.connect(websocket, case_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, case_id)

