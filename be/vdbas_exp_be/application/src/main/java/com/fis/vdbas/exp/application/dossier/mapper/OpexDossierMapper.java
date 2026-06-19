package com.fis.vdbas.exp.application.dossier.mapper;

import com.fis.vdbas.exp.application.dossier.dto.OpexDossierCreateRequest;
import com.fis.vdbas.exp.application.dossier.dto.OpexDossierUpdateRequest;
import com.fis.vdbas.exp.domain.dossier.ExpDossier;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper request OPEX ↔ {@link ExpDossier}.
 * <p>Khác {@code DossierMapper} (CAPEX): OPEX cho phép cập nhật {@code organizationCode}/{@code treasuryCode}.
 * Mọi field backend-managed/audit/immutable KHÔNG nhận từ request (ignore) — tên LOV do service fill.</p>
 */
@Mapper(componentModel = "spring")
public interface OpexDossierMapper {

    /** Tạo entity từ create request — chỉ map field user-input OPEX. */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "FStatus", ignore = true)
    @Mapping(target = "dossierCode", ignore = true)
    @Mapping(target = "dossierTypeCode", ignore = true)
    @Mapping(target = "workflowCode", ignore = true)
    @Mapping(target = "treasuryName", ignore = true)
    @Mapping(target = "projectCode", ignore = true)
    @Mapping(target = "projectName", ignore = true)
    @Mapping(target = "projectSpecificCode", ignore = true)
    @Mapping(target = "projectSpecificName", ignore = true)
    @Mapping(target = "organizationName", ignore = true)
    @Mapping(target = "assignUser", ignore = true)
    @Mapping(target = "sla", ignore = true)
    @Mapping(target = "hashInfo", ignore = true)
    @Mapping(target = "completedDate", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    ExpDossier toEntity(OpexDossierCreateRequest request);

    /**
     * Cập nhật field user-input OPEX vào entity sẵn có.
     * <p>OPEX cho cập nhật organizationCode/treasuryCode/sendDate; dataSourceCode/dossierTypeCode
     * immutable (VAL-17) → ignore. audit/id/version/dossierCode/fStatus giữ nguyên.</p>
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "FStatus", ignore = true)
    @Mapping(target = "dossierCode", ignore = true)
    @Mapping(target = "dossierTypeCode", ignore = true)
    @Mapping(target = "workflowCode", ignore = true)
    @Mapping(target = "dataSourceCode", ignore = true)
    @Mapping(target = "treasuryName", ignore = true)
    @Mapping(target = "projectCode", ignore = true)
    @Mapping(target = "projectName", ignore = true)
    @Mapping(target = "projectSpecificCode", ignore = true)
    @Mapping(target = "projectSpecificName", ignore = true)
    @Mapping(target = "organizationName", ignore = true)
    @Mapping(target = "assignUser", ignore = true)
    @Mapping(target = "sla", ignore = true)
    @Mapping(target = "hashInfo", ignore = true)
    @Mapping(target = "completedDate", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    void updateEntityFromDto(OpexDossierUpdateRequest request, @MappingTarget ExpDossier entity);
}
