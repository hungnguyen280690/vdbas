package com.fis.vdbas.exp.application.dossier.mapper;

import com.fis.vdbas.exp.application.dossier.dto.OpexAddDocumentRequest;
import com.fis.vdbas.exp.domain.dossier.ExpDocument;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper request chứng từ OPEX → {@link ExpDocument}.
 * <p>Khác {@code DocumentMapper} (CAPEX): OPEX nhận {@code treasuryCode}, KHÔNG nhận
 * {@code documentNo}/{@code documentName} (backend sinh — GAP-14). {@code treasuryName} service fill.</p>
 */
@Mapper(componentModel = "spring")
public interface OpexDocumentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dossierId", ignore = true)
    @Mapping(target = "treasuryName", ignore = true)
    @Mapping(target = "documentName", ignore = true)
    @Mapping(target = "documentNo", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "seqNo", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    ExpDocument toEntity(OpexAddDocumentRequest request);

    /** Cập nhật field user-input; documentNo/documentName/treasuryName giữ nguyên (backend-managed). */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dossierId", ignore = true)
    @Mapping(target = "treasuryName", ignore = true)
    @Mapping(target = "documentName", ignore = true)
    @Mapping(target = "documentNo", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "seqNo", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "updatedDate", ignore = true)
    void updateEntityFromDto(OpexAddDocumentRequest request, @MappingTarget ExpDocument entity);
}
