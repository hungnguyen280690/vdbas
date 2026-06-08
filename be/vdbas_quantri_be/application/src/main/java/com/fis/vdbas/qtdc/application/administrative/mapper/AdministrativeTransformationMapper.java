package com.fis.vdbas.qtdc.application.administrative.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.qtdc.application.administrative.dto.AdministrativeTransformationDto;
import com.fis.vdbas.qtdc.domain.administrative.AdministrativeTransformation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AdministrativeTransformationMapper extends BooleanIntegerMapper {

    @Mapping(target = "sourceUnitName", source = "sourceUnit.unitName")
    @Mapping(target = "sourceUnitCode", source = "sourceUnit.unitCode")
    @Mapping(target = "sourceUnitStartDate", source = "sourceUnit.startDate")
    @Mapping(target = "sourceUnitEndDate", source = "sourceUnit.endDate")
    @Mapping(target = "targetUnitName", source = "targetUnit.unitName")
    @Mapping(target = "targetUnitCode", source = "targetUnit.unitCode")
    @Mapping(target = "targetUnitStartDate", source = "targetUnit.startDate")
    @Mapping(target = "targetUnitEndDate", source = "targetUnit.endDate")
    AdministrativeTransformationDto toDto(AdministrativeTransformation entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sourceUnitId", ignore = true)
    @Mapping(target = "targetUnitId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "sourceUnit", ignore = true)
    @Mapping(target = "targetUnit", ignore = true)
    AdministrativeTransformation toEntity(AdministrativeTransformationDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "sourceUnitId", ignore = true)
    @Mapping(target = "targetUnitId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "sourceUnit", ignore = true)
    @Mapping(target = "targetUnit", ignore = true)
    void updateEntityFromDto(AdministrativeTransformationDto dto,
            @org.mapstruct.MappingTarget AdministrativeTransformation entity);

    List<AdministrativeTransformationDto> toDtoList(List<AdministrativeTransformation> entities);
}