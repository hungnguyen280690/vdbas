# API Test Report - vdbas_exp_be
    
Database: **Oracle 23c (Real DB)**  
Host: `172.16.5.20`  
Service Port: `8081`  
Run Date: 2026-06-07

## Summary Table

| Method | Endpoint | Expected Status | Actual Status | Result | Details / Errors |
|--------|----------|-----------------|---------------|--------|------------------|
| GET | `/api/v1/master-data/projects` | 2xx | 200 | ✅ PASSED | [{"projectCode": "7122155", "projectManagementCode": "3029123", "projectManagementName": "BQLDA b... |
| POST | `/api/category-groups` | 2xx | 201 | ✅ PASSED | {"active": true, "createdAt": "2026-06-07T15:56:17.357478448", "createdBy": "system_admin", "dele... |
| GET | `/api/category-groups` | 2xx | 200 | ✅ PASSED | [{"active": true, "createdAt": "2026-06-07T15:56:17.357478448", "createdBy": "system_admin", "del... |
| GET | `/api/category-groups/GRP_A58A510C` | 2xx | 200 | ✅ PASSED | {"active": true, "createdAt": "2026-06-07T15:56:17.357478448", "createdBy": "system_admin", "dele... |
| POST | `/api/category-groups/search` | 2xx | 200 | ✅ PASSED | {"content": [{"active": true, "createdAt": "2026-06-07T15:56:17.357478448", "createdBy": "system_... |
| PUT | `/api/category-groups/GRP_A58A510C` | 2xx | 200 | ✅ PASSED | {"active": true, "createdAt": "2026-06-07T15:56:17.357478448", "createdBy": "system_admin", "dele... |
| POST | `/api/categories` | 2xx | 201 | ✅ PASSED | {"catLevel": 1, "catPath": "ITEM_P_001", "createdAt": "2026-06-07T15:56:17.692358875", "createdBy... |
| POST | `/api/categories` | 2xx | 201 | ✅ PASSED | {"catLevel": 2, "catPath": "ITEM_P_001/ITEM_C_001", "createdAt": "2026-06-07T15:56:17.747344665",... |
| GET | `/api/categories/dd846f7a-234b-4331-9b6f-76143e47a788` | 2xx | 200 | ✅ PASSED | {"catLevel": 1, "catPath": "ITEM_P_001", "createdAt": "2026-06-07T15:56:17.692358875", "createdBy... |
| GET | `/api/categories/group/GRP_A58A510C` | 2xx | 200 | ✅ PASSED | [{"catLevel": 1, "catPath": "ITEM_P_001", "createdAt": "2026-06-07T15:56:17.692358875", "createdB... |
| GET | `/api/categories/group/GRP_A58A510C/tree` | 2xx | 200 | ✅ PASSED | [{"id": "dd846f7a-234b-4331-9b6f-76143e47a788", "name": "Parent Category Item", "code": "ITEM_P_0... |
| POST | `/api/categories/search` | 2xx | 200 | ✅ PASSED | {"content": [{"catLevel": 1, "catPath": "ITEM_P_001", "createdAt": "2026-06-07T15:56:17.692358875... |
| PUT | `/api/categories/dd846f7a-234b-4331-9b6f-76143e47a788` | 2xx | 200 | ✅ PASSED | {"catLevel": 1, "catPath": "ITEM_P_001", "createdAt": "2026-06-07T15:56:17.692358875", "createdBy... |
| POST | `/api/v1/capex-dossier` | 2xx | 201 | ✅ PASSED | {"createdBy": "system_admin", "createdDate": "2026-06-07T15:56:17.924637507", "dataSourceCode": "... |
| POST | `/api/v1/capex-dossier` | 2xx | 201 | ✅ PASSED | {"createdBy": "system_admin", "createdDate": "2026-06-07T15:56:18.055638581", "dataSourceCode": "... |
| GET | `/api/v1/capex-dossier/772bdd8b-a24a-4af1-8a64-8f38ab651f98` | 2xx | 200 | ✅ PASSED | {"approvalHistory": [], "attachments": [], "createdBy": "system_admin", "createdDate": "2026-06-0... |
| GET | `/api/v1/capex-dossier/772bdd8b-a24a-4af1-8a64-8f38ab651f98/documents` | 2xx | 200 | ✅ PASSED |  |
| PUT | `/api/v1/capex-dossier/772bdd8b-a24a-4af1-8a64-8f38ab651f98` | 2xx | 200 | ✅ PASSED | {"createdBy": "system_admin", "createdDate": "2026-06-07T15:56:17.924637507", "dataSourceCode": "... |
| POST | `/api/v1/capex-dossier/772bdd8b-a24a-4af1-8a64-8f38ab651f98/submit` | 2xx | 200 | ✅ PASSED |  |
| POST | `/api/v1/capex-dossier/772bdd8b-a24a-4af1-8a64-8f38ab651f98/workflow` | 2xx | 200 | ✅ PASSED |  |
| POST | `/api/v1/capex-dossier/772bdd8b-a24a-4af1-8a64-8f38ab651f98/workflow` | 2xx | 200 | ✅ PASSED |  |
| DELETE | `/api/v1/capex-dossier/88adf8da-c5f3-43ea-afe5-ecee5835bf1f` | 2xx | 204 | ✅ PASSED |  |
| GET | `/api/v1/capex-dossier` | 2xx | 200 | ✅ PASSED | {"content": [{"createdBy": "system_admin", "createdDate": "2026-06-06T19:20:31.141002267", "docum... |
| DELETE | `/api/categories/9f1b3eb3-6aca-4b42-9c38-a05931261a22` | 2xx | 204 | ✅ PASSED |  |
| DELETE | `/api/categories/dd846f7a-234b-4331-9b6f-76143e47a788` | 2xx | 204 | ✅ PASSED |  |
| DELETE | `/api/category-groups/GRP_A58A510C` | 2xx | 204 | ✅ PASSED |  |


**Total Tests:** 26 | **Passed:** 26 | **Failed:** 0
