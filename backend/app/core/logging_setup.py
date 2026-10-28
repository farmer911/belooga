"""Structured (JSON) logging with per-request id propagation via contextvar."""

import json
import logging
import sys
from contextvars import ContextVar
from datetime import datetime, timezone

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

_STD_ATTRS = set(vars(logging.makeLogRecord({}))) | {"message", "asctime", "request_id"}


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        doc = {
            "ts": datetime.fromtimestamp(record.created, timezone.utc).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "request_id": getattr(record, "request_id", request_id_var.get()),
        }
        doc.update({k: v for k, v in vars(record).items() if k not in _STD_ATTRS})  # `extra=` fields
        if record.exc_info:
            doc["exc"] = self.formatException(record.exc_info)
        return json.dumps(doc, default=str)


def configure_logging(level: str = "INFO", fmt: str = "json") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(RequestIdFilter())
    handler.setFormatter(
        JsonFormatter() if fmt == "json"
        else logging.Formatter("%(asctime)s %(levelname)s %(name)s [%(request_id)s] %(message)s")
    )
    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(level.upper())
