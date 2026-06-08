package com.fis.vdbas.exp.application.capex.mapper;

import com.fis.vdbas.exp.application.capex.dto.ApprovalLogEntryDto;
import com.fis.vdbas.exp.domain.approval.ExpApprovalLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ExpApprovalLogMapper {

    @Mapping(target = "logId", source = "approvalLogId")
    ApprovalLogEntryDto toDto(ExpApprovalLog entity);
}
