# VDBAS — Quick Start

| Mục tiêu | Lệnh | Cổng |
| --- | --- | --- |
| Chạy FE với mock (không cần BE/DB) | `make start-mock` | `host:3000`, `exp_fe:3003`, `mock:9090` |
| Dừng mock | `make stop-mock` | \- |
| Chạy FE với BE thật | `make start-be && make start-fe-dev` | `host:3000`, `exp_fe:3003`, `quantri_be:8082`, `exp_be:8085` |
| Dừng FE dev | `make stop-fe-dev` | \- |
| Chạy toàn bộ (Docker) | `make all` | `host:3000`, `exp_fe:3003`, `quantri_be:8082`, `exp_be:8085` |
| Dừng toàn bộ | `make stop` | \- |
| Test E2E mock | `make install-e2e && make test-e2e` | \- |
| Test E2E BE thật | `make test-e2e-real` | `host:3000`, `exp_fe:3003`, `quantri_be:8082`, `exp_be:8085` |
| Trạng thái containers | `make status` | \- |
