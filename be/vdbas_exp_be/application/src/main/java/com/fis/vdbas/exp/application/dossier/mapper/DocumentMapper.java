package com.fis.vdbas.exp.application.dossier.mapper;

import com.fis.vdbas.exp.application.dossier.dto.AddDocumentRequest;
import com.fis.vdbas.exp.application.dossier.dto.DocumentDetailDto;
import com.fis.vdbas.exp.application.dossier.dto.DocumentSummaryDto;
import com.fis.vdbas.exp.domain.dossier.ExpDocument;
import org.mapstruct.IterableMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.util.List;

/** MapStruct mapper {@link ExpDocument} ↔ DTO. */
@Mapper(componentModel = "spring")
public interface DocumentMapper {

    @Named("toSummaryDto")
    DocumentSummaryDto toSummaryDto(ExpDocument entity);

    @IterableMapping(qualifiedByName = "toSummaryDto")
    List<DocumentSummaryDto> toSummaryDtoList(List<ExpDocument> entities);

    @Mapping(target = "createdDate", source = "createdAt")
    @Mapping(target = "updatedDate", source = "updatedAt")
    DocumentDetailDto toDetailDto(ExpDocument entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dossierId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "seqNo", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ExpDocument toEntity(AddDocumentRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dossierId", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "seqNo", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromDto(AddDocumentRequest request, @MappingTarget ExpDocument entity);
}
