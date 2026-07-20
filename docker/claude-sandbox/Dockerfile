# syntax=docker/dockerfile:1

# Dev sandbox for running Claude Code with --dangerously-skip-permissions.
# Isolated from the host: Claude Code can only reach what's mounted/networked here.
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    ripgrep \
    build-essential \
    python3 \
    postgresql-client \
    vim \
    less \
    sudo \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code

# Non-root user so --dangerously-skip-permissions doesn't run as container root.
# node:22-bookworm-slim already ships a uid-1000 "node" user — reuse it instead
# of creating a new one (a fresh uid 1000 would collide).
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/node

USER node
WORKDIR /workspace

CMD ["sleep", "infinity"]
