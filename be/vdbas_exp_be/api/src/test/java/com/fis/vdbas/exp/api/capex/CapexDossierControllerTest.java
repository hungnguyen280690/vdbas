package com.fis.vdbas.exp.api.capex;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.exp.application.capex.dto.CapexDossierDto;
import com.fis.vdbas.exp.application.capex.dto.DocumentDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DossierHeaderDto;
import com.fis.vdbas.exp.application.capex.dto.DossierSummaryDto;
import com.fis.vdbas.exp.application.capex.service.CapexDossierService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-layer test for {@link CapexDossierController}.
 *
 * <p>NOTE: Spring Boot 4.0 relocated {@code @WebMvcTest} into a dedicated
 * {@code spring-boot-webmvc-test} artifact not present in the offline Maven repository.
 * This test uses {@link MockMvcBuilders#standaloneSetup} with a Jackson converter
 * configured for {@code java.time} types, exercising the controller in isolation
 * with a Mockito-mocked service. Verifies URL mapping (/api/v1), response types, and
 * the /documents sub-resource.
 */
@ExtendWith(MockitoExtension.class)
class CapexDossierControllerTest {

    @Mock
    CapexDossierService service;

    @InjectMocks
    CapexDossierController controller;

    MockMvc mockMvc;
    ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(converter)
                .build();
    }

    @Test
    void search_urlIsApiV1_returns200WithSummaryList() throws Exception {
        DossierSummaryDto summary = new DossierSummaryDto();
        summary.setDossierCode("EXP/CAPEX/2026/00001");
        summary.setStateCode("DRAFT");

        PageResponseDto<DossierSummaryDto> page = PageResponseDto.<DossierSummaryDto>builder()
                .content(List.of(summary))
                .page(0).size(20).totalElements(1).totalPages(1)
                .build();

        when(service.search(any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/capex-dossier"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].dossierCode").value("EXP/CAPEX/2026/00001"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void get_urlIsApiV1_returns200WithDetailDto() throws Exception {
        UUID id = UUID.randomUUID();
        DossierDetailDto detail = new DossierDetailDto();
        detail.setDossierId(id);
        detail.setDossierCode("EXP/CAPEX/2026/00001");

        when(service.get(id)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/capex-dossier/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dossierId").value(id.toString()))
                .andExpect(jsonPath("$.dossierCode").value("EXP/CAPEX/2026/00001"));
    }

    @Test
    void create_returns201WithHeaderDto() throws Exception {
        CapexDossierDto body = new CapexDossierDto();
        body.setProjectCode("7004686");
        body.setProjectManagementCode("1059227");
        body.setSendDate(LocalDate.now());

        DossierHeaderDto header = new DossierHeaderDto();
        header.setDossierCode("EXP/CAPEX/2026/00001");
        header.setStateCode("DRAFT");

        when(service.create(any())).thenReturn(header);

        mockMvc.perform(post("/api/v1/capex-dossier")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.stateCode").value("DRAFT"))
                .andExpect(jsonPath("$.dossierCode").value("EXP/CAPEX/2026/00001"));
    }

    @Test
    void getDocuments_returnsListFromService() throws Exception {
        UUID id = UUID.randomUUID();
        DocumentDetailDto doc = new DocumentDetailDto();
        doc.setDocumentNumber("DOC-001");

        when(service.getDocuments(id)).thenReturn(List.of(doc));

        mockMvc.perform(get("/api/v1/capex-dossier/{id}/documents", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].documentNumber").value("DOC-001"));
    }
}
