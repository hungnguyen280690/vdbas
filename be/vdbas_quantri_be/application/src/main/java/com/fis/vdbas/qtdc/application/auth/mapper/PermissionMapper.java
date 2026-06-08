package com.fis.vdbas.qtdc.application.auth.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.auth.dto.PermissionDto;
import com.fis.vdbas.qtdc.domain.auth.Permission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PermissionMapper extends BooleanIntegerMapper {
    PermissionDto toDto(Permission entity);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "application", ignore = true)
    Permission toEntity(PermissionDto dto);

    @Mapping(target = "appCode", ignore = true)
    @Mapping(target = "permissionCode", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "application", ignore = true)
    void updateEntityFromDto(PermissionDto dto, @org.mapstruct.MappingTarget Permission entity);

    List<PermissionDto> toDtoList(List<Permission> entities);
}