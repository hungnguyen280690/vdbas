package com.fis.vdbas.exp.application.masterdata.mapper;

import com.fis.vdbas.exp.application.masterdata.dto.ProjectInfoDto;
import com.fis.vdbas.exp.domain.project.ExpProject;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProjectMapper {

    @Mapping(target = "projectType",           source = "projectTypeCode")
    @Mapping(target = "projectManagementName", ignore = true)
    ProjectInfoDto toDto(ExpProject entity);
}
