package com.fis.vdbas.qtdc.application.profile.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.profile.dto.PersonProfileDto;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPerson;
import com.fis.vdbas.qtdc.domain.profile.PersonProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PersonProfileMapper extends BooleanIntegerMapper {

    @Mapping(target = "orgId", ignore = true)
    @Mapping(target = "orgCode", ignore = true)
    @Mapping(target = "orgName", ignore = true)
    @Mapping(target = "positionCode", ignore = true)
    @Mapping(target = "positionName", ignore = true)
    PersonProfileDto toDto(PersonProfile entity);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    PersonProfile toEntity(PersonProfileDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    // @Mapping(target = "deleted", ignore = true)
    void updateEntityFromDto(PersonProfileDto dto, @org.mapstruct.MappingTarget PersonProfile entity);

    List<PersonProfileDto> toDtoList(List<PersonProfile> entities);

    @Mapping(target = "id", source = "person.id")
    @Mapping(target = "fullName", source = "person.fullName")
    @Mapping(target = "email", source = "person.email")
    @Mapping(target = "phone", source = "person.phone")
    @Mapping(target = "identityNumber", source = "person.identityNumber")
    @Mapping(target = "gender", source = "person.gender")
    @Mapping(target = "internal", source = "person.internal")
    @Mapping(target = "createdAt", source = "person.createdAt")
    @Mapping(target = "createdBy", source = "person.createdBy")
    @Mapping(target = "updatedAt", source = "person.updatedAt")
    @Mapping(target = "updatedBy", source = "person.updatedBy")
    @Mapping(target = "orgCode", source = "organization.orgCode")
    @Mapping(target = "orgName", source = "organization.orgName")
    @Mapping(target = "deleted", source = "person.deleted")
    PersonProfileDto fromOrganizationPerson(OrganizationPerson entity);

    List<PersonProfileDto> fromOrganizationPersonList(List<OrganizationPerson> entities);
}