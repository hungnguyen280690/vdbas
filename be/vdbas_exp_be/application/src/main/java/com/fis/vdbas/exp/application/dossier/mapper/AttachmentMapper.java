package com.fis.vdbas.exp.application.dossier.mapper;

import com.fis.vdbas.exp.application.dossier.dto.AttachmentInfoDto;
import com.fis.vdbas.exp.domain.dossier.ExpDossierAttachment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/** MapStruct mapper {@link ExpDossierAttachment} → DTO (KHÔNG expose filePath). */
@Mapper(componentModel = "spring")
public interface AttachmentMapper {

    @Mapping(target = "createdDate", source = "createdAt")
    @Mapping(target = "fileSizeDisplay", ignore = true)
    @Mapping(target = "attachmentTypeName", ignore = true)
    AttachmentInfoDto toDto(ExpDossierAttachment entity);

    List<AttachmentInfoDto> toDtoList(List<ExpDossierAttachment> entities);
}
