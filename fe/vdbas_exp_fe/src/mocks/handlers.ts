import { http, HttpResponse } from 'msw'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/api/v1'
const ACL_API_BASE_URL = import.meta.env.VITE_ACL_API_BASE_URL || 'http://localhost:8082/api'

// ── Mock dataset ─────────────────────────────────────────────────────────────
export const MOCK_DOSSIERS: any[] = [
  {
    dossierId: '550e8400-e29b-41d4-a716-446655440001',
    dossierCode: 'EXP/CAPEX/2026/00001',
    sendDate: '2026-05-15',
    stateCode: 'DRAFT',
    projectCode: '7122155',
    projectName: 'Dự án nâng cấp bệnh viện Bạch Mai',
    projectType: 'Citizen',
    projectManagementCode: '3029123',
    projectManagementName: 'BQLDA bệnh viện Bạch Mai',
    dataSourceCode: 'MANUAL',
    createdBy: 'nguyen.van.a',
    createdDate: '2026-05-15T09:12:00Z',
    updatedBy: 'nguyen.van.a',
    updatedDate: '2026-05-15T09:12:00Z',
    version: 1,
    totalAmountVnd: 1500000000,
    documentCount: 2,
    checkedBy: null, checkedDate: null, checkRejectionReason: null,
    approvedBy: null, approvedDate: null, approvalRejectionReason: null,
    returningReason: null,
    documents: [
      {
        documentId: 'ddoc-0001-0001',
        documentNumber: 'CT-2026-001',
        documentDate: '2026-05-10',
        accountingDate: '2026-05-15',
        paymentRequestAmount: null,
        paymentRequestAmountVnd: 800000000,
        currencyCode: 'VND',
        lines: [],
      },
      {
        documentId: 'ddoc-0001-0002',
        documentNumber: 'CT-2026-002',
        documentDate: '2026-05-12',
        accountingDate: '2026-05-15',
        paymentRequestAmount: null,
        paymentRequestAmountVnd: 700000000,
        currencyCode: 'VND',
        lines: [],
      },
    ],
    attachments: [],
    approvalHistory: [],
  },
  {
    dossierId: '550e8400-e29b-41d4-a716-446655440002',
    dossierCode: 'EXP/CAPEX/2026/00002',
    sendDate: '2026-05-10',
    stateCode: 'PENDING_CHECK',
    projectCode: '7004686',
    projectName: 'Các dự án thuộc dự án bộ quốc phòng',
    projectType: 'Military',
    projectSpecificCode: '001200037',
    projectSpecificName: 'Dự án TM02',
    projectManagementCode: '1059227',
    projectManagementName: 'BQL Cục thông tin BQP',
    dataSourceCode: 'MANUAL',
    createdBy: 'tran.thi.b',
    createdDate: '2026-05-08T14:30:00Z',
    updatedBy: 'tran.thi.b',
    updatedDate: '2026-05-10T11:00:00Z',
    version: 2,
    totalAmountVnd: 3200000000,
    documentCount: 1,
    checkedBy: null, checkedDate: null, checkRejectionReason: null,
    approvedBy: null, approvedDate: null, approvalRejectionReason: null,
    returningReason: null,
    documents: [
      {
        documentId: 'ddoc-0002-0001',
        documentNumber: 'CT-2026-003',
        documentDate: '2026-05-08',
        accountingDate: '2026-05-10',
        paymentRequestAmount: null,
        paymentRequestAmountVnd: 3200000000,
        currencyCode: 'VND',
        lines: [],
      },
    ],
    attachments: [
      {
        archiveId: 'arch-0002-0001',
        fileName: 'hop-dong-tm02.pdf',
        docType: 'HOP_DONG',
        note: 'Hợp đồng giai đoạn 1',
        fileSize: 204800,
        uploadedBy: 'tran.thi.b',
        uploadedDate: '2026-05-08T15:00:00Z',
      },
    ],
    approvalHistory: [
      {
        logId: 'log-0002-0001',
        actionUser: 'tran.thi.b',
        actionDate: '2026-05-10T11:00:00Z',
        actionRole: 'MAKER',
        stateCode: 'PENDING_CHECK',
        reason: null,
      },
    ],
  },
  {
    dossierId: '550e8400-e29b-41d4-a716-446655440003',
    dossierCode: 'EXP/CAPEX/2026/00003',
    sendDate: '2026-05-05',
    stateCode: 'PENDING_APPROVE',
    projectCode: '7122155',
    projectName: 'Dự án nâng cấp bệnh viện Bạch Mai',
    projectType: 'Citizen',
    projectManagementCode: '3029123',
    projectManagementName: 'BQLDA bệnh viện Bạch Mai',
    dataSourceCode: 'MANUAL',
    createdBy: 'le.van.c',
    createdDate: '2026-05-03T10:00:00Z',
    updatedBy: 'nguyen.checker',
    updatedDate: '2026-05-05T16:00:00Z',
    version: 3,
    totalAmountVnd: 950000000,
    documentCount: 1,
    checkedBy: 'nguyen.checker',
    checkedDate: '2026-05-05T16:00:00Z',
    checkRejectionReason: null,
    approvedBy: null, approvedDate: null, approvalRejectionReason: null,
    returningReason: null,
    documents: [
      {
        documentId: 'ddoc-0003-0001',
        documentNumber: 'CT-2026-004',
        documentDate: '2026-05-01',
        accountingDate: '2026-05-03',
        paymentRequestAmountVnd: 950000000,
        currencyCode: 'VND',
        lines: [],
      },
    ],
    attachments: [],
    approvalHistory: [
      {
        logId: 'log-0003-0001',
        actionUser: 'le.van.c',
        actionDate: '2026-05-04T08:00:00Z',
        actionRole: 'MAKER',
        stateCode: 'PENDING_CHECK',
        reason: null,
      },
      {
        logId: 'log-0003-0002',
        actionUser: 'nguyen.checker',
        actionDate: '2026-05-05T16:00:00Z',
        actionRole: 'CHECKER',
        stateCode: 'PENDING_APPROVE',
        reason: null,
      },
    ],
  },
  {
    dossierId: '550e8400-e29b-41d4-a716-446655440004',
    dossierCode: 'EXP/CAPEX/2026/00004',
    sendDate: '2026-04-28',
    stateCode: 'APPROVED',
    projectCode: '7004686',
    projectName: 'Các dự án thuộc dự án bộ quốc phòng',
    projectType: 'Military',
    projectSpecificCode: '001200038',
    projectSpecificName: 'Dự án TM03',
    projectManagementCode: '1059227',
    projectManagementName: 'BQL Cục thông tin BQP',
    dataSourceCode: 'MANUAL',
    createdBy: 'pham.thi.d',
    createdDate: '2026-04-25T08:00:00Z',
    updatedBy: 'tran.approver',
    updatedDate: '2026-04-28T14:30:00Z',
    version: 4,
    totalAmountVnd: 5600000000,
    documentCount: 3,
    checkedBy: 'nguyen.checker',
    checkedDate: '2026-04-27T09:00:00Z',
    checkRejectionReason: null,
    approvedBy: 'tran.approver',
    approvedDate: '2026-04-28T14:30:00Z',
    approvalRejectionReason: null,
    returningReason: null,
    documents: [
      {
        documentId: 'ddoc-0004-0001',
        documentNumber: 'CT-2026-005',
        documentDate: '2026-04-20',
        accountingDate: '2026-04-25',
        paymentRequestAmountVnd: 2000000000,
        currencyCode: 'VND',
        lines: [],
      },
      {
        documentId: 'ddoc-0004-0002',
        documentNumber: 'CT-2026-006',
        documentDate: '2026-04-22',
        accountingDate: '2026-04-25',
        paymentRequestAmountVnd: 2000000000,
        currencyCode: 'VND',
        lines: [],
      },
      {
        documentId: 'ddoc-0004-0003',
        documentNumber: 'CT-2026-007',
        documentDate: '2026-04-24',
        accountingDate: '2026-04-25',
        paymentRequestAmountVnd: 1600000000,
        currencyCode: 'VND',
        lines: [],
      },
    ],
    attachments: [
      {
        archiveId: 'arch-0004-0001',
        fileName: 'quyet-dinh-phe-duyet.pdf',
        docType: 'QUYET_DINH',
        note: 'Quyết định phê duyệt dự án',
        fileSize: 1024000,
        uploadedBy: 'pham.thi.d',
        uploadedDate: '2026-04-25T09:00:00Z',
      },
    ],
    approvalHistory: [
      {
        logId: 'log-0004-0001',
        actionUser: 'pham.thi.d',
        actionDate: '2026-04-26T08:00:00Z',
        actionRole: 'MAKER',
        stateCode: 'PENDING_CHECK',
        reason: null,
      },
      {
        logId: 'log-0004-0002',
        actionUser: 'nguyen.checker',
        actionDate: '2026-04-27T09:00:00Z',
        actionRole: 'CHECKER',
        stateCode: 'PENDING_APPROVE',
        reason: null,
      },
      {
        logId: 'log-0004-0003',
        actionUser: 'tran.approver',
        actionDate: '2026-04-28T14:30:00Z',
        actionRole: 'APPROVER',
        stateCode: 'APPROVED',
        reason: null,
      },
    ],
  },
  {
    dossierId: '550e8400-e29b-41d4-a716-446655440005',
    dossierCode: 'EXP/CAPEX/2026/00005',
    sendDate: '2026-04-20',
    stateCode: 'CHECK_REJECTED',
    projectCode: '7122155',
    projectName: 'Dự án nâng cấp bệnh viện Bạch Mai',
    projectType: 'Citizen',
    projectManagementCode: '3029123',
    projectManagementName: 'BQLDA bệnh viện Bạch Mai',
    dataSourceCode: 'MANUAL',
    createdBy: 'hoang.van.e',
    createdDate: '2026-04-18T11:00:00Z',
    updatedBy: 'nguyen.checker',
    updatedDate: '2026-04-20T15:30:00Z',
    version: 2,
    totalAmountVnd: 420000000,
    documentCount: 1,
    checkedBy: 'nguyen.checker',
    checkedDate: '2026-04-20T15:30:00Z',
    checkRejectionReason: 'Chứng từ chưa đủ hạng mục theo hợp đồng',
    approvedBy: null, approvedDate: null, approvalRejectionReason: null,
    returningReason: null,
    documents: [
      {
        documentId: 'ddoc-0005-0001',
        documentNumber: 'CT-2026-008',
        documentDate: '2026-04-15',
        accountingDate: '2026-04-18',
        paymentRequestAmountVnd: 420000000,
        currencyCode: 'VND',
        lines: [],
      },
    ],
    attachments: [],
    approvalHistory: [
      {
        logId: 'log-0005-0001',
        actionUser: 'hoang.van.e',
        actionDate: '2026-04-19T08:00:00Z',
        actionRole: 'MAKER',
        stateCode: 'PENDING_CHECK',
        reason: null,
      },
      {
        logId: 'log-0005-0002',
        actionUser: 'nguyen.checker',
        actionDate: '2026-04-20T15:30:00Z',
        actionRole: 'CHECKER',
        stateCode: 'CHECK_REJECTED',
        reason: 'Chứng từ chưa đủ hạng mục theo hợp đồng',
      },
    ],
  },
  {
    dossierId: '550e8400-e29b-41d4-a716-446655440006',
    dossierCode: 'EXP/CAPEX/2026/00006',
    sendDate: '2026-04-15',
    stateCode: 'APPROVE_REJECTED',
    projectCode: '7004686',
    projectName: 'Các dự án thuộc dự án bộ quốc phòng',
    projectType: 'Military',
    projectManagementCode: '1059227',
    projectManagementName: 'BQL Cục thông tin BQP',
    dataSourceCode: 'DVC',
    createdBy: 'vu.thi.f',
    createdDate: '2026-04-10T09:30:00Z',
    updatedBy: 'tran.approver',
    updatedDate: '2026-04-15T16:00:00Z',
    version: 3,
    totalAmountVnd: 8900000000,
    documentCount: 2,
    checkedBy: 'nguyen.checker',
    checkedDate: '2026-04-13T10:00:00Z',
    checkRejectionReason: null,
    approvedBy: 'tran.approver',
    approvedDate: '2026-04-15T16:00:00Z',
    approvalRejectionReason: 'Vượt hạn mức phân bổ ngân sách quý 2/2026',
    returningReason: null,
    documents: [
      {
        documentId: 'ddoc-0006-0001',
        documentNumber: 'CT-2026-009',
        documentDate: '2026-04-05',
        accountingDate: '2026-04-10',
        paymentRequestAmountVnd: 4500000000,
        currencyCode: 'VND',
        lines: [],
      },
      {
        documentId: 'ddoc-0006-0002',
        documentNumber: 'CT-2026-010',
        documentDate: '2026-04-07',
        accountingDate: '2026-04-10',
        paymentRequestAmountVnd: 4400000000,
        currencyCode: 'VND',
        lines: [],
      },
    ],
    attachments: [
      {
        archiveId: 'arch-0006-0001',
        fileName: 'bao-cao-tai-chinh.pdf',
        docType: 'BAO_CAO',
        note: 'Báo cáo quý 1',
        fileSize: 512000,
        uploadedBy: 'vu.thi.f',
        uploadedDate: '2026-04-10T10:00:00Z',
      },
    ],
    approvalHistory: [
      {
        logId: 'log-0006-0001',
        actionUser: 'vu.thi.f',
        actionDate: '2026-04-12T08:00:00Z',
        actionRole: 'MAKER',
        stateCode: 'PENDING_CHECK',
        reason: null,
      },
      {
        logId: 'log-0006-0002',
        actionUser: 'nguyen.checker',
        actionDate: '2026-04-13T10:00:00Z',
        actionRole: 'CHECKER',
        stateCode: 'PENDING_APPROVE',
        reason: null,
      },
      {
        logId: 'log-0006-0003',
        actionUser: 'tran.approver',
        actionDate: '2026-04-15T16:00:00Z',
        actionRole: 'APPROVER',
        stateCode: 'APPROVE_REJECTED',
        reason: 'Vượt hạn mức phân bổ ngân sách quý 2/2026',
      },
    ],
  },
  {
    dossierId: '550e8400-e29b-41d4-a716-446655440007',
    dossierCode: 'EXP/CAPEX/2026/00007',
    sendDate: '2026-05-28',
    stateCode: 'DRAFT',
    projectCode: '7122155',
    projectName: 'Dự án nâng cấp bệnh viện Bạch Mai',
    projectType: 'Citizen',
    projectManagementCode: '3029123',
    projectManagementName: 'BQLDA bệnh viện Bạch Mai',
    dataSourceCode: 'MANUAL',
    createdBy: 'nguyen.van.a',
    createdDate: '2026-05-28T08:00:00Z',
    updatedBy: 'nguyen.van.a',
    updatedDate: '2026-05-28T08:00:00Z',
    version: 1,
    totalAmountVnd: 0,
    documentCount: 0,
    checkedBy: null, checkedDate: null, checkRejectionReason: null,
    approvedBy: null, approvedDate: null, approvalRejectionReason: null,
    returningReason: null,
    documents: [],
    attachments: [],
    approvalHistory: [],
  },
]

const MOCK_PROJECTS = [
  {
    projectCode: '7004686',
    projectName: 'Các dự án thuộc dự án bộ quốc phòng',
    projectType: 'Military',
    projectManagementCode: '1059227',
    projectManagementName: 'BQL Cục thông tin BQP',
  },
  {
    projectCode: '7122155',
    projectName: 'Dự án nâng cấp bệnh viện Bạch Mai',
    projectType: 'Citizen',
    projectManagementCode: '3029123',
    projectManagementName: 'BQLDA bệnh viện Bạch Mai',
  },
]

const WORKFLOW_STATE_MAP: Record<string, string> = {
  CHECK:   'PENDING_APPROVE',
  APPROVE: 'APPROVED',
  REJECT:  'CHECK_REJECTED',
  RETURN:  'DRAFT',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, Accept-Language',
}

const jsonResponse = (data: any, init?: any) => {
  try {
    return HttpResponse.json(data, {
      ...init,
      headers: {
        ...corsHeaders,
        ...init?.headers,
      },
    })
  } catch (err) {
    console.error('[MSW] Failed to create JSON response:', err)
    return new HttpResponse(JSON.stringify({ message: 'Internal Mock Error', error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

// ── Mock ACL Data ────────────────────────────────────────────────────────────
export const MOCK_MENUS = [
  { code: 'HOME',          name: 'Trang chủ',            path: '/',               icon: 'HomeOutlined',     children: [] },
  { code: 'CAT_GROUP',     name: 'Nhóm danh mục',        path: '/category-groups', icon: 'AppstoreOutlined', children: [] },
  { code: 'CAPEX_DOSSIER', name: 'Hồ sơ Chi đầu tư',    path: '/capex-dossiers',  icon: 'FileOutlined',     children: [] },
]

export const MOCK_APIS = [
  { path: '/api/v1/capex-dossier',          method: 'GET' },
  { path: '/api/v1/capex-dossier',          method: 'POST' },
  { path: '/api/v1/capex-dossier/{id}',     method: 'PUT' },
  { path: '/api/v1/capex-dossier/{id}',     method: 'DELETE' },
  { path: '/api/v1/capex-dossier/{id}/submit',   method: 'POST' },
  { path: '/api/v1/capex-dossier/{id}/workflow', method: 'POST' },
]

export const handlers = [
  // ── OPTIONS Preflight ─────────────────────────────────────────────────────
  http.options('*', () => {
    return new HttpResponse(null, {
      status: 204,
      headers: corsHeaders,
    })
  }),

  // ── ACL ───────────────────────────────────────────────────────────────────
  http.get(`${ACL_API_BASE_URL}/me/menus`, () => {
    console.log('[MSW] GET /me/menus')
    return jsonResponse(MOCK_MENUS)
  }),

  http.get(`${ACL_API_BASE_URL}/me/apis`, () => {
    console.log('[MSW] GET /me/apis')
    return jsonResponse(MOCK_APIS)
  }),

  // ── Dossier: List / Search ────────────────────────────────────────────────
  http.get(`${API_BASE_URL}/capex-dossier`, ({ request }) => {
    try {
      const url = new URL(request.url)
      console.log('[MSW] GET /capex-dossier', url.search)
      
      const stateCode = url.searchParams.get('stateCode')
      const keyword   = url.searchParams.get('keyword')
      const page      = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10) || 0)
      const size      = Math.max(1, parseInt(url.searchParams.get('size') || '20', 10) || 20)

      let results = [...MOCK_DOSSIERS]
      if (stateCode) {
        results = results.filter((d) => d.stateCode === stateCode)
      }
      if (keyword) {
        const kw = keyword.toLowerCase()
        results = results.filter((d) =>
          (d.dossierCode && d.dossierCode.toLowerCase().includes(kw)) || 
          (d.createdBy && d.createdBy.toLowerCase().includes(kw)) ||
          (d.projectName && d.projectName.toLowerCase().includes(kw)),
        )
      }

      const totalElements = results.length
      const totalPages    = Math.ceil(totalElements / size)
      const content       = results.slice(page * size, (page + 1) * size)

      return jsonResponse({
        content,
        totalElements,
        totalPages,
        size,
        number: page,
      })
    } catch (error) {
      console.error('[MSW] Error in GET /capex-dossier:', error)
      return jsonResponse({ message: 'Internal Server Error', error: String(error) }, { status: 500 })
    }
  }),

  // ── Dossier: Get Detail ───────────────────────────────────────────────────
  http.get(`${API_BASE_URL}/capex-dossier/:id`, ({ params }) => {
    try {
      console.log('[MSW] GET /capex-dossier/:id', params.id)
      const found = MOCK_DOSSIERS.find((d) => d.dossierId === params.id)
      if (!found) {
        return jsonResponse(
          { errorCode: 'MSG-ERR-NOT-FOUND', message: 'Không tìm thấy hồ sơ' },
          { status: 404 },
        )
      }
      return jsonResponse(found)
    } catch (error) {
      console.error('[MSW] Error in GET /capex-dossier/:id:', error)
      return jsonResponse({ message: 'Internal Server Error', error: String(error) }, { status: 500 })
    }
  }),

  // ── Dossier: Create ───────────────────────────────────────────────────────
  http.post(`${API_BASE_URL}/capex-dossier`, async ({ request }) => {
    try {
      console.log('[MSW] POST /capex-dossier')
      const body = await request.json() as any
      const seq  = String(MOCK_DOSSIERS.length + 1).padStart(5, '0')
      const newDossier = {
        dossierId:              typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `mock-uuid-${Date.now()}`,
        dossierCode:            `EXP/CAPEX/2026/${seq}`,
        sendDate:               body.sendDate ?? new Date().toISOString().slice(0, 10),
        stateCode:              'DRAFT',
        projectCode:            body.projectCode ?? '',
        projectName:            body.projectName ?? '',
        projectType:            body.projectType ?? 'Citizen',
        projectSpecificCode:    body.projectSpecificCode ?? null,
        projectSpecificName:    body.projectSpecificName ?? null,
        projectManagementCode:  body.projectManagementCode ?? '',
        projectManagementName:  body.projectManagementName ?? '',
        dataSourceCode:         body.dataSourceCode ?? 'MANUAL',
        createdBy:              'current.user',
        createdDate:            new Date().toISOString(),
        updatedBy:              'current.user',
        updatedDate:            new Date().toISOString(),
        version:                1,
        totalAmountVnd:         0,
        documentCount:          0,
        checkedBy: null, checkedDate: null, checkRejectionReason: null,
        approvedBy: null, approvedDate: null, approvalRejectionReason: null,
        returningReason: null,
        documents: [],
        attachments: [],
        approvalHistory: [],
      }
      MOCK_DOSSIERS.push(newDossier)
      return jsonResponse(newDossier, { status: 201 })
    } catch (error) {
      console.error('[MSW] Error in POST /capex-dossier:', error)
      return jsonResponse({ message: 'Internal Server Error', error: String(error) }, { status: 500 })
    }
  }),

  // ── Dossier: Update ───────────────────────────────────────────────────────
  http.put(`${API_BASE_URL}/capex-dossier/:id`, async ({ params, request }) => {
    try {
      console.log('[MSW] PUT /capex-dossier/:id', params.id)
      const idx = MOCK_DOSSIERS.findIndex((d) => d.dossierId === params.id)
      if (idx === -1) {
        return jsonResponse(
          { errorCode: 'MSG-ERR-NOT-FOUND', message: 'Không tìm thấy hồ sơ' },
          { status: 404 },
        )
      }
      const body = await request.json() as any
      MOCK_DOSSIERS[idx] = {
        ...MOCK_DOSSIERS[idx],
        ...body,
        version:     (MOCK_DOSSIERS[idx].version || 0) + 1,
        updatedBy:   'current.user',
        updatedDate: new Date().toISOString(),
      }
      return jsonResponse(MOCK_DOSSIERS[idx])
    } catch (error) {
      console.error('[MSW] Error in PUT /capex-dossier/:id:', error)
      return jsonResponse({ message: 'Internal Server Error', error: String(error) }, { status: 500 })
    }
  }),

  // ── Dossier: Delete ───────────────────────────────────────────────────────
  http.delete(`${API_BASE_URL}/capex-dossier/:id`, async ({ params, request }) => {
    try {
      console.log('[MSW] DELETE /capex-dossier/:id', params.id)
      const body = await request.json() as any
      if (!body?.deleteReason || body.deleteReason.trim().length < 10) {
        return jsonResponse(
          {
            errorCode: 'MSG-ERR-REQUIRED',
            message:   'Lý do xoá phải có ít nhất 10 ký tự',
            errors:    [{ field: 'deleteReason', message: 'Tối thiểu 10 ký tự' }],
          },
          { status: 400 },
        )
      }
      const idx = MOCK_DOSSIERS.findIndex((d) => d.dossierId === params.id)
      if (idx === -1) {
        return jsonResponse(
          { errorCode: 'MSG-ERR-NOT-FOUND', message: 'Không tìm thấy hồ sơ' },
          { status: 404 },
        )
      }
      MOCK_DOSSIERS.splice(idx, 1)
      return new HttpResponse(null, { status: 204, headers: corsHeaders })
    } catch (error) {
      console.error('[MSW] Error in DELETE /capex-dossier/:id:', error)
      return jsonResponse({ message: 'Internal Server Error', error: String(error) }, { status: 500 })
    }
  }),

  // ── Dossier: Submit ───────────────────────────────────────────────────────
  http.post(`${API_BASE_URL}/capex-dossier/:id/submit`, ({ params }) => {
    try {
      console.log('[MSW] POST /capex-dossier/:id/submit', params.id)
      const idx = MOCK_DOSSIERS.findIndex((d) => d.dossierId === params.id)
      if (idx === -1) {
        return jsonResponse(
          { errorCode: 'MSG-ERR-NOT-FOUND', message: 'Không tìm thấy hồ sơ' },
          { status: 404 },
        )
      }
      MOCK_DOSSIERS[idx].stateCode = 'PENDING_CHECK'
      return jsonResponse({ stateCode: 'PENDING_CHECK' })
    } catch (error) {
      console.error('[MSW] Error in POST /capex-dossier/:id/submit:', error)
      return jsonResponse({ message: 'Internal Server Error', error: String(error) }, { status: 500 })
    }
  }),

  // ── Dossier: Workflow ─────────────────────────────────────────────────────
  http.post(`${API_BASE_URL}/capex-dossier/:id/workflow`, async ({ params, request }) => {
    try {
      console.log('[MSW] POST /capex-dossier/:id/workflow', params.id)
      const body     = await request.json() as any
      const newState = WORKFLOW_STATE_MAP[body?.action] ?? 'DRAFT'
      const idx      = MOCK_DOSSIERS.findIndex((d) => d.dossierId === params.id)
      if (idx === -1) {
        return jsonResponse(
          { errorCode: 'MSG-ERR-NOT-FOUND', message: 'Không tìm thấy hồ sơ' },
          { status: 404 },
        )
      }
      MOCK_DOSSIERS[idx].stateCode = newState
      return jsonResponse({ stateCode: newState })
    } catch (error) {
      console.error('[MSW] Error in POST /capex-dossier/:id/workflow:', error)
      return jsonResponse({ message: 'Internal Server Error', error: String(error) }, { status: 500 })
    }
  }),

  // ── Master Data: Projects ─────────────────────────────────────────────────
  http.get(`${API_BASE_URL}/master-data/projects`, ({ request }) => {
    try {
      console.log('[MSW] GET /master-data/projects')
      const url  = new URL(request.url)
      const code = url.searchParams.get('code')
      const name = url.searchParams.get('name')
      let results = [...MOCK_PROJECTS]
      if (code) results = results.filter((p) => p.projectCode.includes(code))
      if (name) results = results.filter((p) => p.projectName.toLowerCase().includes(name.toLowerCase()))
      return jsonResponse(results)
    } catch (error) {
      console.error('[MSW] Error in GET /master-data/projects:', error)
      return jsonResponse({ message: 'Internal Server Error', error: String(error) }, { status: 500 })
    }
  }),

  // ── Category Groups ───────────────────────────────────────────────────────
  http.post(`${API_BASE_URL}/category-groups/search`, () => {
    try {
      console.log('[MSW] POST /category-groups/search')
      return jsonResponse({
        content: [
          { id: 1, groupCode: 'CAT001', groupName: 'Mock Category Group 1', description: 'MSW mock', active: true, system: false, deleted: false },
          { id: 2, groupCode: 'CAT002', groupName: 'Mock Category Group 2', description: 'MSW mock', active: true, system: false, deleted: false },
        ],
        totalElements: 2,
        totalPages: 1,
        size: 10,
        number: 0,
      })
    } catch (error) {
      console.error('[MSW] Error in POST /category-groups/search:', error)
      return jsonResponse({ message: 'Internal Server Error', error: String(error) }, { status: 500 })
    }
  }),
]
