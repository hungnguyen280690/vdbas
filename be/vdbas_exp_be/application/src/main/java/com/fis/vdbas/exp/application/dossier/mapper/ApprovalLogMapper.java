package com.fis.vdbas.exp.application.dossier.mapper;

import com.fis.vdbas.exp.application.dossier.dto.ApprovalLogEntryDto;
import com.fis.vdbas.exp.domain.dossier.ExpApprovalLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/** MapStruct mapper {@link ExpApprovalLog} → DTO. */
@Mapper(componentModel = "spring")
public interface ApprovalLogMapper {

    @Mapping(target = "stateLabel", ignore = true)
    @Mapping(target = "digitalSigned", ignore = true)
    ApprovalLogEntryDto toDto(ExpApprovalLog entity);

    List<ApprovalLogEntryDto> toDtoList(List<ExpApprovalLog> entities);
}
