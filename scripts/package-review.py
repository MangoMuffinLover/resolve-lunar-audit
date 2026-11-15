"""Package the existing static export for local review; no scientific regeneration."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ["/", "/navigator/", "/factors/", "/explain/", "/science/", "/demo/"]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    output = Path(args.output).resolve()
    if output.suffix.lower() != ".zip":
        raise ValueError("Output must be a .zip file")
    subprocess.run(["node", "scripts/extract.mjs", "--verify-only"], cwd=ROOT, check=True)
    export = ROOT / "out"
    for route in ROUTES:
        if not (export / route.strip("/") / "index.html").is_file():
            raise ValueError(f"Build is missing route {route}")
    freeze = json.loads((ROOT / "evidence/science-freeze.json").read_text(encoding="utf-8"))
    packet_bytes = (ROOT / "src/data/science.v1.json").read_bytes()
    if packet_bytes != (export / "evidence/science/review-packet.v1.json").read_bytes():
        raise ValueError("Static evidence packet is stale; rebuild first")
    files = {}
    for file in sorted(export.rglob("*")):
        if file.is_symlink():
            raise ValueError("Static export contains an unexpected symlink")
        if file.is_file():
            raw = file.read_bytes()
            if file.suffix.lower() in {".html", ".js", ".json", ".txt", ".csv", ".md", ".css"}:
                text = raw.decode("utf-8")
                if re.search(r"[A-Za-z]:[\\/]+Users[\\/]|/(Users|home)/", text):
                    raise ValueError(f"Private machine path in exported file {file.name}")
            files["site/" + file.relative_to(export).as_posix()] = raw
    for name in ["serve.mjs", "preview-server.mjs"]:
        files["preview/" + name] = (ROOT / "scripts" / name).read_bytes()
    for name in ["B06_DEMO_SCRIPT.md", "B06_SUBMISSION_NARRATIVE.md", "B05_HUMAN_TEST.md"]:
        files["review/" + name] = (ROOT / "docs" / name).read_bytes()
    for package, license_file in [("next", "license.md"), ("react", "LICENSE"), ("react-dom", "LICENSE")]:
        files[f"licenses/{package}.txt"] = (ROOT / "node_modules" / package / license_file).read_bytes()
    files["README.md"] = """# Robustness Evaluation of South-Polar Observation and Lunar Visibility Estimates (RESOLVE)

Portable review build

Extract the entire ZIP. In the extracted folder, run with Node.js 22 or later:

    node preview/serve.mjs --root site --port 3000

Open http://127.0.0.1:3000/ in a browser. The demonstration is at /demo/.
Use another port if 3000 is occupied. The server binds only to this machine.
Do not open HTML files directly: the scientific record checks require HTTP.

The site runs without Python, npm install, the research workspace or a backend.
The source packet and exact downloads are already included under site/evidence/.
The review/ folder includes narration drafts and the pending human-test protocol.
Do not coach participants with the demonstration before the uncoached test.

This portable copy accompanies the public project at
https://resolve-lunar-audit.vercel.app/. Independent human acceptance, dedicated
screen-reader review and a presentation recording remain open work.
The package does not contain the full original research environment or raw DEMs.

release-manifest.json records every packaged file's SHA-256 and size. Matching
hashes establish byte integrity, not an external signature or terrain accuracy.
Preserve the included upstream license notices when copying this review build.
""".encode("utf-8")
    manifest = {
        "schema": "resolve.review-package.v1",
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "routes": ROUTES,
        "frozen_science_files": len(freeze["files"]),
        "scientific_contract_sha256": sha((ROOT / "src/data/audit.v1.json").read_bytes()),
        "source_packet_sha256": sha(packet_bytes),
        "human_acceptance": "not_run",
        "public_deployment": True,
        "files": [{"path": name, "bytes": len(raw), "sha256": sha(raw)} for name, raw in sorted(files.items())],
    }
    files["release-manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, raw in sorted(files.items()):
            archive.writestr(name, raw)
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise ValueError("Archive CRC validation failed")
        for entry in manifest["files"]:
            if sha(archive.read(entry["path"])) != entry["sha256"]:
                raise ValueError(f"Packaged byte mismatch: {entry['path']}")
    checksum = sha(output.read_bytes())
    output.with_suffix(".sha256").write_text(checksum + "  " + output.name + "\n", encoding="utf-8")
    print(f"Packaged {len(files)} files; {output.stat().st_size} bytes; SHA-256 {checksum}")


if __name__ == "__main__":
    main()
