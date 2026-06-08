package com.fis.vdbas.qtdc.application.auth.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.auth.dto.RoleDto;
import com.fis.vdbas.qtdc.domain.auth.Role;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RoleMapper extends BooleanIntegerMapper {
    RoleDto toDto(Role entity);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "application", ignore = true)
    Role toEntity(RoleDto dto);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "roleName", source = "roleName")
    @Mapping(target = "deleted", source = "deleted")
    void updateEntityFromDto(RoleDto dto, @org.mapstruct.MappingTarget Role entity);

    List<RoleDto> toDtoList(List<Role> entities);
}