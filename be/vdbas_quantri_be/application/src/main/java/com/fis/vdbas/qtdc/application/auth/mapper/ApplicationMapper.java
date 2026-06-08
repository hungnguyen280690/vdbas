package com.fis.vdbas.qtdc.application.auth.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.auth.dto.ApplicationDto;
import com.fis.vdbas.qtdc.domain.auth.Application;

import org.mapstruct.BeanMapping;
import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ApplicationMapper extends BooleanIntegerMapper {
    @Mapping(target = "orgCode", source = "organization.orgCode")
    @Mapping(target = "orgName", source = "organization.orgName")
    ApplicationDto toDto(Application entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "organization", ignore = true)
    Application toEntity(ApplicationDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "appCode", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "organization", ignore = true)
    void updateEntityFromDto(ApplicationDto dto, @org.mapstruct.MappingTarget Application entity);

    @Named("toComboboxDto")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "appCode", source = "appCode")
    @Mapping(target = "appName", source = "appName")
    @Mapping(target = "appUrl", source = "appUrl")
    ApplicationDto toComboboxDto(Application entity);

    @IterableMapping(qualifiedByName = "toComboboxDto")
    List<ApplicationDto> toComboboxDto(List<Application> entity);

    List<ApplicationDto> toDtoList(List<Application> entities);
}