"""SHA-256 content-addressed object store on local filesystem (Megaplan §7.3)."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import os
from pathlib import Path
import sqlite3
import tempfile

from fieldscan_cloud.db import immediate_tx, now_ts


@dataclass(frozen=True)
class StoredObject:
    sha256: str
    byte_count: int
    media_type: str
    storage_relpath: str
    reused: bool


def object_relpath(sha256: str) -> str:
    digest = sha256.lower()
    if len(digest) != 64:
        raise ValueError("Invalid SHA-256 digest length")
    return f"objects/sha256/{digest[:2]}/{digest}"


def resolve_object_path(data_dir: Path, storage_relpath: str) -> Path:
    """Resolve storage_relpath strictly inside data_dir/objects to prevent traversal."""
    root = (data_dir / "objects").resolve()
    full = (data_dir / storage_relpath).resolve()
    full.relative_to(root)
    return full


def store_bytes_atomically(
    conn: sqlite3.Connection,
    *,
    data_dir: Path,
    content: bytes,
    media_type: str,
) -> StoredObject:
    """Persist bytes into content-addressed store via temp file + fsync + atomic rename."""
    sha = hashlib.sha256(content).hexdigest()
    byte_count = len(content)
    relpath = object_relpath(sha)
    target = data_dir / relpath
    target.parent.mkdir(parents=True, exist_ok=True)

    reused = False
    if target.is_file():
        existing_bytes = target.read_bytes()
        if hashlib.sha256(existing_bytes).hexdigest() == sha and len(existing_bytes) == byte_count:
            reused = True
        else:
            raise OSError(f"Existing object on disk failed integrity check: {sha}")
    else:
        fd, tmp_name = tempfile.mkstemp(prefix=".obj_", dir=str(target.parent))
        tmp_path = Path(tmp_name)
        try:
            with os.fdopen(fd, "wb") as handle:
                handle.write(content)
                handle.flush()
                os.fsync(handle.fileno())
            if tmp_path.stat().st_size != byte_count:
                raise OSError("Written byte count mismatch before atomic rename")
            os.replace(tmp_path, target)
            os.chmod(target, 0o640)
        except Exception:
            if tmp_path.exists():
                tmp_path.unlink(missing_ok=True)
            raise

    ts = now_ts()
    with immediate_tx(conn):
        existing_row = conn.execute("SELECT sha256 FROM objects WHERE sha256 = ?;", (sha,)).fetchone()
        if existing_row is not None:
            reused = True
        else:
            conn.execute(
                """
                INSERT INTO objects (sha256, byte_count, media_type, storage_relpath, created_at)
                VALUES (?, ?, ?, ?, ?);
                """,
                (sha, byte_count, media_type, relpath, ts),
            )

    return StoredObject(
        sha256=sha,
        byte_count=byte_count,
        media_type=media_type,
        storage_relpath=relpath,
        reused=reused,
    )


def store_file_atomically(
    conn: sqlite3.Connection,
    *,
    data_dir: Path,
    source_path: Path,
    media_type: str,
) -> StoredObject:
    return store_bytes_atomically(
        conn,
        data_dir=data_dir,
        content=source_path.read_bytes(),
        media_type=media_type,
    )


def find_orphan_objects(conn: sqlite3.Connection, *, data_dir: Path) -> dict[str, list[str]]:
    """Report disk files or object rows not referenced by any publication or source revision."""
    referenced = {
        row["sha"]
        for row in conn.execute(
            """
            SELECT object_sha256 AS sha FROM publication_objects
            UNION
            SELECT content_sha256 AS sha FROM source_revisions;
            """
        ).fetchall()
    }
    db_objects = {row["sha256"] for row in conn.execute("SELECT sha256 FROM objects;").fetchall()}
    unreferenced_db = sorted(db_objects - referenced)

    disk_root = data_dir / "objects" / "sha256"
    disk_hashes: set[str] = set()
    if disk_root.is_dir():
        for path in disk_root.rglob("*"):
            if path.is_file() and not path.name.startswith(".") and len(path.name) == 64:
                disk_hashes.add(path.name)

    untracked_disk = sorted(disk_hashes - db_objects)
    missing_on_disk = sorted(referenced - disk_hashes)
    return {
        "unreferenced_db_objects": unreferenced_db,
        "untracked_disk_objects": untracked_disk,
        "missing_referenced_objects": missing_on_disk,
    }
