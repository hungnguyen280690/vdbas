package com.fis.vdbas.exp.application.category.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.exp.application.category.dto.CategoryDto;
import com.fis.vdbas.exp.application.category.dto.CategoryTreeDto;
import com.fis.vdbas.exp.domain.category.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper extends BooleanIntegerMapper {

    @Mapping(target = "extAttributes", ignore = true)
    CategoryDto toDto(Category entity);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "extAttributes", ignore = true)
    Category toEntity(CategoryDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "extAttributes", ignore = true)
    void updateEntityFromDto(CategoryDto dto, @org.mapstruct.MappingTarget Category entity);

    List<CategoryDto> toDtoList(List<Category> entities);

    @Mapping(target = "name", source = "itemName")
    @Mapping(target = "code", source = "itemCode")
    @Mapping(target = "level", source = "catLevel")
    @Mapping(target = "children", ignore = true)
    CategoryTreeDto toTreeDto(Category entity);

    @Mapping(target = "name", source = "itemName")
    @Mapping(target = "code", source = "itemCode")
    @Mapping(target = "level", source = "catLevel")
    @Mapping(target = "children", ignore = true)
    CategoryTreeDto toTreeDto(CategoryDto dto);
}
