package com.fis.vdbas.exp.application.capex.mapper;

import com.fis.vdbas.exp.application.capex.dto.AttachmentInfoDto;
import com.fis.vdbas.exp.domain.capex.ExpArchive;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface AttachmentMapper {
    @Mapping(source = "description", target = "note")
    @Mapping(source = "createdBy", target = "uploadedBy")
    @Mapping(source = "createdDate", target = "uploadedDate")
    AttachmentInfoDto toDto(ExpArchive entity);
    List<AttachmentInfoDto> toDtoList(List<ExpArchive> list);
}
