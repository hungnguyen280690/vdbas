import requests
import uuid
import json
import os
from datetime import date

PORT = os.environ.get("SERVER_PORT", "8081")
BASE_URL = f"http://localhost:{PORT}/api/v1"
HEADERS = {
    "X-User-Id": "system_admin",
    "Content-Type": "application/json"
}

def test_capex_dossier_flow():
    print("--- Testing Capex Dossier Flow ---")
    
    # 1. Create a new dossier
    create_payload = {
        "sendDate": str(date.today()),
        "projectCode": "7122155",
        "projectName": "Dự án nâng cấp bệnh viện Bạch Mai",
        "projectManagementCode": "3029123",
        "projectManagementName": "BQLDA bệnh viện Bạch Mai",
        "dataSourceCode": "MANUAL",
        "treasuryCode": "0012"
    }
    
    print(f"1. Creating dossier: {create_payload}")
    response = requests.post(f"{BASE_URL}/capex-dossier", json=create_payload, headers=HEADERS)
    if response.status_code != 201:
        print(f"FAILED to create dossier: {response.status_code} - {response.text}")
        return
    
    dossier = response.json()
    dossier_id = dossier['dossierId']
    print(f"SUCCESS: Created dossier with ID {dossier_id}, Code: {dossier['dossierCode']}")

    # 2. Get dossier detail
    print(f"2. Getting detail for dossier {dossier_id}")
    response = requests.get(f"{BASE_URL}/capex-dossier/{dossier_id}", headers=HEADERS)
    if response.status_code == 200:
        print("SUCCESS: Retrieved dossier detail")
    else:
        print(f"FAILED to get detail: {response.status_code}")

    # 3. Update dossier
    update_payload = create_payload.copy()
    update_payload["projectName"] = "Dự án nâng cấp bệnh viện Bạch Mai - UPDATED"
    update_payload["version"] = dossier.get('version', 0)
    
    print(f"3. Updating dossier {dossier_id}")
    response = requests.put(f"{BASE_URL}/capex-dossier/{dossier_id}", json=update_payload, headers=HEADERS)
    if response.status_code == 200:
        print("SUCCESS: Updated dossier")
    else:
        print(f"FAILED to update: {response.status_code} - {response.text}")

    # 4. Submit dossier
    print(f"4. Submitting dossier {dossier_id}")
    response = requests.post(f"{BASE_URL}/capex-dossier/{dossier_id}/submit", headers=HEADERS)
    if response.status_code == 200:
        print("SUCCESS: Submitted dossier")
    else:
        print(f"FAILED to submit: {response.status_code} - {response.text}")

    # 5. Workflow: CHECK
    workflow_payload = {
        "action": "CHECK",
        "reason": "Checking dossier for approval"
    }
    print(f"5. Checking dossier {dossier_id}")
    response = requests.post(f"{BASE_URL}/capex-dossier/{dossier_id}/workflow", json=workflow_payload, headers=HEADERS)
    if response.status_code == 200:
        print("SUCCESS: Checked dossier")
    else:
        print(f"FAILED to check: {response.status_code} - {response.text}")

    # 6. Workflow: APPROVE
    workflow_payload = {
        "action": "APPROVE",
        "reason": "Dossier looks good, approving"
    }
    print(f"6. Approving dossier {dossier_id}")
    response = requests.post(f"{BASE_URL}/capex-dossier/{dossier_id}/workflow", json=workflow_payload, headers=HEADERS)
    if response.status_code == 200:
        print("SUCCESS: Approved dossier")
    else:
        print(f"FAILED to approve: {response.status_code} - {response.text}")

    # 7. Search dossiers
    print("7. Searching dossiers")
    response = requests.get(f"{BASE_URL}/capex-dossier", params={"projectCode": "7122155"}, headers=HEADERS)
    if response.status_code == 200:
        search_results = response.json()
        print(f"SUCCESS: Found {search_results.get('totalElements', 0)} dossiers")
    else:
        print(f"FAILED to search: {response.status_code}")

if __name__ == "__main__":
    test_capex_dossier_flow()
