package com.fis.vdbas.exp.application.dossier.mapper;

import com.fis.vdbas.exp.application.dossier.dto.DossierCreateRequest;
import com.fis.vdbas.exp.application.dossier.dto.DossierDetailDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierSummaryDto;
import com.fis.vdbas.exp.application.dossier.dto.DossierUpdateRequest;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper {@link ExpDossier} ↔ DTO.
 * <p>Các field tính toán (fStatusName, dataSourceName, documents, totals) do service set —
 * mapper bỏ qua. Field backend-managed/audit không nhận từ request.</p>
 */
@Mapper(componentModel = "spring")
public interface DossierMapper {

    @Mapping(target = "createdDate", source = "createdAt")
    DossierSummaryDto toSummaryDto(ExpDossier entity);

    @Mapping(target = "createdDate", source = "createdAt")
    @Mapping(target = "updatedDate", source = "updatedAt")
    @Mapping(target = "dossierTypeName", ignore = true)
    DossierDetailDto toDetailDto(ExpDossier entity);

    /** Tạo entity từ request — chỉ map field user-input. */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "FStatus", ignore = true)
    @Mapping(target = "dossierCode", ignore = true)
    @Mapping(target = "workflowCode", ignore = true)
    @Mapping(target = "treasuryCode", ignore = true)
    @Mapping(target = "treasuryName", ignore = true)
    @Mapping(target = "projectName", ignore = true)
    @Mapping(target = "projectSpecificName", ignore = true)
    @Mapping(target = "organizationName", ignore = true)
    @Mapping(target = "assignUser", ignore = true)
    @Mapping(target = "sla", ignore = true)
    @Mapping(target = "hashInfo", ignore = true)
    @Mapping(target = "completedDate", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ExpDossier toEntity(DossierCreateRequest request);

    /** Cập nhật field user-input vào entity sẵn có (immutable/backend fields giữ nguyên). */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "FStatus", ignore = true)
    @Mapping(target = "dossierCode", ignore = true)
    @Mapping(target = "dossierTypeCode", ignore = true)
    @Mapping(target = "workflowCode", ignore = true)
    @Mapping(target = "dataSourceCode", ignore = true)
    @Mapping(target = "treasuryCode", ignore = true)
    @Mapping(target = "treasuryName", ignore = true)
    @Mapping(target = "projectName", ignore = true)
    @Mapping(target = "projectSpecificName", ignore = true)
    @Mapping(target = "organizationCode", ignore = true)
    @Mapping(target = "organizationName", ignore = true)
    @Mapping(target = "assignUser", ignore = true)
    @Mapping(target = "sla", ignore = true)
    @Mapping(target = "hashInfo", ignore = true)
    @Mapping(target = "completedDate", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromDto(DossierUpdateRequest request, @MappingTarget ExpDossier entity);
}
