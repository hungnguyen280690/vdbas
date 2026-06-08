package com.fis.vdbas.qtdc.application.user.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.user.dto.UserDto;
import com.fis.vdbas.qtdc.domain.user.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper extends BooleanIntegerMapper {

    UserDto toDto(User entity);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "ownerPerson", ignore = true)
    @Mapping(target = "ownerOrganization", ignore = true)
    User toEntity(UserDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "externalId", ignore = true)
    @Mapping(target = "authSource", ignore = true)
    @Mapping(target = "ownerPerson", ignore = true)
    @Mapping(target = "ownerOrganization", ignore = true)
    @Mapping(target = "isOrgAdmin", ignore = true)
    void updateEntityFromDto(UserDto dto, @org.mapstruct.MappingTarget User entity);

    List<UserDto> toDtoList(List<User> entities);
}