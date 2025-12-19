"""Typed in-process event bus for job lifecycle notifications."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, Optional, Set


@dataclass(frozen=True)
class JobEvent:
  """
  Typed representation of a job lifecycle event.

  Attributes:
    type: Event type string (e.g., "job_created", "job_updated", "job_deleted").
    payload: Arbitrary payload data, usually a serialized job.
  """

  type: str
  payload: Dict[str, Any]

  def as_json(self) -> Dict[str, Any]:
    """Return a JSON-serializable dictionary."""
    return {"type": self.type, **self.payload}


class JobEventBus:
  """
  Lightweight, resilient pub/sub bus for job events.

  Designed to avoid propagating errors to publishers (e.g., workers/services)
  while allowing async SSE consumers to subscribe.
  """

  def __init__(self) -> None:
    self.subscribers: Set[asyncio.Queue] = set()
    self.loop: Optional[asyncio.AbstractEventLoop] = None

  def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
    """Bind the asyncio loop used for publishing."""
    self.loop = loop

  def subscribe(self) -> asyncio.Queue:
    """Register a new subscriber queue."""
    queue: asyncio.Queue = asyncio.Queue()
    self.subscribers.add(queue)
    return queue

  def unsubscribe(self, queue: asyncio.Queue) -> None:
    """Remove a subscriber queue."""
    self.subscribers.discard(queue)

  async def publish(self, event: JobEvent) -> None:
    """
    Asynchronously push an event to all subscribers.

    Args:
      event: Event to distribute.
    """
    for queue in list(self.subscribers):
      try:
        await queue.put(event.as_json())
      except Exception:
        self.subscribers.discard(queue)

  def publish_sync(self, event: JobEvent) -> None:
    """
    Schedule an async publish from synchronous code.

    Args:
      event: Event to distribute.
    """
    if not self.loop:
      return
    try:
      asyncio.run_coroutine_threadsafe(self.publish(event), self.loop)
    except Exception:
      pass


job_event_bus = JobEventBus()
