package com.fis.vdbas.qtdc.application.profile.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationPersonDto;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPerson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrganizationPersonMapper extends BooleanIntegerMapper {

    @Mapping(target = "fullName", source = "person.fullName")
    @Mapping(target = "orgName", source = "organization.orgName")
    @Mapping(target = "orgCode", source = "organization.orgCode")
    OrganizationPersonDto toDto(OrganizationPerson entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "person", ignore = true)
    @Mapping(target = "organization", ignore = true)
    OrganizationPerson toEntity(OrganizationPersonDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "person", ignore = true)
    @Mapping(target = "organization", ignore = true)
    void updateEntityFromDto(OrganizationPersonDto dto, @MappingTarget OrganizationPerson entity);

    List<OrganizationPersonDto> toDtoList(List<OrganizationPerson> entities);
}