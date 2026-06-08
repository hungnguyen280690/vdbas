package com.fis.vdbas.exp.api.masterdata;

import com.fis.vdbas.exp.application.masterdata.dto.ProjectInfoDto;
import com.fis.vdbas.exp.application.masterdata.service.ProjectMasterDataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-layer test for {@link MasterDataController}.
 *
 * <p>NOTE: Spring Boot 4.0 relocated the {@code @WebMvcTest} / {@code @AutoConfigureMockMvc}
 * test slice into a dedicated {@code spring-boot-webmvc-test} artifact, which is not present
 * in the offline Maven repository (corporate Nexus unreachable). This test therefore uses
 * {@link MockMvcBuilders#standaloneSetup} to exercise the controller in isolation with a
 * Mockito-mocked service. The base {@code MockMvc} support ships in {@code spring-test} and
 * is available offline.
 */
@ExtendWith(MockitoExtension.class)
class MasterDataControllerTest {

    @Mock
    ProjectMasterDataService service;

    @InjectMocks
    MasterDataController controller;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getProjects_noParams_returns200WithList() throws Exception {
        ProjectInfoDto dto = new ProjectInfoDto();
        dto.setProjectCode("7004686");
        dto.setProjectName("Dự án A");
        dto.setProjectType("Military");
        dto.setProjectManagementCode("1059227");
        dto.setProjectManagementName("BQL Cục thông tin BQP");

        when(service.searchProjects(any(), any())).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/master-data/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].projectCode").value("7004686"))
                .andExpect(jsonPath("$[0].projectManagementName").value("BQL Cục thông tin BQP"));
    }

    @Test
    void getProjects_withCodeParam_passesCodeToService() throws Exception {
        when(service.searchProjects("7004", null)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/master-data/projects").param("code", "7004"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
