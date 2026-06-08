package com.fis.vdbas.qtdc.application.auth.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.auth.dto.RolePermissionDto;
import com.fis.vdbas.qtdc.domain.auth.RolePermission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface RolePermissionMapper extends BooleanIntegerMapper {
    RolePermissionDto toDto(RolePermission entity);

    @Mapping(target = "appCode", ignore = true)
    @Mapping(target = "roleCode", ignore = true)
    @Mapping(target = "permissionCode", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "permission", ignore = true)
    RolePermission toEntity(RolePermissionDto dto);

    @Mapping(target = "appCode", ignore = true)
    @Mapping(target = "roleCode", ignore = true)
    @Mapping(target = "permissionCode", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "permission", ignore = true)
    void updateEntityFromDto(RolePermissionDto dto, @org.mapstruct.MappingTarget RolePermission entity);

    List<RolePermissionDto> toDtoList(List<RolePermission> entities);
}