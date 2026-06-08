package com.fis.vdbas.exp.application.capex.mapper;

import com.fis.vdbas.common.mapper.BooleanIntegerMapper;
import com.fis.vdbas.exp.application.capex.dto.CapexDossierDto;
import com.fis.vdbas.exp.application.capex.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DossierHeaderDto;
import com.fis.vdbas.exp.application.capex.dto.DossierSummaryDto;
import com.fis.vdbas.exp.domain.capex.CapexDossier;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CapexDossierMapper extends BooleanIntegerMapper {

    CapexDossierDto toDto(CapexDossier entity);

    @Mapping(target = "dossierId",   ignore = true)
    @Mapping(target = "dossierCode", ignore = true)
    @Mapping(target = "stateCode",   ignore = true)
    @Mapping(target = "createdAt",   ignore = true)
    @Mapping(target = "createdBy",   ignore = true)
    @Mapping(target = "updatedAt",   ignore = true)
    @Mapping(target = "updatedBy",   ignore = true)
    @Mapping(target = "deleted",     ignore = true)
    @Mapping(target = "deleteReason", ignore = true)
    @Mapping(target = "endDate",     ignore = true)
    @Mapping(target = "dossierVersion", ignore = true)
    CapexDossier toEntity(CapexDossierDto dto);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "sendDate",              source = "sendDate")
    @Mapping(target = "projectCode",           source = "projectCode")
    @Mapping(target = "projectName",           source = "projectName")
    @Mapping(target = "projectSpecificCode",   source = "projectSpecificCode")
    @Mapping(target = "projectSpecificName",   source = "projectSpecificName")
    @Mapping(target = "projectManagementCode", source = "projectManagementCode")
    @Mapping(target = "projectManagementName", source = "projectManagementName")
    @Mapping(target = "dataSourceCode",        source = "dataSourceCode")
    @Mapping(target = "treasuryCode",          source = "treasuryCode")
    void updateEntityFromDto(CapexDossierDto dto, @MappingTarget CapexDossier entity);

    List<CapexDossierDto> toDtoList(List<CapexDossier> entities);

    @Mapping(target = "createdDate", source = "createdAt")
    @Mapping(target = "updatedDate", source = "updatedAt")
    @Mapping(target = "version",     source = "dossierVersion")
    DossierHeaderDto toHeaderDto(CapexDossier entity);

    @Mapping(target = "createdDate",    source = "createdAt")
    @Mapping(target = "totalAmountVnd", ignore = true)
    @Mapping(target = "documentCount",  ignore = true)
    DossierSummaryDto toSummaryDto(CapexDossier entity);

    @Mapping(target = "createdDate",   source = "createdAt")
    @Mapping(target = "updatedDate",   source = "updatedAt")
    @Mapping(target = "version",       source = "dossierVersion")
    @Mapping(target = "documents",     ignore = true)
    @Mapping(target = "attachments",   ignore = true)
    @Mapping(target = "approvalHistory", ignore = true)
    DossierDetailDto toDetailDto(CapexDossier entity);
}
