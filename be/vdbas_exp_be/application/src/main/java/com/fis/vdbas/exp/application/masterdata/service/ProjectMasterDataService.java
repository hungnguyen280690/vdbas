package com.fis.vdbas.exp.application.masterdata.service;

import com.fis.vdbas.exp.application.masterdata.dto.ProjectInfoDto;
import com.fis.vdbas.exp.application.masterdata.mapper.ProjectMapper;
import com.fis.vdbas.exp.domain.project.ExpProject;
import com.fis.vdbas.exp.domain.project.ExpProjectManagement;
import com.fis.vdbas.exp.domain.project.ExpProjectManagementRepository;
import com.fis.vdbas.exp.domain.project.ExpProjectRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectMasterDataService {

    private final ExpProjectRepository projectRepository;
    private final ExpProjectManagementRepository managementRepository;
    private final ProjectMapper mapper;

    public List<ProjectInfoDto> searchProjects(String code, String name) {
        Specification<ExpProject> spec = buildSpec(code, name);
        List<ExpProject> projects = projectRepository.findAll(spec);

        Set<String> mgmtCodes = projects.stream()
                .map(ExpProject::getProjectManagementCode)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, String> mgmtNames = managementRepository.findAllById(mgmtCodes).stream()
                .collect(Collectors.toMap(
                        ExpProjectManagement::getProjectManagementCode,
                        ExpProjectManagement::getProjectManagementName));

        return projects.stream().map(p -> {
            ProjectInfoDto dto = mapper.toDto(p);
            dto.setProjectManagementName(mgmtNames.get(p.getProjectManagementCode()));
            return dto;
        }).toList();
    }

    private Specification<ExpProject> buildSpec(String code, String name) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (code != null && !code.isBlank())
                predicates.add(cb.like(cb.lower(root.get("projectCode")), "%" + code.toLowerCase() + "%"));
            if (name != null && !name.isBlank())
                predicates.add(cb.like(cb.lower(root.get("projectName")), "%" + name.toLowerCase() + "%"));
            return predicates.isEmpty() ? cb.conjunction()
                    : cb.or(predicates.toArray(Predicate[]::new));
        };
    }
}
