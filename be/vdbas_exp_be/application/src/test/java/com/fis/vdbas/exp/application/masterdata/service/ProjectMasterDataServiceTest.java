package com.fis.vdbas.exp.application.masterdata.service;

import com.fis.vdbas.exp.application.masterdata.dto.ProjectInfoDto;
import com.fis.vdbas.exp.application.masterdata.mapper.ProjectMapper;
import com.fis.vdbas.exp.domain.project.ExpProject;
import com.fis.vdbas.exp.domain.project.ExpProjectManagement;
import com.fis.vdbas.exp.domain.project.ExpProjectManagementRepository;
import com.fis.vdbas.exp.domain.project.ExpProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectMasterDataServiceTest {

    @Mock ExpProjectRepository projectRepository;
    @Mock ExpProjectManagementRepository managementRepository;
    @Mock ProjectMapper mapper;

    @InjectMocks ProjectMasterDataService service;

    @Test
    void searchProjects_noFilters_returnsAllWithManagementNames() {
        ExpProject project = new ExpProject();
        project.setProjectCode("7004686");
        project.setProjectName("Dự án A");
        project.setProjectManagementCode("1059227");
        project.setProjectTypeCode("Military");

        ProjectInfoDto dto = new ProjectInfoDto();
        dto.setProjectCode("7004686");
        dto.setProjectName("Dự án A");
        dto.setProjectType("Military");
        dto.setProjectManagementCode("1059227");

        ExpProjectManagement mgmt = new ExpProjectManagement();
        mgmt.setProjectManagementCode("1059227");
        mgmt.setProjectManagementName("BQL Cục thông tin BQP");

        when(projectRepository.findAll(any(Specification.class))).thenReturn(List.of(project));
        when(mapper.toDto(project)).thenReturn(dto);
        when(managementRepository.findAllById(Set.of("1059227"))).thenReturn(List.of(mgmt));

        List<ProjectInfoDto> result = service.searchProjects(null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProjectManagementName()).isEqualTo("BQL Cục thông tin BQP");
    }

    @Test
    void searchProjects_withCodeFilter_passesSpecificationToRepository() {
        when(projectRepository.findAll(any(Specification.class))).thenReturn(List.of());
        when(managementRepository.findAllById(any())).thenReturn(List.of());

        List<ProjectInfoDto> result = service.searchProjects("7004", null);

        assertThat(result).isEmpty();
        verify(projectRepository).findAll(any(Specification.class));
    }

    @Test
    void searchProjects_projectWithNullManagementCode_doesNotThrow() {
        ExpProject project = new ExpProject();
        project.setProjectCode("P001");
        project.setProjectManagementCode(null);

        ProjectInfoDto dto = new ProjectInfoDto();
        dto.setProjectCode("P001");

        when(projectRepository.findAll(any(Specification.class))).thenReturn(List.of(project));
        when(mapper.toDto(project)).thenReturn(dto);
        when(managementRepository.findAllById(Set.of())).thenReturn(List.of());

        List<ProjectInfoDto> result = service.searchProjects(null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProjectManagementName()).isNull();
    }
}
