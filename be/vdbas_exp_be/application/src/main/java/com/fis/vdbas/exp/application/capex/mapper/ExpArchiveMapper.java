package com.fis.vdbas.exp.application.capex.mapper;

import com.fis.vdbas.exp.application.capex.dto.AttachmentInfoDto;
import com.fis.vdbas.exp.domain.approval.ExpArchive;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ExpArchiveMapper {

    @Mapping(target = "docType",      source = "archiveType")
    @Mapping(target = "note",         source = "description")
    @Mapping(target = "uploadedBy",   source = "createdBy")
    @Mapping(target = "uploadedDate", source = "createdDate")
    @Mapping(target = "fileSize",     ignore = true)
    AttachmentInfoDto toDto(ExpArchive entity);
}
