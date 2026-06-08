package com.fis.vdbas.qtdc.application.user.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.user.dto.UserRoleDto;
import com.fis.vdbas.qtdc.domain.user.UserRole;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserRoleMapper extends BooleanIntegerMapper {

    UserRoleDto toDto(UserRole entity);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "role", ignore = true)
    UserRole toEntity(UserRoleDto dto);

    // @Mapping(target = "userId", ignore = true)
    // @Mapping(target = "appCode", ignore = true)
    // @Mapping(target = "roleCode", ignore = true)
    // @Mapping(target = "createdAt", ignore = true)
    // @Mapping(target = "createdBy", ignore = true)
    // @Mapping(target = "user", ignore = true)
    // @Mapping(target = "role", ignore = true)
    // void updateEntityFromDto(UserRoleDto dto, @org.mapstruct.MappingTarget
    // UserRole entity);

    List<UserRoleDto> toDtoList(List<UserRole> entities);
}