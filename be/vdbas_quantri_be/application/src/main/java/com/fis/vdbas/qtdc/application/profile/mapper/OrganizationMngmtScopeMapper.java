package com.fis.vdbas.qtdc.application.profile.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationMngmtScopeDto;
import com.fis.vdbas.qtdc.domain.profile.OrganizationMngmtScope;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OrganizationMngmtScopeMapper extends BooleanIntegerMapper {

    @Mapping(source = "managerOrganization.orgName", target = "managerOrgName")
    @Mapping(source = "targetOrganization.orgName", target = "targetOrgName")
    OrganizationMngmtScopeDto toDto(OrganizationMngmtScope entity);

    OrganizationMngmtScope toEntity(OrganizationMngmtScopeDto dto);

    List<OrganizationMngmtScopeDto> toDtoList(List<OrganizationMngmtScope> entities);

    void updateEntityFromDto(OrganizationMngmtScopeDto dto, @MappingTarget OrganizationMngmtScope entity);
}