import requests
import os
import json
from datetime import date
import uuid

PORT = os.environ.get("SERVER_PORT", "8081")
BASE_URL = f"http://localhost:{PORT}"
HEADERS = {
    "X-User-Id": "system_admin",
    "Content-Type": "application/json"
}

results = []

def record_result(endpoint, method, status, payload, response_data, success, error_msg=""):
    results.append({
        "endpoint": endpoint,
        "method": method,
        "status": status,
        "payload": payload,
        "response": response_data,
        "success": success,
        "error": error_msg
    })

def test_endpoint(method, path, payload=None, params=None):
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            r = requests.get(url, params=params, headers=HEADERS)
        elif method == "POST":
            r = requests.post(url, json=payload, headers=HEADERS)
        elif method == "PUT":
            r = requests.put(url, json=payload, headers=HEADERS)
        elif method == "DELETE":
            r = requests.delete(url, json=payload, headers=HEADERS)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        status = r.status_code
        try:
            resp_body = r.json()
        except:
            resp_body = r.text
        
        success = 200 <= status < 300
        error_msg = "" if success else f"HTTP {status}: {r.text[:200]}"
        
        record_result(path, method, status, payload, resp_body, success, error_msg)
        return success, resp_body
    except Exception as e:
        record_result(path, method, "ERROR", payload, None, False, str(e))
        return False, None

def run_tests():
    print("=== STARTING COMPREHENSIVE API INTEGRATION TESTS ===")

    # ----------------------------------------------------
    # 1. Master Data Controller
    # ----------------------------------------------------
    print("\n1. Testing Master Data...")
    test_endpoint("GET", "/api/v1/master-data/projects", params={"code": "7122155"})

    # ----------------------------------------------------
    # 2. Category Group Controller
    # ----------------------------------------------------
    print("\n2. Testing Category Groups...")
    group_code = f"GRP_{uuid.uuid4().hex[:8].upper()}"
    group_payload = {
        "groupCode": group_code,
        "groupName": f"Category Group {group_code}",
        "extAttributes": '{"type":"test"}',
        "active": True,
        "system": False,
        "deleted": False
    }
    
    # POST /api/category-groups (Create)
    success, group = test_endpoint("POST", "/api/v1/category-groups", payload=group_payload)
    
    # GET /api/category-groups (Find all)
    test_endpoint("GET", "/api/v1/category-groups")
    
    # GET /api/category-groups/{code} (Get detail)
    test_endpoint("GET", f"/api/v1/category-groups/{group_code}")
    
    # POST /api/v1/category-groups/search (Search)
    search_group_payload = {
        "groupCode": group_code,
        "page": 0,
        "size": 10
    }
    test_endpoint("POST", "/api/v1/category-groups/search", payload=search_group_payload)
    
    # PUT /api/category-groups/{code} (Update)
    if success:
        update_group_payload = group_payload.copy()
        update_group_payload["groupName"] = f"Category Group {group_code} UPDATED"
        test_endpoint("PUT", f"/api/v1/category-groups/{group_code}", payload=update_group_payload)

    # ----------------------------------------------------
    # 3. Category Controller
    # ----------------------------------------------------
    print("\n3. Testing Categories (Items)...")
    
    # POST /api/categories (Create Parent Item)
    parent_item_code = "ITEM_P_001"
    parent_cat_payload = {
        "groupCode": group_code,
        "itemCode": parent_item_code,
        "itemName": "Parent Category Item",
        "orderIndex": 1
    }
    p_success, parent_cat = test_endpoint("POST", "/api/v1/categories", payload=parent_cat_payload)
    parent_id = parent_cat.get("id") if p_success and isinstance(parent_cat, dict) else None

    # POST /api/categories (Create Child Item)
    child_id = None
    if parent_id:
        child_item_code = "ITEM_C_001"
        child_cat_payload = {
            "groupCode": group_code,
            "itemCode": child_item_code,
            "itemName": "Child Category Item",
            "parentId": parent_id,
            "orderIndex": 1
        }
        c_success, child_cat = test_endpoint("POST", "/api/v1/categories", payload=child_cat_payload)
        child_id = child_cat.get("id") if c_success and isinstance(child_cat, dict) else None

    if parent_id:
        # GET /api/categories/{id}
        test_endpoint("GET", f"/api/v1/categories/{parent_id}")
        
        # GET /api/categories/group/{groupCode}
        test_endpoint("GET", f"/api/v1/categories/group/{group_code}")
        
        # GET /api/categories/group/{groupCode}/tree
        test_endpoint("GET", f"/api/v1/categories/group/{group_code}/tree")
        
        # POST /api/v1/categories/search
        search_cat_payload = {
            "groupCode": group_code,
            "page": 0,
            "size": 10
        }
        test_endpoint("POST", "/api/v1/categories/search", payload=search_cat_payload)
        
        # PUT /api/v1/categories/{id}
        update_cat_payload = parent_cat_payload.copy()
        update_cat_payload["itemName"] = "Parent Category Item UPDATED"
        test_endpoint("PUT", f"/api/v1/categories/{parent_id}", payload=update_cat_payload)

    # ----------------------------------------------------
    # 4. Capex Dossier Controller
    # ----------------------------------------------------
    print("\n4. Testing Capex Dossiers...")
    dossier_payload = {
        "sendDate": str(date.today()),
        "projectCode": "7122155",
        "projectName": "Dự án nâng cấp bệnh viện Bạch Mai",
        "projectManagementCode": "3029123",
        "projectManagementName": "BQLDA bệnh viện Bạch Mai",
        "dataSourceCode": "MANUAL",
        "treasuryCode": "0012",
        "workflowId": 1
    }


    # POST /api/v1/capex-dossier (Create Dossier 1)
    d1_success, dossier1 = test_endpoint("POST", "/api/v1/capex-dossier", payload=dossier_payload)
    dossier1_id = dossier1.get("dossierId") if d1_success and isinstance(dossier1, dict) else None

    # POST /api/v1/capex-dossier (Create Dossier 2)
    d2_success, dossier2 = test_endpoint("POST", "/api/v1/capex-dossier", payload=dossier_payload)
    dossier2_id = dossier2.get("dossierId") if d2_success and isinstance(dossier2, dict) else None

    if dossier1_id:
        # GET /api/v1/capex-dossier/{id} (Get Dossier 1)
        test_endpoint("GET", f"/api/v1/capex-dossier/{dossier1_id}")
        
        # GET /api/v1/capex-dossier/{id}/documents (Get Documents)
        test_endpoint("GET", f"/api/v1/capex-dossier/{dossier1_id}/documents")
        
        # PUT /api/v1/capex-dossier/{id} (Update Dossier 1)
        update_dossier_payload = dossier_payload.copy()
        update_dossier_payload["projectName"] = "Dự án nâng cấp bệnh viện Bạch Mai - UPDATED"
        update_dossier_payload["version"] = dossier1.get("version", 0)
        test_endpoint("PUT", f"/api/v1/capex-dossier/{dossier1_id}", payload=update_dossier_payload)
        
        # POST /api/v1/capex-dossier/{id}/submit (Submit Dossier 1)
        test_endpoint("POST", f"/api/v1/capex-dossier/{dossier1_id}/submit")
        
        # POST /api/v1/capex-dossier/{id}/workflow (Workflow CHECK Dossier 1)
        check_wf = {"action": "CHECK", "reason": "Dossier verification"}
        test_endpoint("POST", f"/api/v1/capex-dossier/{dossier1_id}/workflow", payload=check_wf)
        
        # POST /api/v1/capex-dossier/{id}/workflow (Workflow APPROVE Dossier 1)
        approve_wf = {"action": "APPROVE", "reason": "Dossier approved"}
        test_endpoint("POST", f"/api/v1/capex-dossier/{dossier1_id}/workflow", payload=approve_wf)

    if dossier2_id:
        # DELETE /api/v1/capex-dossier/{id} (Soft Delete Dossier 2)
        delete_payload = {
            "deleteReason": "Incorrect data entered by operator",
            "confirmReviewed": True
        }
        test_endpoint("DELETE", f"/api/v1/capex-dossier/{dossier2_id}", payload=delete_payload)

    # GET /api/v1/capex-dossier (Search Dossiers)
    test_endpoint("GET", "/api/v1/capex-dossier", params={"projectCode": "7122155"})

    # ----------------------------------------------------
    # 5. Cleanup Categories & Groups
    # ----------------------------------------------------
    print("\n5. Cleaning up Category test data...")
    if child_id:
        test_endpoint("DELETE", f"/api/v1/categories/{child_id}")
    if parent_id:
        test_endpoint("DELETE", f"/api/v1/categories/{parent_id}")
    test_endpoint("DELETE", f"/api/v1/category-groups/{group_code}")

    print("\n=== COMPLETED TESTS, GENERATING REPORT ===")
    generate_markdown_report()

def generate_markdown_report():
    report_file = "API_TEST_RESULT.md"
    
    md_content = """# API Test Report - vdbas_exp_be
    
Database: **Oracle 23c (Real DB)**  
Host: `172.16.5.20`  
Service Port: `8081`  
Run Date: %s

## Summary Table

| Method | Endpoint | Expected Status | Actual Status | Result | Details / Errors |
|--------|----------|-----------------|---------------|--------|------------------|
""" % str(date.today())

    passed_count = 0
    total_count = len(results)

    for r in results:
        expected = "2xx"
        status_str = str(r["status"])
        
        # Work out visual status
        if r["success"]:
            passed_count += 1
            result_label = "✅ PASSED"
        else:
            result_label = "❌ FAILED"
        
        # Format response preview
        resp_preview = ""
        if not r["success"] and r["error"]:
            resp_preview = r["error"]
        elif r["response"]:
            resp_str = json.dumps(r["response"], ensure_ascii=False)
            if len(resp_str) > 100:
                resp_preview = resp_str[:97] + "..."
            else:
                resp_preview = resp_str
        
        md_content += f"| {r['method']} | `{r['endpoint']}` | {expected} | {status_str} | {result_label} | {resp_preview} |\n"

    md_content += f"\n\n**Total Tests:** {total_count} | **Passed:** {passed_count} | **Failed:** {total_count - passed_count}\n"
    
    # Save the file
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(md_content)
        
    print(f"Report written to {report_file}")

if __name__ == "__main__":
    run_tests()
