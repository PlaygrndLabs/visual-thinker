.PHONY: setup dev

PORT ?= 5173

setup:
	bun install --frozen-lockfile

dev:
	bun run dev -- --host 127.0.0.1 --port $(PORT)
