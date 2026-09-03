.PHONY: dev

PORT ?= 5173

dev:
	bun run dev -- --host 127.0.0.1 --port $(PORT) --strictPort
