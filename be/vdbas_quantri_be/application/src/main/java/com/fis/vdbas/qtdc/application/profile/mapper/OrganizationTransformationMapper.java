package com.fis.vdbas.qtdc.application.profile.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationTransformationDto;
import com.fis.vdbas.qtdc.domain.profile.OrganizationTransformation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrganizationTransformationMapper extends BooleanIntegerMapper {

    OrganizationTransformationDto toDto(OrganizationTransformation entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sourceOrgId", ignore = true)
    @Mapping(target = "targetOrgId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "sourceOrganization", ignore = true)
    @Mapping(target = "targetOrganization", ignore = true)
    OrganizationTransformation toEntity(OrganizationTransformationDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sourceOrgId", ignore = true)
    @Mapping(target = "targetOrgId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "sourceOrganization", ignore = true)
    @Mapping(target = "targetOrganization", ignore = true)
    void updateEntityFromDto(OrganizationTransformationDto dto,
            @org.mapstruct.MappingTarget OrganizationTransformation entity);

    List<OrganizationTransformationDto> toDtoList(List<OrganizationTransformation> entities);
}