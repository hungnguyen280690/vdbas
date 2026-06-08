# API Test Report - vdbas_exp_be
    
Database: **Oracle 23c (Real DB)**  
Host: `172.16.5.20`  
Service Port: `8081`  
Run Date: 2026-06-08

## Summary Table

| Method | Endpoint | Expected Status | Actual Status | Result | Details / Errors |
|--------|----------|-----------------|---------------|--------|------------------|
| GET | `/api/v1/master-data/projects` | 2xx | 200 | ✅ PASSED | [{"projectCode": "7122155", "projectManagementCode": "3029123", "projectManagementName": "BQLDA b... |
| POST | `/api/v1/category-groups` | 2xx | 201 | ✅ PASSED | {"active": true, "createdAt": "2026-06-08T11:44:30.094064277", "createdBy": "system_admin", "dele... |
| GET | `/api/v1/category-groups` | 2xx | 200 | ✅ PASSED | [{"active": true, "createdAt": "2026-06-08T11:44:30.094064277", "createdBy": "system_admin", "del... |
| GET | `/api/v1/category-groups/GRP_F734F3CC` | 2xx | 200 | ✅ PASSED | {"active": true, "createdAt": "2026-06-08T11:44:30.094064277", "createdBy": "system_admin", "dele... |
| POST | `/api/v1/category-groups/search` | 2xx | 200 | ✅ PASSED | {"content": [{"active": true, "createdAt": "2026-06-08T11:44:30.094064277", "createdBy": "system_... |
| PUT | `/api/v1/category-groups/GRP_F734F3CC` | 2xx | 200 | ✅ PASSED | {"active": true, "createdAt": "2026-06-08T11:44:30.094064277", "createdBy": "system_admin", "dele... |
| POST | `/api/v1/categories` | 2xx | 201 | ✅ PASSED | {"catLevel": 1, "catPath": "ITEM_P_001", "createdAt": "2026-06-08T11:44:30.298451277", "createdBy... |
| POST | `/api/v1/categories` | 2xx | 201 | ✅ PASSED | {"catLevel": 2, "catPath": "ITEM_P_001/ITEM_C_001", "createdAt": "2026-06-08T11:44:30.343650213",... |
| GET | `/api/v1/categories/aa3a1d5d-44ad-4381-af2c-f1512629a5b4` | 2xx | 200 | ✅ PASSED | {"catLevel": 1, "catPath": "ITEM_P_001", "createdAt": "2026-06-08T11:44:30.298451277", "createdBy... |
| GET | `/api/v1/categories/group/GRP_F734F3CC` | 2xx | 200 | ✅ PASSED | [{"catLevel": 1, "catPath": "ITEM_P_001", "createdAt": "2026-06-08T11:44:30.298451277", "createdB... |
| GET | `/api/v1/categories/group/GRP_F734F3CC/tree` | 2xx | 200 | ✅ PASSED | [{"id": "aa3a1d5d-44ad-4381-af2c-f1512629a5b4", "name": "Parent Category Item", "code": "ITEM_P_0... |
| POST | `/api/v1/categories/search` | 2xx | 200 | ✅ PASSED | {"content": [{"catLevel": 1, "catPath": "ITEM_P_001", "createdAt": "2026-06-08T11:44:30.298451277... |
| PUT | `/api/v1/categories/aa3a1d5d-44ad-4381-af2c-f1512629a5b4` | 2xx | 200 | ✅ PASSED | {"catLevel": 1, "catPath": "ITEM_P_001", "createdAt": "2026-06-08T11:44:30.298451277", "createdBy... |
| POST | `/api/v1/capex-dossier` | 2xx | 201 | ✅ PASSED | {"createdBy": "system_admin", "createdDate": "2026-06-08T11:44:30.487028411", "dataSourceCode": "... |
| POST | `/api/v1/capex-dossier` | 2xx | 201 | ✅ PASSED | {"createdBy": "system_admin", "createdDate": "2026-06-08T11:44:30.520100741", "dataSourceCode": "... |
| GET | `/api/v1/capex-dossier/c21811d6-fc92-481d-8ba2-64d678adc5a2` | 2xx | 200 | ✅ PASSED | {"approvalHistory": [], "attachments": [], "createdBy": "system_admin", "createdDate": "2026-06-0... |
| GET | `/api/v1/capex-dossier/c21811d6-fc92-481d-8ba2-64d678adc5a2/documents` | 2xx | 200 | ✅ PASSED |  |
| PUT | `/api/v1/capex-dossier/c21811d6-fc92-481d-8ba2-64d678adc5a2` | 2xx | 200 | ✅ PASSED | {"createdBy": "system_admin", "createdDate": "2026-06-08T11:44:30.487028411", "dataSourceCode": "... |
| POST | `/api/v1/capex-dossier/c21811d6-fc92-481d-8ba2-64d678adc5a2/submit` | 2xx | 200 | ✅ PASSED |  |
| POST | `/api/v1/capex-dossier/c21811d6-fc92-481d-8ba2-64d678adc5a2/workflow` | 2xx | 200 | ✅ PASSED |  |
| POST | `/api/v1/capex-dossier/c21811d6-fc92-481d-8ba2-64d678adc5a2/workflow` | 2xx | 200 | ✅ PASSED |  |
| DELETE | `/api/v1/capex-dossier/b4bd8bb3-bc8f-4397-bf47-13a7695fb38d` | 2xx | 204 | ✅ PASSED |  |
| GET | `/api/v1/capex-dossier` | 2xx | 200 | ✅ PASSED | {"content": [{"createdBy": "system_admin", "createdDate": "2026-06-06T19:20:31.141002267", "docum... |
| DELETE | `/api/v1/categories/2c4fb468-94da-4274-a4cf-fea5b5985925` | 2xx | 204 | ✅ PASSED |  |
| DELETE | `/api/v1/categories/aa3a1d5d-44ad-4381-af2c-f1512629a5b4` | 2xx | 204 | ✅ PASSED |  |
| DELETE | `/api/v1/category-groups/GRP_F734F3CC` | 2xx | 204 | ✅ PASSED |  |


**Total Tests:** 26 | **Passed:** 26 | **Failed:** 0
