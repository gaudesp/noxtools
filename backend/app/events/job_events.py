from __future__ import annotations

import asyncio
import json
from typing import Any, Dict, Set


class JobEventBus:
  """
  Lightweight in-process pub/sub for job events.
  """

  def __init__(self) -> None:
    self.subscribers: Set[asyncio.Queue] = set()
    self.loop: asyncio.AbstractEventLoop | None = None

  def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
    self.loop = loop

  def subscribe(self) -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue()
    self.subscribers.add(queue)
    return queue

  def unsubscribe(self, queue: asyncio.Queue) -> None:
    self.subscribers.discard(queue)

  async def publish(self, event: Dict[str, Any]) -> None:
    for queue in list(self.subscribers):
      await queue.put(event)

  def publish_sync(self, event: Dict[str, Any]) -> None:
    if not self.loop:
      return
    asyncio.run_coroutine_threadsafe(self.publish(event), self.loop)


job_event_bus = JobEventBus()
