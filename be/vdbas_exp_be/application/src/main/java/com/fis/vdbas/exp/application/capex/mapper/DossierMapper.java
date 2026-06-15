package com.fis.vdbas.exp.application.capex.mapper;

import com.fis.vdbas.exp.application.capex.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DossierHeaderDto;
import com.fis.vdbas.exp.application.capex.dto.DossierSummaryDto;
import com.fis.vdbas.exp.domain.capex.ExpDossier;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface DossierMapper {

    @Mapping(source = "createdAt", target = "createdDate")
    @Mapping(source = "updatedAt", target = "updatedDate")
    DossierHeaderDto toHeaderDto(ExpDossier entity);

    @Mapping(source = "createdAt", target = "createdDate")
    @Mapping(source = "updatedAt", target = "updatedDate")
    DossierDetailDto toDetailDto(ExpDossier entity);

    @Mapping(source = "createdAt", target = "createdDate")
    @Mapping(source = "sendDate", target = "sendDate")
    DossierSummaryDto toSummaryDto(ExpDossier entity);

    List<DossierSummaryDto> toSummaryDtoList(List<ExpDossier> list);
}
