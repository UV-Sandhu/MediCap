# MediCap build progress

The only progress tracker. Agents follow the Agent Runbook (Doc 14): do the Foundation block first (if it is not Done), then work down your track,
mark each phase Done only when every Done-when check passed, and stop at every CHECKPOINT.
Statuses: Not started, In progress, Done, Blocked, Waiting (checkpoint rows).
Git: agents commit and push only to their own track branch, after the human approves each phase summary. Only the human merges into master.

## Foundation (done once by the first person to start; everyone else only merges master)  (pack: backend.md)

| # | Phase | Title | Status | Notes |
|---|---|---|---|---|
| 1 | DB1 | Verify MySQL 8 and the database accounts | Done | MySQL 26.10.0 verified; medicap_dev and medicap_app connectivity confirmed. |
| 2 | DB2 | Create the project folder and connect | Done | database/schema.sql created and SHOW DATABASES verified. |
| 3 | DB3 | Create the database and all tables | Done | Created medicap database with all 16 tables. |
| 4 | DB4 | Verify the structure and the app user | Done | Structure verified: 16 tables, 33 foreign keys, 13 check constraints. medicap_app user verified. |
| 5 | DB5 | Load the seed data | Done | Loaded database/seed.sql; verified stations count is 5. |
| 6 | DB6 | Verify every table's row count | Done | Verified all 16 table row counts match expected seed values. |
| 7 | DB7 | Business-rule queries and constraint tests | Done | Business rules 1-5 validated. CHECK constraints and FK delete restrictions verified. |
| 8 | DB8 | Reset, refresh dates and back up | Done | Full reset procedure tested and verified. DB6 row counts and Rule 2 verified. |
| 9 | BE1 | Project init and configuration | Done | Initialized backend package.json, installed dependencies, configured env.js and .env.example. |
| 10 | BE2 | Database pool, app skeleton, health | Not started | |
| 11 | BE3 | Errors, validation and helpers | Not started | |
| - | CHECKPOINT | Foundation done: database verified and loaded (DB1 to DB8) and backend skeleton (BE1 to BE3). Human: run npm test in backend/, merge it into master, push, and tell the other two to merge master into their branches. After this, every track can start. | Waiting | |

## Track 1: Data and API  (pack: backend.md)

| # | Phase | Title | Status | Notes |
|---|---|---|---|---|
| 1 | BE4 | Authentication and role guards | Not started | |
| 2 | BE5 | Stations API | Not started | |
| 3 | BE6 | Users API | Not started | |
| 4 | BE7 | Foundation tests | Not started | |
| - | CHECKPOINT | Foundation, login and stations done. Human: run npm test, merge into master (Team Guide, section 6), tell Track 2 that /auth and /stations are live. | Waiting | |
| 5 | BE8 | Storage types and medicines | Not started | |
| 6 | BE9 | Stock rule helpers and batches | Not started | |
| 7 | BE10 | Inventory read endpoint | Not started | |
| 8 | BE11 | Inventory write operations and ledger | Not started | |
| 9 | BE12 | Minimum stock settings and transaction history | Not started | |
| - | CHECKPOINT | Catalogue and inventory done (feature F3). Human: do the F3 checks in Doc 13 (Q3), merge. | Waiting | |
| 10 | BE13 | Alerts service, evaluator and endpoints | Not started | |
| 11 | BE14 | Dashboard summary | Not started | |
| - | CHECKPOINT | Alerts and dashboard summary done (feature F4). Human: check dashboard numbers against Doc 05 BE14, merge. | Waiting | |
| 12 | BE15 | Transfer read model (list, detail, search) | Not started | |
| 13 | BE16 | Create transfer | Not started | |
| 14 | BE17 | Approve and cancel | Not started | |
| 15 | BE18 | Dispatch and stock reservation | Not started | |
| 16 | BE19 | Receive and stock movement | Not started | |
| 17 | BE20 | Dashboard wiring | Not started | |
| 18 | BE22 | Transfer lifecycle test | Not started | |
| - | CHECKPOINT | Transfers done (feature F5). Human: do the F5 checks in Doc 13 (Q3), run npm run db:reset afterwards, merge. | Waiting | |
| 19 | BE21 | Reports (JSON and CSV) | Not started | |
| - | CHECKPOINT | Reports done. Track 1 complete. Human: merge, then run Q1 and Q2 from the QA pack. | Waiting | |

## Track 2: Frontend  (pack: frontend.md)

| # | Phase | Title | Status | Notes |
|---|---|---|---|---|
| 1 | FA1 | Vite project setup | Not started | |
| 2 | FA2 | Design tokens and global styles | Not started | |
| 3 | FA3 | API client and mock mode | Not started | |
| 4 | FA4 | Auth context and protected routes | Not started | |
| 5 | FA5 | Login page | Not started | |
| 6 | FA6 | App layout and sidebar | Not started | |
| 7 | FA7 | UI kit part 1: feedback and display | Not started | |
| 8 | FA8 | UI kit part 2: data and forms, formatters, polling | Not started | |
| - | CHECKPOINT | Foundation, login and layout done (mock mode). Human: open /kit and the login page, compare with the screenshots, merge. | Waiting | |
| 9 | FB1 | Dashboard | Not started | |
| - | CHECKPOINT | Dashboard done. Human: compare with the dashboard screenshot, then check it against the real backend when Track 1 has merged BE14. | Waiting | |
| 10 | FB2 | Inventory page (stock tab) | Not started | |
| 11 | FB3 | Medicine catalogue (admin tab) | Not started | |
| - | CHECKPOINT | Inventory and catalogue screens done (feature F3). Human: do the F3 checks in Doc 13 (Q3), merge. | Waiting | |
| 12 | FB4 | Transfers list and detail | Not started | |
| 13 | FB5 | New transfer wizard | Not started | |
| 14 | FB6 | Alerts page | Not started | |
| - | CHECKPOINT | Transfers and alerts screens done (features F4 and F5). Human: do the F5 checks, merge. | Waiting | |
| 15 | FC1 | Leaflet map component | Not started | |
| 16 | FC2 | Station management on the map (Admin) | Not started | |
| - | CHECKPOINT | Map and station editing done (feature F2). Human: add and delete a station on the map, merge. | Waiting | |
| 17 | FC3 | Live trucks layer | Not started | |
| 18 | FC4 | Simulation page layout and controls | Not started | |
| 19 | FC5 | Plan shipment panel (smart stops) | Not started | |
| 20 | FC6 | Telemetry and weather panel | Not started | |
| 21 | FC8 | Shipment detail drawer | Not started | |
| - | CHECKPOINT | Simulation UI done (features F7 and F8). Needs Track 3 merged for the real run. Human: do the F7 and F8 checks, merge. | Waiting | |
| 22 | FC7 | User management page | Not started | |
| 23 | FB7 | Reports page | Not started | |
| - | CHECKPOINT | Frontend complete. Human: merge, then run the full demo script (Doc 13, Q4). | Waiting | |

## Track 3: Intelligence (weather, planner, simulation)  (pack: intelligence.md)

| # | Phase | Title | Status | Notes |
|---|---|---|---|---|
| 1 | R1 | Geometry helpers | Not started | |
| 2 | R2 | Distance matrix and constants | Not started | |
| 3 | R3 | Best stop order | Not started | |
| 4 | R4 | Transfer selection and smart stops | Not started | |
| 5 | R5 | Schedule and ETA | Not started | |
| 6 | W1 | Open-Meteo client | Not started | |
| 7 | W2 | Cache, in-flight sharing and offline fallback | Not started | |
| 8 | S1 | Movement math | Not started | |
| 9 | S2 | Truck agent state machine | Not started | |
| 10 | S3 | Simulation manager and tick loop | Not started | |
| - | CHECKPOINT | Pure logic done (distance math, stop ordering, schedules, weather client, truck state machine). Human: run npm test; no database needed. Merge. | Waiting | |
| 11 | W3 | Weather endpoints | Not started | |
| 12 | W4 | Temperature logs and manual readings | Not started | |
| 13 | W5 | Cargo temperature evaluation for shipments | Not started | |
| 14 | W6 | Weather and temperature tests | Not started | |
| - | CHECKPOINT | Weather and temperature done (feature F6). Needs Track 1 BE4 and BE13 merged, or stubs (Agent Runbook, section 3). Human: do the F6 checks, merge. | Waiting | |
| 15 | R6 | Preview endpoint | Not started | |
| 16 | R7 | Launch endpoint and shipment read model | Not started | |
| 17 | R8 | Planner tests | Not started | |
| - | CHECKPOINT | Route planner done (feature F7). Human: do the F7 checks (use the SQL helper in Agent Runbook section 5 if transfers are not built yet), merge. | Waiting | |
| 18 | S4 | Persistence and event handling | Not started | |
| 19 | S5 | Weather and temperature per tick | Not started | |
| 20 | S6 | Simulation API and server start | Not started | |
| 21 | S7 | Trucks and shipments API | Not started | |
| 22 | S8 | One real thread per truck | Not started | |
| 23 | S9 | Engine tests and demo script | Not started | |
| - | CHECKPOINT | Truck engine done (feature F8). Human: run the demo script (S9), do the F8 checks, merge. | Waiting | |

## Final: QA and README  (pack: qa.md)

| # | Phase | Title | Status | Notes |
|---|---|---|---|---|
| 1 | Q1 | Root scripts and README | Not started | |
| 2 | Q2 | Smoke test script | Not started | |
| - | CHECKPOINT | Everything built. Human: Q3 checklists, Q4 demo rehearsals, Q5 viva preparation. | Waiting | |
