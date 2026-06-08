package com.fis.vdbas.exp.application.category.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.exp.application.category.dto.CategoryGroupDto;
import com.fis.vdbas.exp.domain.category.CategoryGroup;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryGroupMapper extends BooleanIntegerMapper {

    @Mapping(target = "extAttributes", ignore = true)
    CategoryGroupDto toDto(CategoryGroup entity);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "extAttributes", ignore = true)
    CategoryGroup toEntity(CategoryGroupDto dto);

    // @Mapping(target = "groupCode", ignore = true)
    // @Mapping(target = "createdAt", ignore = true)
    // @Mapping(target = "createdBy", ignore = true)
    // @Mapping(target = "updatedAt", ignore = true)
    // @Mapping(target = "updatedBy", ignore = true)
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "groupName", source = "groupName")
    @Mapping(target = "active", source = "active")
    @Mapping(target = "deleted", source = "deleted")
    void updateEntityFromDto(CategoryGroupDto dto, @org.mapstruct.MappingTarget CategoryGroup entity);

    List<CategoryGroupDto> toDtoList(List<CategoryGroup> entities);
}
