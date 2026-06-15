package com.fis.vdbas.exp.application.capex.mapper;

import com.fis.vdbas.exp.application.capex.dto.DocumentDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DocumentLineDto;
import com.fis.vdbas.exp.domain.capex.ExpDocument;
import com.fis.vdbas.exp.domain.capex.ExpDocumentLine;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface DocumentMapper {
    DocumentDetailDto toDetailDto(ExpDocument entity);
    List<DocumentDetailDto> toDetailDtoList(List<ExpDocument> list);
    DocumentLineDto toLineDto(ExpDocumentLine entity);
    List<DocumentLineDto> toLineDtoList(List<ExpDocumentLine> list);
}
