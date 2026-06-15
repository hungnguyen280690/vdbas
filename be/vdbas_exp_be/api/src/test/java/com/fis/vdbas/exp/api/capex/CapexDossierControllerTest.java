package com.fis.vdbas.exp.api.capex;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.exp.application.capex.dto.*;
import com.fis.vdbas.exp.application.capex.service.CapexDossierService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CapexDossierControllerTest {

    @Mock
    CapexDossierService service;

    @InjectMocks
    CapexDossierController controller;

    MockMvc mockMvc;
    ObjectMapper objectMapper;

    static final UUID DOSSIER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    private DossierHeaderDto sampleHeader() {
        DossierHeaderDto h = new DossierHeaderDto();
        h.setDossierId(DOSSIER_ID);
        h.setDossierCode("EXP/CAPEX/2026/00001");
        h.setStateCode("DRAFT");
        h.setDossierVersion(1);
        return h;
    }

    // ── GET /api/v1/capex-dossier ─────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/capex-dossier")
    class SearchDossiers {

        @Test
        @DisplayName("returns 200 with page response")
        void search_returns200() throws Exception {
            DossierSummaryDto summary = new DossierSummaryDto();
            summary.setDossierId(DOSSIER_ID);
            summary.setDossierCode("EXP/CAPEX/2026/00001");

            PageResponseDto<DossierSummaryDto> page = PageResponseDto.<DossierSummaryDto>builder()
                    .content(List.of(summary)).totalElements(1).totalPages(1).page(0).size(20).build();

            when(service.search(any())).thenReturn(page);

            mockMvc.perform(get("/api/v1/capex-dossier")
                            .param("page", "0").param("size", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.content[0].dossierCode").value("EXP/CAPEX/2026/00001"));
        }
    }

    // ── POST /api/v1/capex-dossier ────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/capex-dossier")
    class CreateDossier {

        @Test
        @DisplayName("returns 201 Created with header DTO")
        void create_returns201() throws Exception {
            DossierCreateRequestDto req = new DossierCreateRequestDto();
            req.setSendDate(LocalDate.of(2026, 6, 5));
            req.setProjectCode("7004686");
            req.setProjectManagementCode("1059227");
            req.setTreasuryCode("0600");

            when(service.create(any())).thenReturn(sampleHeader());

            mockMvc.perform(post("/api/v1/capex-dossier")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.dossierId").value(DOSSIER_ID.toString()))
                    .andExpect(jsonPath("$.stateCode").value("DRAFT"));
        }
    }

    // ── GET /api/v1/capex-dossier/{id} ───────────────────────────────────────

    @Nested
    @DisplayName("GET /api/v1/capex-dossier/{id}")
    class GetDetail {

        @Test
        @DisplayName("returns 200 with full detail DTO")
        void getDetail_returns200() throws Exception {
            DossierDetailDto detail = new DossierDetailDto();
            detail.setDossierId(DOSSIER_ID);
            detail.setStateCode("DRAFT");
            detail.setDocuments(List.of());
            detail.setAttachments(List.of());
            detail.setApprovalHistory(List.of());

            when(service.getDetailById(DOSSIER_ID)).thenReturn(detail);

            mockMvc.perform(get("/api/v1/capex-dossier/{id}", DOSSIER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.dossierId").value(DOSSIER_ID.toString()))
                    .andExpect(jsonPath("$.documents").isArray())
                    .andExpect(jsonPath("$.attachments").isArray())
                    .andExpect(jsonPath("$.approvalHistory").isArray());
        }
    }

    // ── PUT /api/v1/capex-dossier/{id} ───────────────────────────────────────

    @Nested
    @DisplayName("PUT /api/v1/capex-dossier/{id}")
    class UpdateDossier {

        @Test
        @DisplayName("returns 200 with updated header")
        void update_returns200() throws Exception {
            DossierUpdateRequestDto req = new DossierUpdateRequestDto();
            req.setTreasuryCode("0700");
            req.setVersion(1);

            DossierHeaderDto updated = sampleHeader();
            updated.setTreasuryCode("0700");
            updated.setDossierVersion(2);

            when(service.update(eq(DOSSIER_ID), any())).thenReturn(updated);

            mockMvc.perform(put("/api/v1/capex-dossier/{id}", DOSSIER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk());
        }
    }

    // ── DELETE /api/v1/capex-dossier/{id} ────────────────────────────────────

    @Nested
    @DisplayName("DELETE /api/v1/capex-dossier/{id}")
    class DeleteDossier {

        @Test
        @DisplayName("returns 204 No Content")
        void delete_returns204() throws Exception {
            DeleteRequestDto req = new DeleteRequestDto();
            req.setDeleteReason("Hồ sơ nhập sai thông tin dự án cần xóa lại");
            req.setConfirmReviewed(true);

            doNothing().when(service).delete(eq(DOSSIER_ID), any());

            mockMvc.perform(delete("/api/v1/capex-dossier/{id}", DOSSIER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isNoContent());
        }
    }

    // ── POST /api/v1/capex-dossier/{id}/submit ───────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/capex-dossier/{id}/submit")
    class SubmitDossier {

        @Test
        @DisplayName("returns 200 with updated state PENDING_CHECK")
        void submit_returns200() throws Exception {
            DossierHeaderDto submitted = sampleHeader();
            submitted.setStateCode("PENDING_CHECK");

            when(service.submit(DOSSIER_ID)).thenReturn(submitted);

            mockMvc.perform(post("/api/v1/capex-dossier/{id}/submit", DOSSIER_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stateCode").value("PENDING_CHECK"));
        }
    }

    // ── POST /api/v1/capex-dossier/{id}/workflow ─────────────────────────────

    @Nested
    @DisplayName("POST /api/v1/capex-dossier/{id}/workflow")
    class WorkflowAction {

        @Test
        @DisplayName("CHECK action returns 200 with PENDING_APPROVE state")
        void workflow_check_returns200() throws Exception {
            WorkflowActionRequestDto req = new WorkflowActionRequestDto();
            req.setAction("CHECK");

            DossierHeaderDto result = sampleHeader();
            result.setStateCode("PENDING_APPROVE");

            when(service.workflow(eq(DOSSIER_ID), any())).thenReturn(result);

            mockMvc.perform(post("/api/v1/capex-dossier/{id}/workflow", DOSSIER_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.stateCode").value("PENDING_APPROVE"));
        }
    }

    // ── GET /api/v1/capex-dossier/{id}/documents ─────────────────────────────

    @Test
    @DisplayName("GET /{id}/documents returns 200 with document list")
    void getDocuments_returns200() throws Exception {
        when(service.getDocuments(DOSSIER_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/capex-dossier/{id}/documents", DOSSIER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
