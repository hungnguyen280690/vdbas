package com.fis.vdbas.qtdc.application.profile.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationProfileDto;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrganizationProfileMapper extends BooleanIntegerMapper {

    @Mapping(target = "parentCode", source = "parent.orgCode")
    @Mapping(target = "parentName", source = "parent.orgName")
    @Mapping(target = "unitCode", source = "administrativeUnit.unitCode")
    @Mapping(target = "unitName", source = "administrativeUnit.unitName")
    OrganizationProfileDto toDto(OrganizationProfile entity);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    // @Mapping(target = "orgLevel", source = "orgLevel")
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "administrativeUnit", ignore = true)
    @Mapping(target = "id", ignore = true)
    OrganizationProfile toEntity(OrganizationProfileDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    // @Mapping(target = "orgLevel", source = "orgLevel")
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "administrativeUnit", ignore = true)
    void updateEntityFromDto(OrganizationProfileDto dto, @org.mapstruct.MappingTarget OrganizationProfile entity);

    List<OrganizationProfileDto> toDtoList(List<OrganizationProfile> entities);
}