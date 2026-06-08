package com.fis.vdbas.qtdc.application.administrative.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.administrative.dto.AdministrativeUnitDto;
import com.fis.vdbas.qtdc.domain.administrative.AdministrativeUnit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AdministrativeUnitMapper extends BooleanIntegerMapper {

    AdministrativeUnitDto toDto(AdministrativeUnit entity);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "parent", ignore = true)
    AdministrativeUnit toEntity(AdministrativeUnitDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "parent", ignore = true)
    void updateEntityFromDto(AdministrativeUnitDto dto, @org.mapstruct.MappingTarget AdministrativeUnit entity);

    List<AdministrativeUnitDto> toDtoList(List<AdministrativeUnit> entities);
}