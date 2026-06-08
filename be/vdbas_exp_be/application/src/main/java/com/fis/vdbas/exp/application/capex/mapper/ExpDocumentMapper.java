package com.fis.vdbas.exp.application.capex.mapper;

import com.fis.vdbas.exp.application.capex.dto.DocumentDetailDto;
import com.fis.vdbas.exp.application.capex.dto.DocumentLineDto;
import com.fis.vdbas.exp.domain.document.ExpDocument;
import com.fis.vdbas.exp.domain.document.ExpDocumentLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ExpDocumentMapper {

    @Mapping(target = "currencyCode",             source = "currencyTypeCode")
    @Mapping(target = "paymentRequestAmount",     ignore = true)
    @Mapping(target = "paymentRequestAmountVnd",  ignore = true)
    @Mapping(target = "lines",                    ignore = true)
    DocumentDetailDto toDto(ExpDocument entity);

    @Mapping(target = "lineId",                    source = "documentLineId")
    @Mapping(target = "amount",                    source = "paymentRequestAmount")
    @Mapping(target = "amountVnd",                 source = "paymentRequestAmountVnd")
    @Mapping(target = "glSegments.segment2",       source = "glSegment2")
    @Mapping(target = "glSegments.segment4",       source = "glSegment4")
    @Mapping(target = "glSegments.segment5",       source = "glSegment5")
    @Mapping(target = "glSegments.segment8",       source = "glSegment8")
    @Mapping(target = "glSegments.segment9",       source = "glSegment9")
    @Mapping(target = "glSegments.segment10",      source = "glSegment10")
    @Mapping(target = "glSegments.segment12",      source = "glSegment12")
    @Mapping(target = "glSegments.segment13",      source = "glSegment13")
    DocumentLineDto toLineDto(ExpDocumentLine entity);
}
