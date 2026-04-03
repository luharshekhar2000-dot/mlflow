"""Build MLflow release documentation and publish to mlflow-legacy-website."""

import argparse
import json
import os
import shutil
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

from packaging.version import InvalidVersion, Version


def _shallow_clone(
    repo: str,
    branch: str,
    dest: Path,
    *,
    user: str | None = None,
    token: str | None = None,
    blobless: bool = False,
) -> None:
    if user and token:
        url = f"https://{user}:{token}@github.com/{repo}.git"
    else:
        url = f"https://github.com/{repo}.git"
    cmd = ["git", "clone", "--depth", "1", "--branch", branch]
    if blobless:
        cmd += ["--filter=blob:none"]
    cmd += [url, str(dest)]
    subprocess.check_call(cmd)


def _read_version(repo_root: Path) -> str:
    # `uv version` outputs "<name> <version>", e.g. "mlflow 3.11.0"
    output = subprocess.check_output(["uv", "version"], cwd=repo_root, text=True)
    return output.strip().split()[-1]


def _git(repo: Path, *args: str) -> None:
    subprocess.check_call(["git", *args], cwd=repo)


def _has_changes(repo: Path) -> bool:
    result = subprocess.run(
        ["git", "diff", "--cached", "--quiet"],
        cwd=repo,
    )
    return result.returncode != 0


def _configure_git_identity(repo: Path) -> None:
    _git(repo, "config", "user.name", "mlflow-app[bot]")
    _git(
        repo,
        "config",
        "user.email",
        "mlflow-app[bot]@users.noreply.github.com",
    )


def build_docs(args: argparse.Namespace) -> None:
    mlflow_dir = Path(args.mlflow_dir).resolve()
    release_version = _read_version(mlflow_dir)
    print(f"Building docs for MLflow {release_version}")

    subprocess.check_call(["uv", "sync", "--group", "docs", "--extra", "gateway"], cwd=mlflow_dir)
    docs_dir = mlflow_dir / "docs"
    env = {**os.environ, "GTM_ID": args.gtm_id}
    subprocess.check_call(["npm", "ci"], cwd=docs_dir, env=env)
    subprocess.check_call(["npm", "run", "build-all", "--", "--use-npm"], cwd=docs_dir, env=env)

    with tempfile.TemporaryDirectory(prefix="mlflow-website-") as website_tmp:
        website_dir = Path(website_tmp) / "repo"
        _shallow_clone(
            "mlflow/mlflow-legacy-website",
            "main",
            website_dir,
            user=args.user,
            token=args.token,
        )

        _configure_git_identity(website_dir)

        # Create a new branch
        branch_name = f"docs-{release_version}-{uuid.uuid4().hex[:8]}"
        _git(website_dir, "checkout", "-b", branch_name)

        version = Version(release_version)

        # Clean up release candidate docs when publishing a final release
        if not version.is_prerelease:
            for p in (website_dir / "docs").iterdir():
                if not p.is_dir():
                    continue
                try:
                    v = Version(p.name)
                except InvalidVersion:
                    continue
                if v.is_prerelease and v.base_version == version.base_version:
                    shutil.rmtree(p)

        # Copy built docs
        src = docs_dir / "build" / str(release_version)
        for dest_name in _version_targets(version, website_dir):
            dst = website_dir / "docs" / dest_name
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)

        # Update versions.json
        _update_versions_json(website_dir / "docs" / "versions.json", version)

        # Commit, push, and create PR
        _git(website_dir, "add", "-A")

        if not _has_changes(website_dir):
            print("No changes to commit, skipping.")
            return

        _git(website_dir, "commit", "-m", "Add docs")

        if args.dry_run:
            return

        _git(website_dir, "push", "origin", branch_name)

        if args.token:
            pr_url = _create_pr(
                repo="mlflow/mlflow-legacy-website",
                head=branch_name,
                title=f"Add documentation for {release_version}",
                body="",
                token=args.token,
            )
            print(f"Created {pr_url}")


def _version_targets(version: Version, website_dir: Path) -> list[str]:
    json_path = website_dir / "docs" / "versions.json"
    versions_json = json.loads(json_path.read_text())
    latest_version = max(map(Version, versions_json["versions"]))
    targets = [str(version)]
    if version >= latest_version:
        targets.append("latest")
    return targets


def _update_versions_json(json_path: Path, release_version: Version) -> None:
    data = json.loads(json_path.read_text())
    versions = [Version(v) for v in data["versions"]]
    if release_version not in versions:
        versions.append(release_version)

    # Keep only the highest version for each minor release
    best: dict[tuple[int, int], Version] = {}
    for v in versions:
        key = (v.major, v.minor)
        if key not in best or v > best[key]:
            best[key] = v

    data["versions"] = [str(v) for v in sorted(best.values(), reverse=True)]
    json_path.write_text(json.dumps(data, indent=2))


def release_post(args: argparse.Namespace) -> None:
    mlflow_dir = Path(args.mlflow_dir).resolve()
    release_version = _read_version(mlflow_dir)
    print(f"Creating release post for MLflow {release_version}")

    with tempfile.TemporaryDirectory(prefix="mlflow-website-") as website_tmp:
        website_dir = Path(website_tmp) / "repo"
        _shallow_clone(
            "mlflow/mlflow-website",
            "main",
            website_dir,
            user=args.user,
            token=args.token,
            blobless=True,
        )

        _configure_git_identity(website_dir)

        branch_name = f"release-post-{release_version}-{uuid.uuid4().hex[:8]}"
        _git(website_dir, "checkout", "-b", branch_name)

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        name = f"{today}-{release_version}-release.md"
        post_path = website_dir / "website" / "releases" / name

        if "rc" in release_version:
            base_version = release_version.split("rc")[0]
            content = _RC_TEMPLATE.format(version=release_version, base_version=base_version)
        else:
            content = _RELEASE_TEMPLATE.format(version=release_version)

        post_path.write_text(content)

        _git(website_dir, "add", "-A")

        if not _has_changes(website_dir):
            print("No changes to commit, skipping.")
            return

        _git(website_dir, "commit", "-m", "Add release post")

        if args.dry_run:
            return

        _git(website_dir, "push", "origin", branch_name)

        if args.token:
            pr_url = _create_pr(
                repo="mlflow/mlflow-website",
                head=branch_name,
                title=f"Add release post for {release_version}",
                body="Be sure to fill in the contents",
                token=args.token,
            )
            print(f"Created {pr_url}")


_RELEASE_TEMPLATE = """\
---
title: MLflow {version}
slug: {version}
authors: [mlflow-maintainers]
---

<REPLACE_ME>

For a comprehensive list of changes, see the
[release change log](https://github.com/mlflow/mlflow/releases/tag/v{version}),
and check out the latest documentation on [mlflow.org](http://mlflow.org/).
"""

_RC_TEMPLATE = """\
---
title: MLflow {version}
slug: {version}
authors: [mlflow-maintainers]
---

MLflow {version} is a release candidate for {base_version}. To install, run the following command:

```sh
pip install mlflow=={version}
```

<!-- Major changes that need to be highlighted in the release post go here -->
<REPLACE_ME>

Please try it out and report any issues on [the issue tracker](https://github.com/mlflow/mlflow/issues).
"""


def _create_pr(*, repo: str, head: str, title: str, body: str, token: str) -> str:
    env = {**os.environ, "GH_TOKEN": token}
    output = subprocess.check_output(
        [
            "gh",
            "pr",
            "create",
            "--repo",
            repo,
            "--head",
            head,
            "--base",
            "main",
            "--title",
            title,
            "--body",
            body,
        ],
        text=True,
        env=env,
    )
    return output.strip()


def main() -> None:
    parser = argparse.ArgumentParser(description="MLflow release documentation tools")
    parser.add_argument(
        "--mlflow-dir",
        default=".",
        help="Path to the local MLflow repository checkout",
    )
    parser.add_argument(
        "--user",
        default="mlflow-app[bot]",
        help="GitHub username for authentication (default: mlflow-app[bot])",
    )
    parser.add_argument(
        "--token",
        default=os.environ.get("GH_TOKEN"),
        help="GitHub token for pushing and creating PRs (default: $GH_TOKEN)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Skip push and PR creation",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    docs_parser = subparsers.add_parser("build-docs", help="Build and publish MLflow documentation")
    docs_parser.add_argument("--gtm-id", default="GTM-TEST", help="Google Tag Manager ID")

    subparsers.add_parser("release-post", help="Create a release post")

    args = parser.parse_args()
    match args.command:
        case "build-docs":
            build_docs(args)
        case "release-post":
            release_post(args)


if __name__ == "__main__":
    main()
