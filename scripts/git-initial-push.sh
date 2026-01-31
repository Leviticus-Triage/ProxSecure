#!/bin/bash
# ProxSecure: Initial Git setup and optional push to GitHub.
# Run from project root: ./scripts/git-initial-push.sh

set -e
cd "$(dirname "$0")/.."
REPO_NAME="ProxSecure"

echo "==> Git init and initial commit..."
git init
git add README.md AUTOMATION.md DEPLOYMENT.md SECURITY.md CHANGELOG.md LICENSE .gitignore docker-compose.yml nginx.conf
git add backend/.env.example backend/requirements.txt backend/Dockerfile backend/main.py backend/app/ backend/tests/
git add frontend/package.json frontend/package-lock.json frontend/Dockerfile frontend/nginx.conf frontend/index.html frontend/vite.config.js frontend/postcss.config.js frontend/tailwind.config.js frontend/src/ frontend/.gitignore
git add .github/

git branch -M main
git commit -m "Initial commit: ProxSecure v0.1.0

- Modular audit engine with 10 compliance checks
- ISO 27001:2022 and BSI IT-Grundschutz mapping
- Mock/Real/Hybrid Proxmox modes
- Automation API with dry-run and execute
- React dashboard with fleet overview
- PDF report generation
- Docker Compose deployment
- Comprehensive documentation with architecture diagrams"

echo "==> Initial commit done."
echo ""

if command -v gh &>/dev/null; then
  if gh auth status &>/dev/null; then
    echo "==> Creating GitHub repo and pushing..."
    if git remote get-url origin &>/dev/null; then
      echo "    (remote origin already set, pushing only)"
      git push -u origin main
    else
      gh repo create "$REPO_NAME" --public --source=. --remote=origin --description "ProxSecure: Advanced Proxmox Security Audit & Hardening Architecture - A modular framework for automated security compliance checks" --push
    fi
    echo "==> Done. Check: gh repo view --web"
  else
    echo "==> GitHub CLI not logged in. Run: gh auth login"
    echo "    Then run this script again to create repo and push."
  fi
else
  echo "==> To push to GitHub:"
  echo "    1. Create a new repository on https://github.com/new named '$REPO_NAME' (no README/.gitignore)."
  echo "    2. Run:"
  echo "       git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
  echo "       git push -u origin main"
fi
